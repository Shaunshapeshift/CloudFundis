---
title: AWS Data Lake and EMR Automation
section: work
url: /work/aws-data-lake-emr-automation

sections:
    - type: section/hero--work
      headline: AWS Data Lake and EMR Automation
      text: In late 2019, Cloud Fundis was approached to help Clickatell build out its data lake.

    - type: section/fullwidth-image
      custom_classes: 'inner-g-banner-sec'
      image: '/assets/images/code.png'

    - type: section/decision-making
      headline: 'They had started using the native AWS services - AWS Glue - and already had some data extracted to Amazon Simple Storage service (S3).'
      text: >
          By February 2020, they needed to extract data on a faster-than-15-minute interval from their MySQL databases and write the results to the data after some transformations. AWS Glue, despite being a great tool, was limited. Their extractions could only be done on an hourly basis.

    - type: section/can-sec
      heading: 'In addition, the data quality checks just weren’t checking out. Anomalies in the data and schema changes were plaguing the team.'

      services:
          - title: 'Phase 1 - Data extraction'
            thumbnail: '/assets/images/export.png'
            content:
                - style: 'p'
                  inner: >
                      Together, we came up with an improved plan to extract data. Cloud Fundis then built a platform where data could be extracted at five-minute intervals while reducing their AWS Glue costs substantially. The solution was based on Amazon EMR, Apache Livy and Apache Spark. Together, these form the core of the extraction engine.

                - style: 'html'
                  inner: >
                      <p><br/></p>

                - style: 'p'
                  inner: >
                      Driving the regular extraction is an AWS Lambda orchestrator and Amazon DynamoDB to keep state information for the process.

          - title: 'Phase 2 - Cluster reliability'
            thumbnail: '/assets/images/network.png'
            content:
                - style: 'p'
                  inner: >
                      By the time phase 1 was complete, it was clear that the customer was going to be able to save significant money in building their data lake using the framework we built. Part of that saving was enabled by using spot instances for their Amazon EMR clusters. The downside to using spot instances is that one cannot rely on them for continuous processing as the instance price might spike - causing the cluster(s) to be terminated. In considering this problem, Cloud Fundis devised a method of keeping jobs running in the face of failing/terminating clusters. The solution needed to ensure that jobs running on a cluster could be moved to a new cluster as soon as it was relaunched.

                - style: 'html'
                  inner: >
                      <p><br/></p>

                - style: 'p'
                  inner: >
                      Clusters of different sizes could ensure that jobs demanding higher computing requirements could be run alongside jobs requiring smaller clusters. The customer also wanted to ensure that clusters were rotated on a regular basis. Additionally, cluster rotation should not require human intervention when a cluster is rotated. Automation is key. Amazon Cloudwatch, AWS Lambda, and Amazon DynamoDB were employed to ensure that clusters were relaunched when they died or when their time came to be rotated. In the process of relaunching, jobs are moved from the once-running (now dead) cluster to the new cluster. Having ensured that all jobs in phase 1 were idempotent, re-running a job that was incomplete when the cluster died ensured data consistency.

          - title: 'Phase 3 - Dealing with streaming data '
            thumbnail: '/assets/images/livestream.png'
            content:
                - style: 'p'
                  inner: >
                      In this final phase of the project, the customer wanted to be able to handle streaming data - with ingestion to a PostgreSQL database as well as to S3. The data were read from an Apache Kafka stream (AWS Managed Streaming for Kafka (MSK)) and written to the database. PostgreSQL was the database of choice due to the limitations of its BI reporting engine. In this final phase, despite considering Apache Flink to perform the data aggregations from the stream(s), we opted to use Apache Spark Structured Streaming. This was informed by a number of considerations - but mostly because the technical team are learning Python and Apache Spark and this fitted nicely into that learning.

                - style: 'html'
                  inner: >
                      <p><br/></p>

                - style: 'p'
                  inner: >
                      Sample code as well as a deep-dive into Spark structured streaming was provided to the team to enable them to kick-start their work. Cloud Fundis wrote a framework for generating fake data and injecting it into Amazon Managed Streaming for Kafka. This framework simulated clicks on a dashboard or website. Apache Spark was used to process that stream from every few milliseconds to every 15 or 30 seconds.

    - type: section/need-assist
      custom_classes: 'mt-h2'
      heading: 'Get in touch '
      text: 'Let’s explore how we can drive real-time data processing and seamless cluster reliability for your business.'
      button:
          text: 'Get in touch'
          url: '/contact'
---
