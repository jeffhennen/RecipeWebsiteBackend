
To keep this running in the background, Follow this command

Keep Linux Process Running After Logout
We will use the disown command, which is used after the process has been executed and put in the background, its work is to remove a shell job from the shell’s active list jobs, therefore you will not use fg, bg commands on that particular job anymore.

In addition, when you close the controlling terminal or log out, the job will not hang or send a SIGHUP to any child jobs.

Let’s take a look at the below example of using the diswon bash built-in function.

$ sudo rsync Templates/* /var/www/html/files/ &
$ jobs
$ disown  -h  %1
$ jobs
Keep Linux Process Running After Closing Terminal
Keep Linux Process Running After Closing Terminal
You can also use the nohup command, which also enables a process to continue running in the background when a user exits a shell.

$ nohup tar -czf iso.tar.gz Templates/* &
$ jobs
Put Linux Process in Background After Closing Shell
Put Linux Process in Background After Closing Shell