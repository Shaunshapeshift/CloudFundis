---
title: 'Terraform at Scale'
date: 2023-03-16T10:50:47+10:00
authors: ['Alex Morton']
categories: ['AWS', 'Terraform']
description: 'Some techniques to help manage Terraform at scale'
thumbnail: '/images/posts/terraform.webp'
---

### Introduction

Hashicorp Terraform is an infrastructure as code (IAC) tool that we use extensively at Cloud Fundis. We love the ease at
which the Hashicorp Configuration Language (HCL) allows us to declaratively define our infrastructure in Amazon Web
Services (AWS), or indeed other cloud providers. I won’t harp on about the benefits of having your infrastructure
defined as code and stored in version control, I think that drum has been banged ad infinitum by this point. Suffice to
say, if you’re not doing it you probably should be. It could be Terraform, CloudFormation, CDK, Pulumi....whatever
tickles your fancy – the benefits remain the same.

Now, onto the real point of this article. Terraform is pretty easy to use when there’s a relatively small code base, but
when you start to build up a large scale infrastructure things start to get a bit more tricky. Let’s dive into some
considerations and functionality that can help you tackle this.

### Separation

It is easier and faster to work with a smaller number of Terraform resources. When running Terraform commands such as
plan and apply, API calls are made to your cloud provider in order for Terraform to validate the status of resources and
determine the actions that should be taken. When the amount of resources becomes larger, these operations can take a long
time and slow down your development cycle significantly.

Another consideration for keeping resources in smaller groupings, is that the blast radius is smaller, should someone make a
mistake. Tools like Terraform provide you with great power, but also give you the ability to burn everything to the
ground very quickly if you’re not careful!

#### How to split things up?

This is going to take some consideration, in terms of what your infrastructure looks like and how you want to manage it.
There are many ways you could decide to do this, but you will need to give thought to what makes sense for your
environment.

A common pattern would be to split resources up by function, for example:

-   Networking components
-   Database(s)
-   Servers
-   Container Infrastructure
-   Serverless components
-   etc.

From our extensive experience deploying for large customers, the time it takes for Terraform to
refresh its understanding of your resources differs quite significantly between AWS services,
depending on the speed at which those particular APIs operate. AWS Glue APIs are really slow for instance.
This may also form part of your decision making process, in terms of how to split things up.

### Modules

Terraform modules are a crucial thing to get to grips with in order to keep your code base clean and reusable.
A module is a container for multiple resources that are used together. Modules are very similar in nature to the regular
old Terraform code you know and (hopefully) love. You define input variables, outputs, resources etc.

Take an example of a VPC network in AWS. In order to create a VPC, you need to set up a number of different resources
such as subnets, routing tables, NAT Gateways, Internet Gateways etc. There’s a good chance in a more sizable
infrastructure that you will have multiple AWS accounts, each one requiring one or more VPC networks. You could just
copy and paste all the required resource definitions in order to create them in each account, but that would be time
consuming, error prone and if you share my love for DRY code this would deeply offend you.

Huzzah, modules to the rescue. Grouping these resources together into a VPC module, with suitable input variables for
items that need different configuration for each account i.e. VPC CIDR range, subnet CIDR ranges etc. allows you to
define the resource once and reuse the same code across your accounts.

For more reading on how to write your own modules see the [Terraform documentation](https://developer.hashicorp.com/terraform/tutorials/modules/module-create).

It’s also worth noting that there are a considerable number of community modules out there already in the Terraform
registry that you can use. Why reinvent the wheel?

For AWS modules see the [Terraform Registry](https://registry.terraform.io/modules/terraform-aws-modules).

### Workspaces

In the world of Terraform, the word “workspace” is a little confusing at first, seeing as Hashicorp in all their
infinite wisdom decided to make two entirely different concepts have the same name.

If you are working with Terraform Cloud, you will have workspaces. A Terraform Cloud workspace would be mapped to one
particular Terraform state file, and one particular folder/root module of Terraform code.

Now, if you are using Terraform without their hosted cloud platform, storing your state in another remote state provider
(for example in an S3 bucket), you have the ability to use the functionality of multiple, isolated versions of the state file,
known as........you guessed it, workspaces!

This is a very powerful tool in your Terraform toolkit.

Consider a situation where you’ve decided to split resources for an application up by function, as shown in the previous
section. Now imagine we have multiple deployment environments for this application, such as development, staging and
production. Workspaces can help us manage these different environments without resorting to duplication of code.

Terraform provides us with a way to look up the workspace we are currently working on at runtime and use that value
within our code. This unlocks the ability to use the same piece of code across all environments by using this value in
resource naming conventions. We can also use conditional expressions to make decisions about the resources we deploy
based on the current workspace. As an example, an EC2 instance in development might use a much smaller instance class
than in production, and we could automatically apply that logic.

Let’s do a quick demonstration here, I think this topic needs a little illustration!

Every Terraform root module would be created with a workspace named “default”. If you don’t touch the workspace
functionality, then you are working in the default workspace without knowing it.

The Terraform CLI allows you to list your workspaces:

```python
$ terraform workspace list
```

To create a new workspace (for development in this case):

```python
$ terraform workspace new development
```

Now, using this value in our code for an EC2 instance for example:

```python
resource "aws_instance" "foo" {
  ami           = "ami-005e54dee72cc1d00"
  instance_type = terraform.workspace == "production" ? m5.xlarge : t3.micro

  tags = {
    Name = "${terraform.workspace}-ec2-instance"
  }
}
```

In our development workspace, with the Terraform code above, we would get an EC2 instance named "development-ec2-instance",
using a t3.micro instance class. Should we switch to the production workspace this would result in an m5.xlarge instance
being deployed.

You can also easily use the workspace to control [variables](https://developer.hashicorp.com/terraform/language/values/variables)
for your Terraform code. Instead of having hard coded values for the instance type as above we could use a variable that
maps workspace name to instance type:

```python
variable "instance_type" {
    type = map(string)
    default = {
        development = "t3.micro"
        production = "m5.xlarge"
    }
}
```

Now the same EC2 instance resource definition could be changed to:

```python
resource "aws_instance" "foo" {
  ami           = "ami-005e54dee72cc1d00"
  instance_type = var.instance_type[terraform.workspace]

  tags = {
    Name = "${terraform.workspace}-ec2-instance"
  }
}
```

Another useful pattern I have used is to have a Terraform variable file (.tfvars file) per workspace. This allows you to
easily control input variables and select the correct variable file at runtime.

Let's loop back to the example of configuring a VPC network per workspace. We could define some variables for our CIDR
range and subnets:

```python
variable "vpc_cidr" {
  type = string
  description = "The CIDR range for the VPC network"
}

variable "vpc_public_subnets" {
  type = list(string)
  description = "A list of CIDR ranges to be created as public subnets"
}

variable "vpc_private_subnets" {
  type = list(string)
  description = "A list of CIDR ranges to be created as private subnets"
}
```

Now for each workspace we could create a .tfvars file named after the workspace e.g. development.tfvars and
production.tfvars that define the values for these variables:

```python
# VPC
vpc_cidr = "10.3.0.0/16"
vpc_public_subnets = ["10.3.1.0/24", "10.3.2.0/24", "10.3.3.0/24"]
vpc_private_subnets = ["10.3.11.0/24", "10.3.12.0/24", "10.3.13.0/24"]
```

When we come to run a Terraform plan or apply we can then chose the correct .tfvars file based on the current workspace:

```python
$ terraform apply --var-file=./$(terraform workspace show).tfvars
```
