# secret-shield [![Build Status](https://travis-ci.com/mapbox/secret-shield.svg?token=xWoUHsqdcvsQdxzwqjXH&branch=main)](https://travis-ci.com/mapbox/secret-shield)

<!-- MarkdownTOC -->

1. [🚨 Are you being blocked from committing? 🚨](#%F0%9F%9A%A8-are-you-being-blocked-from-committing-%F0%9F%9A%A8)
1. [About secret-shield](#about-secret-shield)
1. [Install](#install)
1. [Requirements](#requirements)
    1. [Quick Install and setup](#quick-install-and-setup)
    1. [Manual Install](#manual-install)
    1. [Uninstalling](#uninstalling)
1. [Using secret-shield](#using-secret-shield)
    1. [Setting up automated searching](#setting-up-automated-searching)
    1. [Manually searching](#manually-searching)
    1. [Additional functionality](#additional-functionality)
1. [FAQ:](#faq)
    1. [Does secret-shield auto-update?](#does-secret-shield-auto-update)
    1. [Why secret-shield?](#why-secret-shield)
    1. [What does it search for, exactly?](#what-does-it-search-for-exactly)
    1. [It says it found a secret but it’s not, what do I do?](#it-says-it-found-a-secret-but-it%E2%80%99s-not-what-do-i-do)
    1. [It says it found a secret and it actually is a secret, what do I do?](#it-says-it-found-a-secret-and-it-actually-is-a-secret-what-do-i-do)
    1. [Does it work with my git client?](#does-it-work-with-my-git-client)
    1. [I already have pre-commit hooks for something else, will secret-shield work with them?](#i-already-have-pre-commit-hooks-for-something-else-will-secret-shield-work-with-them)
        1. [Husky + lint-staged integration](#husky--lint-staged-integration)

<!-- /MarkdownTOC -->

<a id="%F0%9F%9A%A8-are-you-being-blocked-from-committing-%F0%9F%9A%A8"></a>
## 🚨 Are you being blocked from committing? 🚨

Some repositories [require secret-shield](./docs/enabledBadge.md) to commit to them. If you don't have secret-shield you'll be blocked from committing to those repos

If secret-shield is installed on your machine, [read this](https://github.com/mapbox/secret-shield/blob/main/docs/commonIssues.md) for common issues with secret-shield and how to fix them.

<a id="about-secret-shield"></a>
## About secret-shield

`secret-shield` is a convenient way to protect against inadvertently committing potential secrets to GitHub. It can be set up to automatically run before each commit (if it catches something, it will stop the commit and ask you to review the findings), or you can manually run it from the command line.

![Secret-shield in action](https://github.com/mapbox/secret-shield/raw/assets/shield.gif)

**Please note:** secret-shield will now be required when working with certain repositories. [Learn more](./docs/enabledBadge.md).

**If you want to add secret-shield to your repository**, [take a look here](./docs/enabledRepositories.md).

<a id="install"></a>
## Install

<a id="requirements"></a>
## Requirements

`secret-shield` is a Node project [tested with Node 10 & 12](https://github.com/mapbox/secret-shield/blob/main/.travis.yml)

`secret-shield` requires `npm >= 6` to install globally. Previous versions of npm will not correcly install the required dependencies.

<a id="quick-install-and-setup"></a>
### Quick Install and setup

```
npm install -g @mapbox/secret-shield
```

You still need to [set it up](#setting-up-automated-searching). Easiest way: `secret-shield --add-hooks global`.

<a id="manual-install"></a>
### Manual Install

Clone this repository, then from inside it, run:

```
npm install
npm link
```

Tests are available using `npm test`.

You still need to [set it up](#setting-up-automated-searching). Easiest way: `secret-shield --add-hooks global`.

<a id="using-secret-shield"></a>

### Uninstalling

To uninstall secret-shield:
1. make sure that you don't have any global hooks configured for secret-shield: `secret-shield --remove-hooks global`
2. uninstall secret-shield normally (if you installed using npm, you can run `npm remove -g @mapbox/secret-shield`)

## Using secret-shield

You can set up `secret-shield` to automatically search for secrets before each commit, or manually run it from anywhere.

<a id="setting-up-automated-searching"></a>
### Setting up automated searching

`secret-shield` uses pre-commit hooks to run before each commit and check for secrets only in whatever changes you've made. You can create these hooks either globally or on a per-repository basis.
* To create a global pre-commit hook that will run on all repositories, run `secret-shield --add-hooks global` (to remove, use `--remove-hooks global`)
* To create pre-commit hooks only for your current repository, run `secret-shield --add-hooks local` (to remove, use `--remove-hooks local`). Note that, if working with others, it's almost always a better idea to [install secret-shield directly in your repository](./docs/enabledRepositories.md) so that everyone who works on it uses secret-shield.

If a potential secret is found, secret-shield will abort the commit and provide you with its findings. After reviewing the findings, you can either go back and change your files or force the commit through without any checks by running `git commit` with the `--no-verify` flag.

<a id="manually-searching"></a>
### Manually searching

You can manually use `secret-shield` to search through:
* Files: `secret-shield <--file|-f> <file>`
* Directories: `secret-shield <--directory|-d> <directory>`
* Repositories: `secret-shield <--repository|-r> <repository> [branch]`
* Strings: `secret-shield <--string|-s> <string>`
* CloudFormation template files: automatically detected

Use `<--redact|-R> [number]` if you need to redact potentially sensitive information: output will be truncated to the specified number of characters.

<a id="additional-functionality"></a>
### Additional functionality

* You can [change the rules used by `secret-shield`](./docs/ruleManipulation.md) and also [write your own rules](./docs/writingRules.md).
* You can [specify advanced output (such as JSON output) and redaction rules](./docs/outputManipulation.md).
* Secret-shield also supports some [basic batch processing](./docs/batchProcessing.md). (Work in progress)

<a id="faq"></a>
# FAQ:

<a id="does-secret-shield-auto-update"></a>
## Does secret-shield auto-update?

Yes, secret-shield will automatically check for updates on average once in every 20 runs as a pre-commit hook.

<a id="why-secret-shield"></a>
## Why secret-shield?

Credential leaks are frequently a problem in any organization or team. Secret-shield aims to nullify the impact of a credential leak by blocking it *before the secret has a chance to get out in the first place*.

When combined with documented best practices for handling secrets, secret-shield can dramatically reduce the probability of a leaked secret. Secret-shield can find already-leaked secrets much faster than searching by hand -- when combined with a robust incident response framework, this can significantly reduce the impact of a credential leak.

Security researchers can use secret-shield to find and report leaked secrets to affected teams or organizations.

<a id="what-does-it-search-for-exactly"></a>
## What does it search for, exactly?

By default, secret-shield performs a minimal search: AWS client IDs, Mapbox secure keys, Slack tokens, and GitHub tokens.

If you [perform more advanced searches](https://github.com/mapbox/secret-shield/blob/main/docs/ruleManipulation.md#alternate-ruleset), secret-shield can look for more things, such as AWS secret IDs, “don’t commit” messages, and high-entropy strings.

<a id="it-says-it-found-a-secret-but-it%E2%80%99s-not-what-do-i-do"></a>
## It says it found a secret but it’s not, what do I do?

If it ran automatically before a commit, simply commit with the `--no-verify` flag. It won’t prompt you about those findings again, unless you change something in those lines.

If you ran it manually, you can ignore the findings.

<a id="it-says-it-found-a-secret-and-it-actually-is-a-secret-what-do-i-do"></a>
## It says it found a secret and it actually is a secret, what do I do?

If it ran automatically before a commit and the secret wasn’t there before, simply go back and remove the secret: it didn’t commit it, so you’re safe.

If the secret was there before (so it’s already been committed), or if you ran it manually and it found a secret that’s already been committed, the secret should be considered compromised -- follow your company or project's procedures for handling leaked secrets.

<a id="does-it-work-with-my-git-client"></a>
## Does it work with my git client?

Secret-shield uses pre-commit hooks; some clients support them, others just force commits through regardless. You should check your client’s documentation on whether it supports pre-commit hooks.

<a id="i-already-have-pre-commit-hooks-for-something-else-will-secret-shield-work-with-them"></a>
## I already have pre-commit hooks for something else, will secret-shield work with them?

Yes! Secret-shield will automatically detect any local hooks that you have, e.g. husky, and run them instead. If you want to run secret-shield on that repository, you should add it to those local hooks. [Take a look here.](https://github.com/mapbox/secret-shield/blob/main/docs/enabledRepositories.md)

<a id="husky--lint-staged-integration"></a>
### Husky + lint-staged integration

You can use secret-shield with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) by adding secret-shield as an npm dependency in your package.json and using the following configuration

```json
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && secret-shield --check-and-run"
    }
  },
  "lint-staged": {
    "*": [
      "command2",
      "command2"
    ]
  }
```

If you are using an old version of husky

```json
  "scripts": {
    "precommit": "lint-staged && secret-shield --check-and-run"
  },
  "lint-staged": {
    "*": [
      "command2",
      "command2"
    ]
  }
```
