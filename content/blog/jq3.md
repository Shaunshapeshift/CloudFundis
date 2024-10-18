---
title: 'jq - lessons 7 to 9'
date: 2020-05-07T10:24:47+10:00
authors: ['Hamish Whittal']
categories: ['Linux', 'Tools']
description: 'The third part in a series where I dive into the awesome things one can do with JQ.'
thumbnail: '/images/posts/jq/jq.webp'
---

## Lesson 7

### Creating new structures

Last time, we created a string from each of the outputs we were interested in using a combination of the pipe ( | ), the raw and compact
flag and string interpolation with round braces:

```python
jq -cr '.Reservations[].Instances[] | "\(.InstanceId): \(.State.Name): \(.PrivateIpAddress)"'
```

Perhaps we would like to create an array of the values. This is pretty simple because, in effect what we’re doing on the right hand side of the pipe ( | ) is to create a
new structure. That structure itself could be a string like that above, or it could be an array

```python
jq -cr '.Reservations[].Instances[] | [.InstanceId), .State.Name, .PrivateIpAddress]'
```

Not when you do this, it seems to ignore the raw ( -r ) flag. That may seem strange, but in fact creating an array in JSON means that elements of the array HAVE to
use double quotes ( " ) and must be separated by commas ( , ). That’s JSON.

```python
["i-053667d4e26795541","running","172.16.2.26"]
["i-0a775b8c631e8ad27","running","172.16.2.15"]
["i-06e986e85261c838e","stopped","172.16.1.10"]
["i-061b358b9cfc20505","running","172.16.1.13"]
```

So how about creating a new object in JSON with each element tagged with a key?

```python
jq -cr '.Reservations[].Instances[] | {instance:.InstanceId), state:.State.Name, ip:.PrivateIpAddress}'
```

produces:

```python
{"instance":"i-053667d4e26795541","state":"running","ip":"172.16.2.26"}
{"instance":"i-0a775b8c631e8ad27","state":"running","ip":"172.16.2.15"}
{"instance":"i-06e986e85261c838e","state":"stopped","ip":"172.16.1.10"}
{"instance":"i-061b358b9cfc20505","state":"running","ip":"172.16.1.13"}
```

What’s cool about this is that, I may also like to know the state of block storage on the instances that are launched, and even though I’ve not unpacked the BlockDeviceMappings JSON, I can still use it perfectly:

```python
jq -cr '.Reservations[].Instances[] | [.InstanceId, .State.Name, .PrivateIpAddress, .BlockDeviceMappings]'
```

```python
["i-053667d4e26795541","running","172.16.2.26",[{"DeviceName":"/dev/sda1","Ebs":{"AttachTime":"2019-06-21T15:24:29.000Z","DeleteOnTermination":true,"Status":"attached","VolumeId":"vol-05dec31f2e74067b0"}}]]
["i-0a775b8c631e8ad27","running","172.16.2.15",[{"DeviceName":"/dev/sda1","Ebs":{"AttachTime":"2019-10-11T15:18:37.000Z","DeleteOnTermination":false,"Status":"attached","VolumeId":"vol-01ca741dc26d7c0f9"}}]]
["i-06e986e85261c838e","stopped","172.16.1.10",[{"DeviceName":"/dev/sda1","Ebs":{"AttachTime":"2020-03-12T08:17:14.000Z","DeleteOnTermination":false,"Status":"attached","VolumeId":"vol-01a80015424546dad"}}]]
["i-061b358b9cfc20505","running","172.16.1.13",[{"DeviceName":"/dev/sda1","Ebs":{"AttachTime":"2020-03-17T10:18:13.000Z","DeleteOnTermination":true,"Status":"attached","VolumeId":"vol-0610ab7fde8c71943"}}]]
```

## Lesson 8

### Selecting only running instances and changing the order of the output

I certainly would like to know what instances are running, filtering out (discarding) those that are stopped.

Select is the answer.

```python
jq -c '.Reservations[].Instances[] | select(.State.Name == "running") | [.LaunchTime, .InstanceId, .State.Name, .PrivateIpAddress]'
```

Just like in a Unix pipe, one can use select to choose what you’re after and once you have it, you pipe those results to the output just as before.

The command above produces only the running instances:

```python
["2020-05-07T03:45:33.000Z","i-053667d4e26795541","running","172.16.2.26"]
["2020-05-07T03:50:45.000Z","i-0a775b8c631e8ad27","running","172.16.2.15"]
["2020-05-07T03:50:45.000Z","i-061b358b9cfc20505","running","172.16.1.13"]
```

In this example (now including the VPC ID), I want to write the output into a sentence:

```python
jq -c '.Reservations[].Instances[] | select(.State.Name == "running") | "Instance \(.InstanceId) is \(.State.Name) and was launched at \(.LaunchTime). It has \(.PrivateIpAddress) private IP in \(.VpcId)"'
```

```python
"Instance i-053667d4e26795541 is running and was launched at 2020-05-08T03:45:33.000Z. It has 172.16.2.26 private IP in vpc-0c092d552baffc13d"
"Instance i-0a775b8c631e8ad27 is running and was launched at 2020-05-08T03:50:44.000Z. It has 172.16.2.15 private IP in vpc-0c092d552baffc13d"
"Instance i-061b358b9cfc20505 is running and was launched at 2020-05-08T03:50:44.000Z. It has 172.16.1.13 private IP in vpc-0c092d552baffc13d"
```

## Lesson 9

### Using functions (and also stopping the pipe)

jq has a number of useful functions that can be applied to your output. Functions like ascii_downcase, map, join, mktime and many others. Using them though can be a challenge. The examples in the documentation don’t help a ton.

Suppose I wish to change the LaunchTime into UNIX time, how would I do that.

Certainly it seems like this might work:

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running")|.InstanceId, .LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime'
```

But alas it doesn’t and produces this error:

```python
jq: error (at <stdin>:551): date "i-053667d4e26795541" does not match format "%Y-%m-%dT%H:%M:%S.000Z"
```

Of course. jq is piping everything into mktime including the InstanceId; but that’s not a time. How do we stop that?

One way might be to enclose the time in it’s own array as follows:

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running")|.InstanceId, [.LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime]'
```

That does it, but it’s ugly. However it does give you a hint of what’s going on here. If you create a new field (in this case, I’ve created an array), that seems to stop the pipe in it’s tracks.
Armed with that knowledge, we could try making it into a string with string interpolation as follows:

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running")|.InstanceId, "\(.LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime)"'
```

That’s right; we’re grabbing the .InstanceId, but the .LaunchTime we’re stringifying and pushing that through two functions: string-parse-time (strptime) and
mktime to convert it to UNIX time.

```python
"i-053667d4e26795541"
"1588909533"
"i-0a775b8c631e8ad27"
"1588909844"
"i-061b358b9cfc20505"
"1588909844"
```

That has however caused us to lose some of our functionality that we had before (everything on one line for one instance). To solve that, we can put this back into an array as follows:

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running")|[.InstanceId, "\(.LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime)"]'
```

Of course, we now get an array back, but this can be solved using the add function (and a further jq invocation):

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running")|[.InstanceId, "\(.LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime)"]'|jq 'add'
```

Notice how the add in a separate jq adds the elements of the array together:

```python
"i-053667d4e267955411588909533"
"i-0a775b8c631e8ad271588909844"
"i-061b358b9cfc205051588909844"
```

Of course, this is still not ideal because we’ve now got a long sting and we would have to work out where the InstanceId stops and the UNIX timestamp starts.

A final change fixes that:

```python
jq -c '.Reservations[].Instances[]|select(.State.Name == "running") | [.InstanceId, ":", "\(.LaunchTime|strptime("%Y-%m-%dT%H:%M:%S.000Z")|mktime)"]' | jq 'add'
```

```python
"i-053667d4e26795541:1588909533"
"i-0a775b8c631e8ad27:1588909844"
"i-061b358b9cfc20505:1588909844"
```

Adding a raw flag to the second jq command fixes all the double-quotes too.

Until next time, happy jq\ing.
