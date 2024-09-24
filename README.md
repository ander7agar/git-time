# git-time
Tool for count work time using commit references

### Requirements
- Nodejs >=v16

### Installation
1. Clone this repository
```shell
git clone https://github.com/ander7agar/git-time.git
```
2. Install binary
```shell
cd git-time
npm install -g .
```

### How to use
```shell
Usage: git-time [options] <path>

Time calculation for git repo based o commits

Arguments:
  path                   path or Git repository

Options:
  -V, --version          output the version number
  -b, --branch <branch>  branch to inspect (default: "master")
  -f, --from <commit>    inspect only after this commit
  -u, --to <commit>      inspect only before this commit
  -d, --dir <dir...>     directory to inspect
  -t, --tag <tag>        tag to inspect
  -o, --output <path>    export commits with duration in a csv file
  -h, --help             display help for command
```