---
title: 'jq - lessons 10 to 12'
date: 2020-05-12T10:24:47+10:00
authors: ['Hamish Whittal']
categories: ['Linux', 'Tools']
description: 'The fourth part in a series where I dive into the awesome things one can do with JQ.'
thumbnail: '/images/posts/jq/jq.webp'
---

## Lesson 10

### Using functions

There are a number of useful functions in _jq_ that will make life a little easier. Let’s explore some of them.

#### join

A function to join an array into a string. Whereas before we created a string using String iterpolation, we could simply use join.

```python
jq '.Reservations[].Instances[]|select(.State.Name == "running") | [.LaunchTime, .InstanceId, .State.Name, .PrivateIpAddress, .BlockDeviceMappings[].Ebs.Status, .BlockDeviceMappings[].DeviceName, .BlockDeviceMappings[].Ebs.VolumeId]| join(",")'
```

produces a nice string as before, just a little more easily. You should note though that the fields in this example are all in a single string; not multiple strings as before.

```python
"2020-05-13T03:45:33.000Z,i-053667d4e26795541,running,172.16.2.26,attached,/dev/sda1,vol-05dec31f2e74067b0"
"2020-05-13T03:50:44.000Z,i-0a775b8c631e8ad27,running,172.16.2.15,attached,/dev/sda1,vol-01ca741dc26d7c0f9"
"2020-05-13T03:50:44.000Z,i-061b358b9cfc20505,running,172.16.1.13,attached,/dev/sda1,vol-0610ab7fde8c71943"
```

Notice too, that in order to use join, we need to supply it with an array. Hence my fields are enclosed in square ( \[ \] ) braces turning the output into an array. This array is consumed by the _join_ function.

#### contains

To change tack slightly, we look at the events rules that have been configured. Event rules are set up in the CloudWatch console but are referred to as events in the AWS CLI.

Suppose I have a number of rules, and I only want to select those that contain the description “Stop”.

```python
aws events list-rules | jq '.Rules[]|select(.Description|contains("Stop"))'
```

Here we’re using two functions: _select_ and _contains_.

```python
{
  "Name": "STOP_client_servers",
  "Arn": "arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/STOP_client_servers",
  "State": "ENABLED",
  "Description": "Stop servers that are prod for client servers: CRM, OpenVPN server",
  "ScheduleExpression": "cron(30 15 ? * 2-6 *)",
  "EventBusName": "default"
}
{
  "Name": "Stop_client_DC01",
  "Arn": "arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/Stop_client_DC01",
  "State": "ENABLED",
  "Description": "Stop the client Active Domain Controller when not being used",
  "ScheduleExpression": "cron(40 15 ? * 2-6 *)",
  "EventBusName": "default"
}
```

#### sub

Substitute is useful for strings; substituting _this_ for _that_.

In the following one, I want to substitue x’s for the customer account number from the .Arn and I also want to remove the customer name from all .Descriptions and .Names

```python
jq -rc '.Rules[]|[.Name, .Arn, .State, .Description]|join(",")|sub("CDLI";"client";"g")|sub("123456789101";"xxxxxxxxxxxx";"g")'
```

```python
START_client_servers,arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/START_client_servers,ENABLED,Start client prod servers: CRM & OpenVPN server
STOP_client_servers,arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/STOP_client_servers,ENABLED,Stop servers that are prod for client servers: CRM, OpenVPN server
Start_client_DC01,arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/Start_client_DC01,ENABLED,Start the client Active Domain Controller
Stop_client_DC01,arn:aws:events:eu-west-1:xxxxxxxxxxxx:rule/Stop_client_DC01,ENABLED,Stop the client Active Domain Controller when not being used
```

Of course these things can get really difficult to read as they grow.

```python
jq -rc '.Rules[]|select(.Description|contains("Stop"))|[.Name, .Arn, .State, .Description]|join(",")|sub("CDLI";"client";"g")|sub("123456789101";"xxxxxxxxxxxx";"g")'
```

Here we’re combining the select and using sub twice as above.

## Lesson 11

### Reading your _jq_ from a file

To make the _jq_ script easier to manage (and of course reuse), it’s often worth putting the script in a file and calling it using the _from-file_ ( -f ) flag. What makes this great is that now you can use newlines and set out your _jq_ in a much easier-to-read format.

