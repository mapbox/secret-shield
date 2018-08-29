const octokit = require('@octokit/rest')();

function getRepos(org) {
  let options = {
    per_page: 100,
    org: org
  };
  let repos = [];


  function getRemanding(response, resolve, reject) {
    if (!octokit.hasNextPage(response)) {
      return resolve(repos);
    }

    octokit.getNextPage(response).then((response) => {
      repos = repos.concat(parseRepos(response));
      getRemanding(response, resolve, reject);
    }).catch((err) => {
      return reject(err);
    });
  }

  return new Promise((resolve, reject) => {
    octokit.repos.getForOrg(options).then((response) => {
      repos = repos.concat(parseRepos(response));
      getRemanding(response, resolve, reject);
    }).catch((err) => {
      return reject(err);
    });
  });

  function parseRepos(response) {
    return response['data'].map((repo) => {
      return {
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        archived: repo.archived,
        fork: repo.fork
      };
    });
  }
}

function main() {
  if (process.argv.length === 3) {
    let githubOrganization = process.argv[2];

    if (!process.env.hasOwnProperty('GITHUB_TOKEN')) {
      console.error('Export GITHUB_TOKEN env variable before using the script.');
      console.error(' export GITHUB_TOKEN=<your-token-here>');
      process.exit(1);
    }

    octokit.authenticate({
      type: 'token',
      token: process.env['GITHUB_TOKEN']
    });

    getRepos(githubOrganization).then((repos) => {
      repos = repos.filter((repo) => {
        return !repo.archived && !repo.name.toLowerCase().startsWith('deprecated-') && !repo.fork;
      });
      //console.log(JSON.stringify(repos, null, 2));
      for (repo of repos) {
        console.log(repo.name);
      }
    }).catch((err) => {
      console.log(JSON.parse(err.message).message);
    });
    return;
  }

  console.log('[USAGE] node getRepos.js <github-organization>');
}

main();
