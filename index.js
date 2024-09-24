#! /usr/bin/env node

const { Command } = require('commander');
const pkg = require('./package');
const { simpleGit, gitP} = require('simple-git');
const moment = require("moment");
const { parseCommits, getAllCommits, calculateTime, getCommitFiles, toCsv, sortCommits} = require('./src/analyzer');

const program= new Command();

program
    .name('git-time')
    .description('Time calculation for git repo based o commits')
    .version(pkg.version)

program
    .argument('<path>', 'path or Git repository')
    .option('-b, --branch <branch>', 'branch to inspect', 'master')
    .option('-f, --from <commit>', 'inspect only after this commit')
    .option('-u, --to <commit>', 'inspect only before this commit')
    .option('-d, --dir <dir...>', 'directory to inspect')
    .option('-t, --tag <tag>', 'tag to inspect')
    .option('-o, --output <path>', 'export commits with duration in a csv file')
    .action(async (path, options) => {
        console.log(path, options);

        let gitOptions = {};

        let revision = options.branch;
        if (options.tag) {
            revision = options.tag;
        }

        //console.log(gitOptions);
        let git = simpleGit(path);

        let combinedCommits = [];
        let getDuration = async function(dir) {
            let opt = Object.assign({}, gitOptions);
            opt.file = dir;

            console.log('optDuration', opt)
            let result = await git.log(revision, opt);

            let commits = result.all;
            console.log('commits', commits[0]);

            let parsedCommits = parseCommits(commits);
            combinedCommits = combinedCommits.concat(parsedCommits);

            let resultCommits = [];
            let fromIndex;
            let toIndex;
            if (options.from) {
                //From commit
                let fromCommit = options.from;
                let firstCommit = (commit) => commit.hash === fromCommit;
                fromIndex = parsedCommits.findIndex(firstCommit);
                if (fromIndex < 0) {
                    fromIndex = 0;
                }
            }

            if (options.to) {
                let toCommit = options.to;
                let lastCommit = (commit) => commit.hash === toCommit;
                toIndex = parsedCommits.findIndex(lastCommit);
                if (toIndex < 0) {
                    toIndex = parsedCommits.length-1;
                }
            }

            resultCommits = parsedCommits.slice(fromIndex, toIndex);

            if (resultCommits.length > 0) {
                console.log('First commit', resultCommits[0].hash)
                console.log('Last commit', resultCommits[resultCommits.length-1].hash )
                console.log('Total commits:' + resultCommits.length);
            } else {
                console.log(`No commits found for ${dir}`);
            }


            return await calculateTime(resultCommits, git);
        }

        let duration = moment.duration(0, 'seconds');

        if (options.dir) {
            for (let dir of options.dir) {
                let time = await getDuration(dir);
                duration.add(time);

            }
        } else {
            let time = await getDuration(path);
            duration.add(time);
        }

        console.log('Time', duration.toISOString());

        if (options.output) {
            combinedCommits = sortCommits(combinedCommits);
            await toCsv(combinedCommits, git, options.output);
        }


    })

program.parse();