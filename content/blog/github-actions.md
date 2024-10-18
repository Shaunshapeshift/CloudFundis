---
title: 'GitHub Actions with Amazon Web Services'
date: 2023-07-28T10:50:47+10:00
authors: ['Alex Morton']
categories: ['AWS', 'GitHub']
description: 'Using GitHub Action to interact with Amazon Web Services'
thumbnail: '/images/posts/ghactions.png'
---

### Introduction

Recently I was asked to use GitHub Actions to take care of all CI/CD jobs and pipelines for a
customer. Many of these tasks would need to interact with Amazon Web Services (AWS) in one way or another, for
example deploying assets to S3 buckets, updating container services running on ECS etc.

Previously, I had only a little experience with GitHub Actions having spent more time with AWS native services,
GitLab and CircleCI. Through implementing a complete project using the platform I have learned some interesting things.
This blog post aims to outline these learnings and some cool features I came across along the way.

### Authentication

Security is priority zero in any project and when using an external platform to interact with AWS services
you always have to make decisions about how to authenticate with the AWS APIs. When using AWS services like
CodeBuild and CodePipeline you have the luxury of IAM role assumption, but oftentimes with external providers you
would have to store IAM access keys, which is not ideal. With this approach you have an immediate security concern and
have to manage regular key rotation etc.

GitHub Actions has this one waxed, and I see this as a big plus of this platform.

In comes OpenID Connect (OIDC). OpenID Connect (OIDC) allows your GitHub Actions workflows to access resources in
AWS, without needing to store the AWS credentials as long-lived GitHub secrets.

#### Adding the OIDC provider to AWS

Using Terraform you can add the GitHub OIDC provider and set up an IAM trust policy document as follows:

```python
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
  # Thumbprint as per docs - https://github.blog/changelog/2022-01-13-github-actions-update-on-oidc-based-deployments-to-aws/
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    effect = "Allow"
    principals {
      identifiers = [aws_iam_openid_connect_provider.github.arn]
      type        = "Federated"
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      values   = ["sts.amazonaws.com"]
      variable = "token.actions.githubusercontent.com:aud"
    }

    condition {
      test     = "StringLike"
      values   = [
        "repo:[INSERT_YOUR_GITHUB_REPO_NAME_HERE]:*"
      ]
      variable = "token.actions.githubusercontent.com:sub"
    }
  }
}
```

**Note:** You need to insert your GitHub repository name into the condition block at the bottom to ensure the role can only
be assumed by GitHub Actions workflows running for your repository.

Now that you have that sorted out, you can create an IAM role that can be assumed directly from your GitHub Actions
workflows. As an example, the following would allow GitHub to take actions on ECS. Note, resource \* might not be a good idea,
this is just for illustration purposes.

```python
resource "aws_iam_role" "github" {
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
  name = "github_role"
}

data "aws_iam_policy_document" "github" {
  statement {
    effect = "Allow"
    actions = [
      "ecs:DescribeTasks",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:RunTask"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:UpdateService",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "github" {
  policy = data.aws_iam_policy_document.github.json
  name = "github"
}

resource "aws_iam_role_policy_attachment" "github" {
  policy_arn = aws_iam_policy.github.arn
  role       = aws_iam_role.github.name
}
```

#### Assuming the role from your GitHub Actions workflows

GitHub have also made the actual process of assuming roles from within your workflows super simple. Using their pre-built
AWS authentication action you can assume your role with just a few lines of configuration.

The first thing you need to add to your workflow YML file is permissions to work with OIDC JWT tokens. These are used in
the authentication and authorization process:

```yaml
permissions:
    id-token: write # This is required for requesting the JWT
    contents: read # This is required for actions/checkout
```

Once this is in place, you can use the AWS authentication action as a step in your workflow:

```yaml
jobs:
    ECSDeploy:
        runs-on: ubuntu-latest
        steps:
            - name: Git clone the repository
              uses: actions/checkout@v3
            - name: Configure AWS Credentials
              uses: aws-actions/configure-aws-credentials@v2
              with:
                  role-to-assume: [Role ARN Here]
                  role-session-name: samplerolesession
                  aws-region: [AWS Region Here]
```

