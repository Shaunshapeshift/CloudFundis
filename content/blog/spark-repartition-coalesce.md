---
title: 'Using different partitioning methods in Spark to help with data skew'
date: 2023-03-08T10:24:47+02:00
authors: ['Riyaad Kherekar']
categories: ['Spark', 'PySpark', 'Tuning']
description: "Building DataLakes can become complicated when dealing with lots of data. Even more so, when working with heavily skewed data. In this post, we'll be looking at how we can improve your long running Spark jobs caused by skewed data."
thumbnail: '/images/posts/repartitioning/31 - repartition.png'
---

![funky tech thing](/images/posts/repartitioning/repartition-partition-image.png)

#### Throughout this article, I’ll be discussing the following Spark transformations by making use of real examples, thereby demonstrating the performance impact it can have on job performance:

-   repartition(n)
-   repartition(“key”)
-   repartition(n) and then writing output files in Hive partitioning format
-   repartition(n,“key”)and then writing output files in Hive partitioning format
-   Writing output partitions in Hive style partitioning format

I will consider some sample code snippets, analyze the behavior of using the transformations above, and look at the different plans created by Spark.

#### How does repartition(n) work? (N being the number of future partitions)

-   This transformation can increase or decrease the level of parallelism from the parent redundant distributed dataset (RDD). It will perform a full shuffle, regardless of whether one is necessary, to redistribute data evenly across executors.
-   You would typically only use this transformation when the desired number of partitions is greater than your current partition count, keeping in mind the available cores your executors are configured with to take advantage of Sparks parallel processing ability.
-   Using this transformation can help with data skew by selecting an evenly distributed or high cardinality column to use when repartitioning your data.

#### How does repartition(n,"key") work?

-   This transformation distributes rows by shuffling data evenly across partitions using the “key” specified. Remember, use a key which is more or less evenly distributed in your dataset.
-   Data gets shuffled across executors based on the key(s) specified, if only the key is specified, the output partition size will be 200 based on the default “spark.sql.shuffle.partitions” settings.
-   By defining a number for this optimization, this would create the defined number of partitions in memory.
-   It will create a dataframe with N partitions using a hash-based partitioner. The key defines the partitioning key which can be a single column, or a list of columns.
-   The hash partitioner will take each input row partition key,hash it into a space of N partitions. This guarantees that all rows with the same partition key will end up on the same partition.

#### How does PartitionBy() work?

-   Belonging to the DataFrameWriter class, this option can be passed when performing a write to disk, partitioning data at the same time. It partitions the output by the given columns on the
    storage. If specified, the output is laid out on storage similar to Hive's partitioning scheme. As an example, when we partition a dataset by year and then month, the directory layout would
    look like: year=2016/month=01/ year=2016/month=02/
-   Partitioning is one of the most widely used techniques to optimize physical data layout. It provides a coarse-grained index for skipping unnecessary data reads when queries have predicates on
    the partitioned columns. In order for partitioning to work well, the number of distinct values in each column should typically be less than tens of thousands.
-   This helps when you need to query your data for specific data, so that the query doesn't need to look at the entire dataset to find something like year=1998.

Lets dive into some real world examples to help your Spark jobs run faster in your datalake.

#### Scenario #1

Your client is reading a lot of small parquet files which is a total of 10.2 GB in size, merge them into a smaller numbers of files, and store them as parquet files with the same partitioning
structure. How would you achieve this?

#### Sample code:

```python
repartition() partitionBy()
#We’re reading Parquet files, with this in mind, we can assume
#the input split would be 128 MB.
df = spark.read.parquet("s3://amazon-reviews-pds/parquet/product_category=Books/")
#Lets verify how much partitions has been created
df.rdd.getNumPartitions()
82
#Now we would like to check how many distinct 'years' we have in
#this data set, to be able to foresee how many partitions will
#be created on disk later in this code.
df.select('year').distinct().count()
21
#Now we will perform a 'RepartitionByExpression' by defining
#the number of in memory partitions and by key.
repartExpr = df.repartition(90, 'year')
repartExpr.rdd.getNumPartitions()
90
repartExpr.write.mode('overwrite').partitionBy("year").parquet("s3://riyaad-sbx/spark-labs/repartitionByExpression/")
```

Here we are writing the 'repartExpr' dataframe after we’ve performed a 'RepartitionByExpression' using the PartitionBy transformation which will result in our directory structure to be written
in Hive style on the column 'year'. Lets take a look at the output file count:

