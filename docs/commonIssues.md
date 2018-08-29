# Fixing common secret-shield issues

**If you're being blocked from committing** something that needs to go out **right now**, run `git commit` with the `--no-verify` flag to bypass all the pre-commit checks such as the check for secrets.

## It says "You must have secret-shield installed and configured globally" but I do have it installed!

If you recently changed your version of node, such as upgrading from node 8 to node 10, you have to install secret-shield again for that version as well: `npm install -g @mapbox/secret-shield` and `secret-shield --add-hooks global`.

Run `secret-shield --add-hooks global` then try again. If command was not found, then that means secret-shield was not installed globally: run `npm install -g @mapbox/secret-shield` followed by `secret-shield --add-hooks global`.

If it still doesn't work, **some IDEs are known to lock node to a specific version**, or use a different version of node. Follow these steps:
1. If the repository uses husky, you'll see an info line above the error that looks like: `husky > pre-commit (node v8.10.0)`. Otherwise, check with your IDE's documentation to see which version of node it uses.
2. Check that secret-shield is installed in that version of node: `nvm use VERSION_FROM_ABOVE` and install secret-shield.
3. If you're using vscode, there's a known issue with **vscode not properly loading your environment PATH**. You can either run `git commit` in your terminal or:
    * run `secret-shield --info` in your terminal and look for `installed_dir`
    * run `sudo ln -s {the installed_dir you get from above}/secret-shield.js /usr/local/bin/secret-shield` (for example, if `installed_dir` is `/home/arya/.nvm/versions/node/v10.5.0/lib/node_modules/@mapbox/secret-shield/bin` then you'd run `sudo ln -s /home/arya/.nvm/versions/node/v10.5.0/lib/node_modules/@mapbox/secret-shield/bin/secret-shield.js /usr/local/bin/secret-shield`)
    * you'll have to run the above again if you permanently switch to a new node version, but if you just switch between node versions for testing purposes you won't need to

## Known configuration incompatibilities

### Having a `.bin` directory in your `$PATH`

Note the dot in `.bin`. If your bin doesn't have a dot, this doesn't apply.

If:
1. secret-shield is installed in a directory that is named `.bin` (either at the top level or further down), **AND**
2. that `.bin` directory is in your `$PATH`

Then the pre-commit hook will not properly detect secret-shield and report it as not installed.

**How to check:**
1. Open a brand-new terminal and run `command -v secret-shield`. If the output contains a directory named `.bin` (with the dot), then your hooks won't work for the above reason.
2. Alternatively, run `secret-shield --info` and look for `installed_dir`.

**How to fix:**
1. Run `npm install -g @mapbox/secret-shield` **in a fresh terminal**. That should place secret-shield somewhere that is not in a `.bin` folder.
2. If that doesn't work, take a look at your `$PATH` and move any entries that contain `.bin` to the very end. Open a new terminal and see "how to check" again.
3. If that doesn't work, check where npm installs global packages (the ones installed by `npm install -g`) by default. It should be set up so it doesn't install in a `.bin` directory.

### Global hooks managers

If you use a hooks manager to configure your global hooks, then the secret-shield checker will not properly detect that your hooks run secret-shield even if they do.

**Help us help you:**

If you [open a ticket](https://github.com/mapbox/secret-shield/issues/new) and copy-paste your pre-commit hooks file (run `git config --global core.hooksPath` to find out the directory, the file is `pre-commit` inside) in the ticket, we'll be able to push an update to secret-shield that fixes that issue for you.

**Temporary fix:**

Manually going in to those hooks and adding `secret-shield --pre-commit || exit 1` in the hooks should fix the issue. If your hooks manager clobbers your hooks on every update, consider setting up your hooks manager in a different location, and have your global hooks invoke your manager's hooks, for example your global pre-commit hooks would look like this:

```bash
#!/bin/sh

# load NVM - this is important for environments are noninteractive e.g. IDEs
# if NVM isn't installed then this won't do anything.
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

secret-shield --pre-commit || exit 1

/path/to/my/hooks/manager/hooks.sh
```

To point git to the above script as a hook, name the above script `pre-commit` and run `git config --global core.hooksPath '/directory/that/contains/the/above/script`.

Please [let us know](https://github.com/mapbox/secret-shield/issues/new) if you're encountering any issues. We're working really hard to make this as convenient as possible for you! If this is urgent, ping us in the #secret-shield slack channel.

## My hooks are in a critical state, help!

Don't panic! This simply means that your global git pre-commit hooks have somehow ended up being misconfigured. The git global hooks are a configuration parameter in git that points to a directory that contains the executable hooks. With secret-shield, the directory is somewhere in your secret-shield installation.

Follow these steps:

1. If you have the `secret-shield` command available, run `secret-shield --add-hooks global` and it should reconfigure your hooks correctly.
    * If it doesn't work, run `npm install -g @mapbox/secret-shield@latest` to get the latest version of secret-shield and try again
2. To find out where your hooks are pointing, run `git config --global core.hooksPath`. They should point to either:
    * your own hooks (if you use custom global hooks)
    * inside the `secret-shield` installation directory, under `config/hooks`.
3. Manually set your hooks to point to the desired directory by running `git config --global core.hooksPath '/absolute/path/to/hooks/dir'`.
4. If nothing else works, try simply clearing your global git hooks by running `git config --global core.hooksPath ''`.
5. If none of this has worked and you're being blocked from committing, run your `git commit` with the `--no-verify` flag to temporarily make it work and then [open a ticket](https://github.com/mapbox/secret-shield/issues/new).

## It says my "secret-shield is installed but not working properly"

This means that the `secret-shield` command is available in your terminal, but running it causes errors. Running `npm install -g @mapbox/secret-shield@latest` should resolve this issue. Make sure that your secret-shield installation is at `1.0.0-alpha.1` or above.

If that didn't work, and when you installed secret-shield, you manually cloned the secret-shield github repository and ran `npm link`, try:
 * `git pull` in the directory (and `git checkout master` if you're not in the master branch)
 * `npm install`
 * `npm link`

If you run `secret-shield --info`, it should print some information without erroring. If that works and yet you're still getting the above error, and you're blocked from committing, run your `git commit` with the `--no-verify` flag to temporarily make it work and then [open a ticket](https://github.com/mapbox/secret-shield/issues/new).

# Additional troubleshooting info

[The list of exit codes is documented here.](./exitCodes.md)

Common troubleshooting steps (helping a user who's running secret-shield):
1. Ask them to run `secret-shield --info`. Check for installed version. If it's 0.x.x then they should run `npm install -g @mapbox/secret-shield` to get the latest version.
2. If the version is 1.x.x check out `installed_dir`. Does it contain a `.bin` directory?
3. If you need them to update and they're already at 1.x.x: ask them to run `secret-shield --update`. If that doesn't work, `npm install -g @mapbox/secret-shield` and `secret-shield --add-hooks global`