Note however, that when doing this, you’ll need to leave off the single quotes ( ' ) around your _jq_ command.

Re-writing the above _jq_ it would look like this in our file test.jq

```python
.Rules[]
| select(.Description
    | contains("Stop"))
| [.Name, .Arn, .State, .Description]
| join(",")
| sub("CDLI";"client";"g")
| sub("123456789101";"xxxxxxxxxxxx";"g")
```

Now running _jq_ is easier with:

```python
aws events list-rules | jq -f test.jq
```

What makes this even more appealing is that you can use comments (everything after a # is a comment) in your _jq_ script now as follows:

```python
# Grab the details of stop events from the aws event log
# use as: aws events list-rules | jq -f <filename.jq>

.Rules[]
    | select(.Description
        | contains("Stop"))                     # From the rules, only select those where .Description contains the word "Stop"
    | [.Name, .Arn, .State, .Description]       # Keep only the .Name, .Arn, .State and .Description. Remember to make as an array
    | join(",")                                 # Join the array with commas
    | sub("CDLI";"client";"g")                  # Remove the client name replacing with "client"
    | sub("123456789101";"xxxxxxxxxxxx";"g")    # Remove the account number from .Arn
```

From this you will notice that white-space has no effect on the expression. This means we can indent the various parts of the _jq_ expression to make it even more legible. Additionally, we like to put a comment at the top of the file to give

-   some indication of how to use this _jq_ expression and
-   to give details of what it does

Finally, it may be worth naming the files intelligently. While you may think you’ll never use this “once-off” expression again, this is almost certainly not true - you will reuse it. Or at least you’ll remember that you used something in it that made sense at the time.

We name our files like this:

```python
events.rules.jq
```

and store them in a directory structure similar to our shell, Python, Scala and other scripts. Spending a little time in the beginning will save you oodles of time later.

For the rest of the series we’ll be using _jq_ scripts in this form: as if they’re part of a file with comments.

## Lesson 12

### If-then-else

Of course every language has boolean conditionals; _jq_ is no exception.

Where we’ve found this most useful is in switching a variable, from say “done: False” to “done: True”. Most recently we had a DynamoDB table where we had just such a key:value pair. Wanting to switch all entries from “shouldRun: False” to “shouldRun: True”.

Before we get there however, let’s take a step back. Using if-then-else-end to mark instances that are in a ‘running’ state with an ‘R’ while instances in a ‘stopped’ state with an ‘S’.

```python
.Reservations[].Instances[]
    | select(.State.Name == "running" or .State.Name == "stopped")
    | [.LaunchTime, .InstanceId, if .State.Name == "running" then "R" else "S" end,
       .PrivateIpAddress,
       ( .BlockDeviceMappings[]
            | .DeviceName, .Ebs.Status, .Ebs.VolumeId ) ]   # Notice how I split these things up to make it
                                                            # more meaningful
    | join(",")
```

Ok, we’ve jumped ahead here a bit showing multiple things at once. Let’s tackle these things one at a time.

First notice the round braces ( () ) around the _.BlockDeviceMappings_ array. This allows us to treat the _.BlockDeviceMappings_ almost independently of the other JSON objects in the array we’re building.

As an alternative to using the round braces, we could have done this:

```python
...
   .BlockDeviceMappings[].DeviceName,
   .BlockDeviceMappings[].Ebs.Status,
   .BlockDeviceMappings[].Ebs.VolumeId
...
```

but that’s just so verbose. Instead, enclosing _.BlockDeviceMappings_ inside the braces and then applying a pipe to it’s output, thereby selecting only the keys we’re after.

So much nicer.

Comments add a lot of value, especially later when you come back to try and figure out what you were up to. Note here that because white-space is ignored, we can run comments over multiple lines. Very handy indeed.

Finally, the if statement.

The way this works is that there must be an _if - then - else - end_. You cannot leave off the else or the end.

In this case, we’re testing whether the _.State.Name_ is “running” and if it is, replace the current _.State.Name_ with an “R”, otherwise I replace it with an “S”. Notice how to include this in the list as if it’s a regular element.

```python
"2020-05-13T03:45:33.000Z,i-053667d4e26795541,R,172.16.2.26,/dev/sda1,attached,vol-05dec31f2e74067b0"
"2020-05-13T03:50:44.000Z,i-0a775b8c631e8ad27,R,172.16.2.15,/dev/sda1,attached,vol-01ca741dc26d7c0f9"
"2020-04-23T12:37:54.000Z,i-06e986e85261c838e,S,172.16.1.10,/dev/sda1,attached,vol-01a80015424546dad"
"2020-05-13T03:50:44.000Z,i-061b358b9cfc20505,R,172.16.1.13,/dev/sda1,attached,vol-0610ab7fde8c71943"
```

Exactly what we’re after.

For completeness, we’ve called this file running.jq and placed it in the directory:

```python
../programming/jq/aws/
├── ec2
│   └── running.jq          <----- here it is...
└── events
    └── events.rules.jq
```

Of course, we promised to show you how we change “shouldRun: False” to “shouldRun: True” in the DynamoDB table. We’ve done this in steps, but of course you could do it all in a single long command line. :-)

First dump the table to a JSON file:

```python
aws dynamodb get-item --table-name scriptTable --key "{\"scriptName\": {\"S\": \"message_table\"}}" --region eu-west-1 | jq -j '.' > message_table.getitem
```

This yield a file for the table looking like this (truncated for brevity):

```python
{
    "Item": {
        "lastRun": {
            "N": "0"
        },
        "shouldRun": {
            "BOOL": false
        },
        "startAt": {
            "N": "0"
        },
        "description": {
            "S": "A script to extract data from the message table on DB"
        },
        "lambda": {
            "S": "livyLambda"
        },
        "clusterID": {
            "S": "j-2EIPAI8VW80O"
        },
    ...
```

We want to switch the “false” in _shouldRun_ to “true”

Now we can apply a _jq_ expression to do that:

```python
jq "if ( .Item.shouldRun ) then .Item.shouldRun={\"BOOL\": true } else . end" message_table.getitem > message_table.putitem
```

Taking the resulting file and pushing that back to DynamoDB will do what we’re after:

```python
jq '.Item' message_table.putitem > new.json && aws dynamodb put-item --table-name scriptTable --item file:///home/hadoop/new.json
```

Done. Your DynamoDB table has been updated with the “shouldRun” set to True.

One final note unrelated to the if-then. I write the output to new.json because it’s then easy to apply the same pattern to many other Items in the DynamoDB table and not only the message_table.putitem.

As easy as that.

Tjoef-tjaf.

Thanks to @Wendy for the inspiration of the events rules.
