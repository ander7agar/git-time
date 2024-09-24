const moment = require("moment");
const fs = require('fs');

function getCommitFiles(commit, git, callback) {
    if (typeof callback === 'function') {
        git.show(commit.hash, {'--pretty': '', '--name-only': null})
            .then(response => {
                let files = response.split('\n');
                callback(files);
            })
    }
}
function sortCommits(commits) {
    commits.sort((c1, c2) => {
        return c1.date.isBefore(c2.date) ? -1 : 1;
    })

    return commits;
}
function parseCommits(commits) {
    let parsedCommits = [];

    for(let c of commits) {
        parsedCommits.push({
            hash: c.hash,
            message: c.message,
            date: moment(c.date)
        })
    }



    return sortCommits(parsedCommits);
}

async function getAllCommits(git) {
    let result = await git.log('master');
    let commits = result.all;
    let parsedCommits = parseCommits(commits);

    let allCommits = {
        commits: parsedCommits
    }
    for (let x = 0; x < parsedCommits.length; x++) {
        let c = parsedCommits[x];
        allCommits[c.hash] = x;
    }

    return allCommits;

}

async function calculateTime(commits, git, callback) {
    let allCommits = await getAllCommits(git);
    let duration = moment.duration(0, 'seconds');

    for (let c of commits) {
        let cIndex = allCommits[c.hash];
        let commitAfter;

        if (cIndex > 0) {
            commitAfter = allCommits.commits[cIndex - 1];

            //console.log(c.hash + ":", c.date, commitAfter.hash + ":", commitAfter.date, c.date.isSame(commitAfter.date, 'day'))
            if (c.date.isSame(commitAfter.date, 'day')) {
                let diff = c.date.diff(commitAfter.date, 'seconds', true);
                duration.add(diff, 's');
            }
        }
    }

    return duration;

}

async function toCsv(commits, git, file) {
    let allCommits = await getAllCommits(git);

    let fileContent = 'commit|date|message|duration\n'

    let pushedCommits = [];

    for (let c of commits) {
        if (pushedCommits.includes(c.hash)) {
            continue;
        }

        let cIndex = allCommits[c.hash];
        let commitBefore;

        if (cIndex > 0) {
            commitBefore = allCommits.commits[cIndex - 1];
            if (c.date.isSame(commitBefore.date, 'day')) {
                let diff = c.date.diff(commitBefore.date);
                //console.log(diff)
                let duration = moment.utc(diff).format('HH:mm:ss');
                fileContent += `${c.hash}|${c.date.format('YYYY-MM-DD HH:mm:ss')}|${c.message}|${duration}\n`

                pushedCommits.push(c.hash);
            }
        }
    }

    fs.writeFileSync(file, fileContent, 'utf8');
}
module.exports = {
    getCommitFiles,
    sortCommits,
    parseCommits,
    getAllCommits,
    calculateTime,
    toCsv
}