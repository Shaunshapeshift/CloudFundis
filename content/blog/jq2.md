---
title: 'jq - lessons 3 to 6'
date: 2020-05-05T10:24:47+10:00
authors: ['Hamish Whittal']
categories: ['Linux', 'Tools']
description: 'The second part in a series where I dive into the awesome things one can do with JQ.'
thumbnail: '/images/posts/jq/jq.webp'
---

## Previously on jq....

```python
aws ec2 describe-instances | jq '.Reservations[].Instances[] | keys'
```

This shows us all the keys for all the Reservations for all the Instances I have launched in AWS. Perhaps we wish to know what the state of the instances are?

I see there’s a State in the resulting keys. Perhaps that has the state of all instances.

## Lesson 3

### JSON is case sensitive

JSON is case sensitive, so

```python
aws ec2 describe-instances | jq '.Reservations[].Instances[].state'
```

returns nothing, while

```python
aws ec2 describe-instances | jq '.Reservations[].Instances[].State'
```

returns

```python
{
  "Code": 80,
  "Name": "stopped"
}
```

Ok. Cool. I only have one instance launched here, so this shows only one instance in a stopped state.

In jq terminology, we’ve applied a filter to this data. First we applied a filter of all Reservations, then all Instances and finally a filter of State.

If I look in an account with more instances running, then I see

```python
{
  "Code": 16,
  "Name": "running"
}
{
  "Code": 16,
  "Name": "running"
}
{
  "Code": 80,
  "Name": "stopped"
}
{
  "Code": 16,
  "Name": "running"
}
```

Nice, though, that’s only partially useful, because I would like to know what the instanceId’s are of the running and stopped instances.

## Lesson 4

### Retriving more than a single key at once

We could loop through this and do the aws call multiple times, retrieving the instanceId first and then….BARF…Urgh, just writing that sentence make me sick.

There MUST be a better way?

Indeed. If we pipe ( | ) the output of the .Reservations[].Instances[] and ‘grab’ the keys we’re interested in, then that would work:

```python
aws ec2 describe-instances | jq '.Reservations[].Instances[] | .InstanceId,.State'
```

reults in:

```python
"i-0a775b8c631e8ad27"
{
  "Code": 16,
  "Name": "running"
}
"i-061b358b9cfc20505"
{
  "Code": 16,
  "Name": "running"
}
...
```

Now we’re cooking.

NOTE: I’m going to leave out the aws cli command from here, since really, it’s adding no value to the learning and making the scroll-box on your browser ugly.

## Lesson 5

### Is there a way to only get the ‘Name’ and not the ‘Code’?

Funny you should ask that. There sure is.

```python
jq '.Reservations[].Instances[] | .InstanceId,.State.Name'
```

```python
    "i-0a775b8c631e8ad27"
    "running"
    "i-061b358b9cfc20505"
    "running"
```

Ooooh…that’s so much better! Simply adding the subkey to the key you want solves this nicely.

Finally, you may be wondering about the double-quotes. That’s going to hinder us later when we’re trying to do something useful with this - like put it in a script.

Using the ‘raw’ flag ( -r ) for jq solve that.

```python
jq -r '.Reservations[1,3].Instances[] | .InstanceId,.State.Name'
```

NOTE: I slipped something into this last command I’ve not talked about. The selection of various elements of the Reservations array. See it there: 1,3? That’s saying the second and the 4th elements of this array. Remember JSON arrays are indexed from 0.

## Lesson 6

### Could we make this all end on the same line?

Well, this is something I would like to be able to do.

There are a couple of ways of doing this. To begin, use the compact ( -c ) flag. This will compact the output, but still, without a little fancy footwork in your jq expression, it’ll not have the desired results.

To understand this, you should know that the output after the pipe is writing two strings namely InstanceId and then State. What we really want to do is combine those outputs into a new string

We could try this:

```python
jq -c '.Reservations[1,3].Instances[] | ".InstanceId, .State.Name"'
```

however that produces two strings with .InstanceId, .State.Name. Not quite what we want.

We could use an array to combine these strings into a new array as follows:

```python
jq -c '.Reservations[1,3].Instances[] | [.InstanceId, .State.Name]'
```

which results in:

```python
["i-0a775b8c631e8ad27","running"]
["i-061b358b9cfc20505","running"]
```

Better. However if we’re going to be generating this for some further processing, we’re THEN going to have to remove the square braces in the next stage of processing. Not ideal.

So we could try string interpolation as follows:

```python
jq -c '.Reservations[1,3].Instances[] | "\(.InstanceId), \(.State.Name)"'
```

This encloses our values as a string. In jq documentation, this is discussed under String interpolation. When we place our fields inside round braces, escaping the opening brace it forces jq to interpolate them as a string.

The above command (almost) does what we want. Why almost? Because we’ve got the double-quote back again. But we know how to solve that; with the ‘raw’ flag.

```python
jq -rc '.Reservations[1,3].Instances[] | "\(.InstanceId), \(.State.Name)"'
```
