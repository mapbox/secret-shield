const shell = require('shelljs');
const fs = require('fs');

function analyze(reposFilePath) {
  let repositories = fs.readFileSync(reposFilePath, 'utf-8');
  repositories = JSON.parse(repositories);

  // TODO: Delete the dir if the dir was created and the script fails.
  let dirResults = 'secret-shield-results';
  let dirRepos = 'secret-shield-repos';

  if (fs.existsSync(dirResults)) {
    console.log(`${dirResults} directory exists. Remove it if you want to use this tool.`);
    process.exit(1);
  }

  if (!fs.existsSync(dirResults)){
    fs.mkdirSync(dirResults);
  }

  if (fs.existsSync(dirRepos)) {
    console.log(`${dirRepos} directory exists. Remove it if you want to use this tool.`);
    process.exit(1);
  }

  if (!fs.existsSync(dirRepos)){
    fs.mkdirSync(dirRepos);
  }

  shell.cd(dirRepos);

  for (let repo of repositories) {
    let gituri = `git@github.com:${repo.fullName}.git`;
    shell.exec(`git clone --depth=1 ${gituri}`);
  }

  for (let repo of repositories) {
    let repoFolder = repo.name.replace('/', '--');
    shell.exec(`secret-shield -d ${repoFolder} -o json`, {silent: true}).to(`./../${dirResults}/${repoFolder}--secret-shield-results.json`);
  }
}

function main() {
  if (!shell.which('secret-shield')) {
    shell.echo('Sorry, this script requires secret-shield');
    shell.exit(1);
  }

  if (process.argv.length === 3) {
    let repoFilePath = process.argv[2];
    analyze(repoFilePath);

    return;
  }

  console.log('[USAGE] runSecretShield.js <pathToGithubRepos.json>');
  console.log('  See getRepos.js to see how to generate pathToGithubRepos.json');

}

main();