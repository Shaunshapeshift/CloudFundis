---
title: AWS Migration, Containerisation & CI/CD
section: work
url: /work/aws-migration-containerisation-ci-cd

sections:
    - type: section/hero--work
      headline: AWS Migration, Containerisation & CI/CD
      text: GamezBoost approached Cloud Fundis to assist them in setting up an AWS environment that is secure, scalable, and helps them serve their customers as the business grows.

    - type: section/fullwidth-image
      custom_classes: 'inner-g-banner-sec'
      image: '/assets/images/apps.png'

    - type: section/decision-making
      headline: 'Along with a new architecture would come new development practices and a completely new developer experience.'

    - type: section/can-sec
      heading: 'Ease and reliability of application development and deployment were other key factors to be considered.'

      services:
          - title: 'Technologies'
            thumbnail: '/assets/images/technologies.png'
            content:
                - style: 'p'
                  inner: >
                      All infrastructure was described as code and deployed using Hashicorp Terraform, with the new architecture designed around the following key AWS technologies:

                - style: 'html'
                  inner: >
                      <p><br/></p>

                - style: 'ul'
                  inner:
                      - CloudFront
                      - S3
                      - Application Load Balancer (ALB)
                      - Web Application Firewall (WAF)
                      - Elastic Container Service (ECS)
                      - Relational Database Service (RDS)
                      - CodePipeline
                      - CodeBuild
                      - CodeDeploy
                      - CloudWatch Logs, Alerts, Dashboards

    - type: section/fundis-sec
      headline: The Result
      text: >
          The new architecture allows GamezBoost to easily deploy new partner sites via Terraform automation and quickly scale to meet demand through ECS and Autoscaling.
      content:
          - style: 'p'
            inner: >
                Application deployments are handled automatically on push via integration of the Code* family of services with source control. CodePipeline handles taking a deployment package through pre-release environments, prior to a production deployment, to ensure that any incorrect changes don’t make it to production.
          - style: 'html'
            inner: >
                <p></p>
          - style: 'p'
            inner: >
                In addition to the new architecture, it was important to ensure that the application developers were set up for success. Cloud Fundis assisted with setting up a new Docker-based development environment for all developers and getting them up to speed with the new processes.

    - type: section/need-assist
      custom_classes: 'mt'
      heading: 'Get in touch '
      text: 'Let’s explore how we can drive real-time data processing and seamless cluster reliability for your business.'
      button:
          text: 'Get in touch'
          url: '/contact'
---