```python
 $ aws s3 ls --summarize --human-readable s3://riyaad-sbx/spark-labs/repartitionByExpression/
 PRE year=1995/
 PRE year=1996/
 PRE year=1997/
 PRE year=1998/
 PRE year=1999/
 PRE year=2000/
 PRE year=2001/
 PRE year=2002/
 PRE year=2003/
 PRE year=2004/
 PRE year=2005/
 PRE year=2006/
 PRE year=2007/
 PRE year=2008/
 PRE year=2009/
 PRE year=2010/
 PRE year=2011/
 PRE year=2012/
 PRE year=2013/
 PRE year=2014/
 PRE year=2015/
 Total Objects: 21
 Total Size: 10.2 GiB
```

Using the above code, the customer performs a repartition by expression to increase the partitions in memory to 90 and the expression by ‘year’.

Repartitioning the data set on a key, can assist with data skew. Lets say you’ve got an evenly distributed column within your data set, repartitioning on this column would help with data skew as
it will distribute the partitions across your cluster equally. Beware though, if your column is not evenly distributed accross your data, this could cause additional skew resulting in straggler
executors in your clusters where some tasks will write for a long time, while others will finish quickly.

Data will be shuffled across executors, meaning, the distinct “year” column will be in one partition. As we can see in the above code, we have 21 distinct years. Based on this information,
we will know that 21 tasks will output data, with each year occupying one partition. The output partitions in this case, will be 21.

Why?
When Spark uses the hashpartitioner, all rows are split up across partitions based on the hash of "expressions". All rows where the expression evaluates to the same value are guaranteed to be in
the same partition. If we perform a repartition by expression along with a custom partioner using the PartitionBy transformation, Spark will make use of the HashPartitioner.

#### Scenario #2

The client’s business requirement has changed, and now requires that they partition their data in Hive style format based on the keys "marketplace" and "star_rating" in order for their analytics
team to query the data more efficiently. Additionally, they need to output file per partition to avoid a small file problem down the line.

Lets take a look at the following sample code:

```python
#We’re reading Parquet files, with this in mind, we can assume the input
#split would be 128 MB.
df = spark.read.parquet("s3://amazon-reviews-pds/parquet/product_category=Books/")
#Lets verify how much partitions has been created
df.rdd.getNumPartitions()
82
#Now we would like to check how many distinct 'marketplace' and 'star_rating'
#colums we have in this data set, to be able to foresee how many partitions
#will be created on disk later in this code.
df.select("marketplace").distinct().show()
+-----------+
|marketplace|
+-----------+
|         DE|
|         US|
|         UK|
|         FR|
|         JP|
+-----------+
df.select("star_rating").distinct().show()
+-----------+
|star_rating|
+-----------+
|          1|
|          3|
|          4|
|          5|
|          2|
+-----------+
```

Lets go ahead and repartition the dataframe by expression now that we know the distinct values for “marketplace” and “star_rating” and then write the data in Hive style to S3:

```python
df_repartition = df.repartition(28, 'marketplace', 'star_rating')
df_repartition.write.mode('overwrite')\
 .partitionBy("marketplace", "star_rating")\
 .parquet("s3://riyaad-sbx/spark-labs/repartitionByExpressionHash/")
```

Our output structure should look like (I've purposefully truncated the output):

```python
PRE marketplace=DE/
    star_rating=1/part-1
    star_rating=2/part-1
    star_rating=3/part-1
    star_rating=4/part-1
    star_rating=5/part-1
PRE marketplace=FR/
    star_rating=1/part-1
    star_rating=2/part-1
    star_rating=3/part-1
    star_rating=4/part-1
    star_rating=5/part-1
PRE marketplace=JP/
    star_rating=1/part-1
    star_rating=2/part-1
    star_rating=3/part-1
    star_rating=4/part-1
    star_rating=5/part-1
PRE marketplace=UK/
    star_rating=1/part-1
    star_rating=2/part-1
    star_rating=3/part-1
    star_rating=4/part-1
    star_rating=5/part-1
PRE marketplace=US/
    star_rating=1/part-1
    star_rating=2/part-1
    star_rating=3/part-1
    star_rating=4/part-1
    star_rating=5/part-1
```

In each star_rating partition, we will find one output partition as expected. In this example, the 'marketplace' and 'star_rating' rows have been split across partitions based on the repartition
by expression and now reside on the same executor. When the write occurred, every executor? recieved its own partition. You would be able to use the Spark SQL tab in the SparkUI to confirm the
output and behavior.

I hope this blog, and information was insightful.

References:

[1] Sample Datasets used: s3://amazon-reviews-pds/parquet/

[2] What is AWS Glue: https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html