With that in place, any steps that run afterward in this workflow would be able to interact with AWS services, within the
scope of the permissions assigned to the IAM role.

### Nifty Features

#### Reusable workflows

Don't repeat yourself (DRY) code is always a winner and GitHub Actions makes this an easy philosophy to follow with reusable
workflows. For example, you could create a workflow to upload assets to an S3 bucket and pass in the bucket ID and IAM role
to assume as input variables. That way, the same workflow could be used for multiple jobs without copying and pasting the same
code all over the place.

You can also pass in secrets to a reusable workflow for sensitive imformation that should be obfuscated in output and sourced
from your GitHub Actions Secrets.

In order to do this you need to set the workflow trigger to the "workflow_call" event:

```yaml
name: S3 Assets Upload

on:
    workflow_call:
```

You can then define your inputs and secrets:

```yaml
name: S3 Assets Upload

on:
    workflow_call:
        inputs:
            aws_region:
                required: true
                type: string
            local_file_path:
                required: true
                type: string
        secrets:
            aws_account_id:
                required: true
            target_bucket:
                required: true
```

Set permissions to deal with AWS authentication:

```yaml
name: S3 Assets Upload

on:
    workflow_call:
        inputs:
            aws_region:
                required: true
                type: string
            local_file_path:
                required: true
                type: string
        secrets:
            aws_account_id:
                required: true
            target_bucket:
                required: true

permissions:
    id-token: write # This is required for requesting the JWT
    contents: read # This is required for actions/checkout
```

Now we can define our workflow steps:

```yaml
name: S3 Assets Upload

on:
    workflow_call:
        inputs:
            aws_region:
                required: true
                type: string
            local_file_path:
                required: true
                type: string
        secrets:
            aws_account_id:
                required: true
            target_bucket:
                required: true

permissions:
    id-token: write # This is required for requesting the JWT
    contents: read # This is required for actions/checkout

jobs:
    UploadToS3:
        runs-on: ubuntu-latest
        steps:
            - name: Git clone
              uses: actions/checkout@v3
            - name: configure aws credentials
              uses: aws-actions/configure-aws-credentials@v1.7.0
              with:
                  role-to-assume: arn:aws:iam::${{ secrets.aws_account_id }}:role/github
                  role-session-name: GitHub_S3_Upload
                  aws-region: ${{ inputs.aws_region }}
            - name: Upload to S3
              run: |
                  aws s3 sync ${{ inputs.local_file_path }} s3://${{ secrets.target_bucket }}
```

This would sync the local path specified as an input to the target bucket.

Now within our main workflow YML file, we can call this reusable workflow (assuming with saved our reusable workflow in our
repository as s3upload.yml):

```yaml
  UploadToS3:
    uses: [repo_name]/.github/workflows/s3upload.yml@main
    with:
      aws_region: eu-west-1
      local_file_path: "./test_folder"
    secrets:
      aws_account_id: ${{ secrets.AWS_ACCOUNT_ID }}
      target_bucket: ${{ secrets.TARGET_BUCKET }}
```

#### Manually Executable Workflows

You could use GitHub Actions to execute manual tasks. As an example, you could have tasks that turn on and off non production
environments, or perhaps you want to manually deploy to specific environments sometimes and not via automated pipelines.

To do this you can use another trigger event "workflow_dispatch".

```yaml
name: Manual Task

on:
    workflow_dispatch:
```

You can provide input choices to these jobs, so continuing with the example of starting up a specific environment, you could
provide a selector for this which presents itself in the GUI.

```yaml
name: Manual Task

on:
    workflow_dispatch:
        inputs:
            environment:
                description: 'The environment you wish to start'
                type: choice
                required: true
                options:
                    - DEVELOPMENT
                    - STAGING
                    - UAT
```

In the GitHub Actions GUI, you would see the following when you come to run the workflow manually:
![Execution GUI](/images/posts/manual_execution.png)

**Note** These manually executed actions need to exist in your default branch before they will become available for use.
