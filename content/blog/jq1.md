---
title: 'jq - first steps: a journey worth taking'
date: 2020-05-04T10:24:47+10:00
authors: ['Hamish Whittal']
categories: ['Linux', 'Tools']
description: 'The first part in a series where I dive into the awesome things one can do with JQ.'
thumbnail: '/images/posts/jq/jq.webp'
---

When I started at AWS, I’d never heard of jq before. Of course, I’d not been exposed to a lot of JSON either, so it’s not surprising I didn’t know it or how unbelievably powerful it is.

This is a series of indefinite length that focuses on jq. Basically, the man page is way too concise to be terribly helpful. This series will aim to fulfil two roles:

-   To give practical examples of using jq.
-   To act as a bit of a cookbook for ‘common’ usecases.

We hope you find this useful.

## What is jq?

It’s a tool that allows us to manipulate JSON documents.

## Why is that so important?

JSON seems to have been universally adopted by many to define configuration files and output to API calls among other uses.

jq is a swiss-army knife for dealing with JSON. The better you know it, the easier your JSON life will be.

For the rest of this series, I’m going to be delving into the return information from the AWS CLI. If your CLI config files isn’t set to return JSON (instead it returns YAML or something else), then change that. You should use any JSON file you have on hand.

This is only for Linux. What about Windoze? I don’t care about Windoze. If you want to run jq on Windoze, Google it.

## Lesson 1:

jq can be used on a file or part of a pipe.

jq can pretty-print your JSON. The period ( . ) is the selector of all fields. In the example, this selects from the highest level of the JSON document.

```python
aws ec2 describe-instances | jq '.'
```

This produces the instances in your account. Not terribly helpful because, of course if there are many of them, there is a lot of JSON returned. It did (or should have), coloured your output - which is pretty if nothing else.

## Lesson 2

Finding the keys.

The JSON document is a set of key:value pairs. In our case, if we want to find the keys, we could:

```python
aws ec2 describe-instances | jq 'keys'
```

which will return:

```python
[
    "Reservations"
]
```

That’s telling me I have instances that are “reserved” for my use. Of course, the converse is the values associated with the “Reservations” key and are the values (my instances).

```python
aws ec2 describe-instances | jq 'values'
```

Still pretty useless, but at least it’s something.

**What about using the Reservations key?**

```python
aws ec2 describe-instances | jq '.Reservations'
```

returns the same results (pretty much) as ‘values’ above. But now we’re getting the hang of this, what about the ‘next’ key (i.e. .Reservations.)?

```python
aws ec2 describe-instances | jq '.Reservations | keys'
```

Here the pipe character does what you expect it to do in the shell. It’s piping the output of .Reservations to the keys keyword. Interestingly, we get this:

```python
[
    0
]
```

**What does that mean?**

.Reservations is a zero indexed array and in this case, there’s only a single element - 0.

jq understands the index, but it ALSO understands an empty array to mean every element in the array as follows:

```python
aws ec2 describe-instances | jq '.Reservations[0] | keys'
aws ec2 describe-instances | jq '.Reservations[] | keys'
```

This means the zero’th element (in this case the .Reservations array only has a single element), or the empty brackets which means every element in the array. Both of these produce the same outcome:

```python
[
    "Groups",
    "Instances",
    "OwnerId",
    "ReservationId"
]
```

There are four sub-keys under .Reservations, namely Groups, Instances, OwnerId and ReservationId. Taking a flying guess here, I’m going to go with the Instances like so:

```python
aws ec2 describe-instances | jq '.Reservations[].Instances'
```

This produces:

```python
[
  {
    "AmiLaunchIndex": 0,
    "ImageId": "ami-02df9ea15c1778c9c",
    "InstanceId": "i-0b3dde7ff8612d7b5",
    "InstanceType": "t2.micro",
    "KeyName": "hamish-cloudfundis-keypair",
    "LaunchTime": "2020-01-02T13:47:08.000Z",
    "Monitoring": {
      "State": "disabled"
    },
    "Placement": {
      "AvailabilityZone": "eu-west-1c",
      "GroupName": "",
      "Tenancy": "default"
      ...
```

The square bracket ( [ ) as the first line gives us a clue that this too (Instances) is an array. How many elements are in this array? That’s right, in my case, 0. Let’s try that trick from before…where we used the keys keyword:

```python
aws ec2 describe-instances | jq '.Reservations[].Instances[] | keys'
```

And bingo we get something useful finally

```python
    [
      "AmiLaunchIndex",
      "Architecture",
      "BlockDeviceMappings",
      "CapacityReservationSpecification",
      "ClientToken",
      "CpuOptions",
      "EbsOptimized",
      "EnaSupport",
      "HibernationOptions",
      ...
```

I don’t have more time today, so that’s it for now. Next time, we look at getting values for these things.
