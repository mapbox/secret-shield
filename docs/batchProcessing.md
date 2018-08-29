# Batch processing

## Run the script in every repository

This process is split into two process

### Extract repositories

This process will generate a json file with the information of an organization.

```
export GITHUB=<your-github-token>
node scripts/getRepos.js <org> > file-output.json
```

Note: You can get a github token from https://github.com/settings/tokens

### Clone and analyze

```
node runSecretShield.js file-output.json
```

This command will clone all the repos defined in file-output to a directory and generates analysis files.