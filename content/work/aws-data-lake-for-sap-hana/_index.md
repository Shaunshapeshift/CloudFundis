---
title: AWS Data Lake for SAP HANA
section: work
url: /work/aws-data-lake-for-sap-hana

sections:
    - type: section/hero--work
      headline: AWS Data Lake for SAP HANA
      text: In 2019, the JDGroup embarked on a discovery phase with building a data lake.

    - type: section/fullwidth-image
      custom_classes: 'inner-g-banner-sec'
      image: '/assets/images/girl.png'

    - type: section/decision-making
      headline: 'Several decision-making points needed to be addressed:'
      cols:
          - text: 'Could data be extracted from SAP HANA and written to Amazon Simple Storage Service (S3)?'
          - text: 'Could the transformations that are currently being done in SAS, be affected using native AWS tools?'
          - text: 'What would the costs be of extracting data from SAP HANA to S3?'
          - text: 'Would this reduce pressure on their existing storage requirements?'

    - type: section/p-approach
      headline: 'Project approach'
      text: >
          In tackling this project, work commenced using AWS Glue to perform the extractions from the SAP system. In addition, while doing this project, a key aspect was to transfer skills between Cloud Fundis and the JDGroup technical team. We compared the AWS Glue to other forms of extraction of the data from SAP. Specifically, we used AWS EMR (using Zeppelin Notebooks) to help transfer skills to the JDGroup team.

    - type: section/key-outs
      headline: 'Key project outcomes'
      cols:
          - heading: '01'
            text:
                'It is possible and indeed relatively straightforward to extract data from SAP HANA to S3. At
                the time, even limited Internet bandwidth and extracting to the EU-WEST-1 region did not
                prove prohibitive for this project.'

          - heading: '02'
            text:
                'The cost comparisons showed that using AWS Glue, while simpler than Amazon EMR, was somewhat
                more expensive. Ultimately, extracting the data and writing it to S3 was 20% cheaper using
                Amazon EMR than AWS Glue.'

          - heading: '03'
            text:
                'In the POC, existing SAS code was re-written in Apache Spark and run on both AWS Glue and
                Amazon EMR platforms. Minor modifications allowed the customer to choose the platform best
                suited to their environment.'

          - heading: '04'
            text:
                'The customer has many thousands of lines of SAS code in production. This project showed that
                those codes could be migrated to an open platform using AWS native tools. Success in
                production, however, would require re-training the staff, who currently have competence in
                SAS.'

          - heading: '05'
            text:
                "Finally, migrating to a data lake would relieve pressure on the customers' storage
                requirements, and this would in turn lead to lower costs as older data in the data lake
                could be archived automatically with lifecycle policies to Amazon S3 Glacier."

    - type: section/need-assist
      custom_classes: ''
      heading: 'Get in touch '
      text: 'Learn how we can streamline your development processes and ensure effortless deployment and scaling.'
      button:
          text: 'Get in touch'
          url: '/contact'
---
