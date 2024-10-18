---
title: 'sts assume role - taking the pain away in bash'
date: 2022-07-14T06:37:00+10:00
authors: ['Hamish Whittal']
categories: ['Linux', 'Tools', 'bash', 'aws', 'sts']
description: "Let's assume a role...oh, but wait, that's painful in bash"
thumbnail: '/images/posts/bash/bash.webp'
---

We're often faced with having to assume a different role in order to deal with a customer issue. This is a pain on the cli because the aws sts assume role doesn't return credentials in a way that bash can use them right off the bat.

For instance, if you return json from the assume-role command, then you might get this sort of thing:

```python
{
    "Credentials": {
        "AccessKeyId": "ASIAXXXXXXXXXXXXXXXX",
        "SecretAccessKey": "IVdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "SessionToken": "FwoGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXbgRL+G2ftc6Y+hV27beWhNCVygejLEd43BaibOpodCUYZ+8n6ZlXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXqGo18tSWY//vuARVWu6w/fH1JNCqoeRkSh8RYnBp4uP+tkS2Cuk6CyzSJLSWn49sAbjIed6DkziXFyp1iWeHs+8etu87FazE/o0efIcMoo7b6+lgYyLWYsUR/ZfEs3NqPBipTCtYXkjF2LKvqlnleDjSsQoX8p7mi4c6vybN039YlL6w==",
        "Expiration": "2022-07-14T05:45:33Z"
    },
    "AssumedRoleUser": {
        "AssumedRoleId": "AROAX22JK3XNQ63JMSK7Q:hamish-test",
        "Arn": "arn:aws:sts::XXaccount-numberXXXXX:assumed-role/my_deployer_role/hamish-test"
    }
}
```

How do we turn this into something usable on the cli without copy-n-pasting? I'm super-lazy - or perhaps I just have a ton to do, so I don't like cut-n-paste unless I really have to do it.

What we want is this:

```python
export AWS_ACCESS_KEY_ID=ASIAXXXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=IVdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
export AWS_SESSION_TOKEN=FwoGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXbgRL+G2ftc6Y+hV27beWhNCVygejLEd43BaibOpodCUYZ+8n6ZlXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXqGo18tSWY//vuARVWu6w/fH1JNCqoeRkSh8RYnBp4uP+tkS2Cuk6CyzSJLSWn49sAbjIed6DkziXFyp1iWeHs+8etu87FazE/o0efIcMoo7b6+lgYyLWYsUR/ZfEs3NqPBipTCtYXkjF2LKvqlnleDjSsQoX8p7mi4c6vybN039YlL6w==
```

Here's a little 1-liner that will help. Slap this onto the end of your aws sts assume-role command and you should have what you're after.

```python
--query 'Credentials.{AWS_ACCESS_KEY_ID:AccessKeyId,AWS_SECRET_ACCESS_KEY:SecretAccessKey,AWS_SESSION_TOKEN:SessionToken}'|sed 's#"##g;/[}{]/d;s#,$##;s#: #=#;s#^[ ]*#export #'
```

The sed:

-   removes the curlies } and {
-   removed the comma at the end of the lines (we could make this better right?)
-   replaces the colon, space with an equals sign (': ' -> =)
-   replaces the spaces in the beginning with the export keyword

So the full command would now look as follows:

```python
aws sts assume-role --role-arn arn:aws:iam::XXXXXXXXXXXX:role/my_deployer_role --role-session-name "hamish-test" --profile emr-test --query 'Credentials.{AWS_ACCESS_KEY_ID:AccessKeyId,AWS_SECRET_ACCESS_KEY:SecretAccessKey,AWS_SESSION_TOKEN:SessionToken}'|sed 's#"##g;/[}{]/d;s#,$##;s#: #=#;s#^[ ]*#export #'
```

There you have it.

One final thing. If you want to ensure that you just run the command and bingo, it's all done for you, then `exec` it as follows:

```python
exec `aws sts assume-role --role-arn arn:aws:iam::XXXXXXXXXXXX:role/my_deployer_role --role-session-name "hamish-test" --profile emr-test --query 'Credentials.{AWS_ACCESS_KEY_ID:AccessKeyId,AWS_SECRET_ACCESS_KEY:SecretAccessKey,AWS_SESSION_TOKEN:SessionToken}'|sed 's#"##g;/[}{]/d;s#,$##;s#: #=#;s#^[ ]*#export #'`
```

Happy days.
