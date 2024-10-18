---
title: 'Automated approach to using AWS SSO for Athena JDBC'
date: 2023-02-22T10:24:47+10:00
authors: ['Stephen Hunt']
categories: ['Spark', 'PySpark', 'Tuning']
description: 'Using AWS SSO (IAM Identity Center) to set up CLI and Athena JDBC access for the day'
thumbnail: '/images/posts/login.png'
---

I'm sure most of you can relate to the struggle of having to constantly refresh credentials while working on the AWS CLI and, while using _AWS SSO_ (or as it's now been rebranded, _IAM Identity Center_[1]) does make the task somewhat less painful, there are still some scenarios where setting up credentials for the day is a tedious process. In our work with [Capitec Bank](https://www.linkedin.com/company/capitec-bank/), we had this scenario with users wanting to set up DBeaver to connect to AWS Athena using JDBC.

### The Issue

Now the sensible method of setting up the JDBC driver in DBeaver is to have it use a CLI profile since that way you don't have to copy and paste access keys etc. around all the time. It's also nice and easy to set up [2].
The downside of this, is that AWS SSO just simply doesn't play nicely with the JDBC ProfileCredentialsProvider class since it looks for the credentials in `~/.aws/credentials`, which doesn't get populated when running an `aws sso login`.

You may ask _So where do the credentials from an aws sso login go then?_, to which the answer is the `~/.aws/sso/cache/` directory, where they are stored in a different format to the usual access key, secret access key, and session token. That makes life slightly more difficult since now the Athena JDBC driver can't find the credentials and leaves you with the fallback of copying the credentials from the SSO login page into the file yourself, or using an alternative credential provider class.

Well that's that right? Well thankfully it's not. With a bit of scripting (I chose python myself since then it can work on Unix systems or Windows), you can handle running the SSO login, fetching the credentials, and populating the `~/.aws/credentials` file all with one simple command.

![One click login](/images/posts/one-click-login.webp)

### The solution

In my digging into this issue, I stumbled across a script that was previously written for the same purpose [3], although without the initial SSO login, which I see as a bit of an oversight. Thankfully, the script was easily extended to include the SSO login call since it can be done with the simple line `subprocess.Popen(f"aws sso login --profile {profile_name}").wait()`.

Now, assuming that the SSO logins are configured for a full 8 hour day, all you need to do to set up both you CLI and Athena JDBC access in the morning is run a single python script. If you want to, you can even take it a step further and set your OS to run it on startup and your credential worries are sorted!

### References

[1] https://github.com/dbeaver/dbeaver/issues/3918
[2] https://stackoverflow.com/questions/71205184/connect-to-to-aws-athena-using-the-aws-sso-from-dbeaver
[3] https://gist.github.com/sgtoj/af0ed637b1cc7e869b21a62ef56af5ac
