# I'm seeing [![Secret-shield enabled](https://github.com/mapbox/secret-shield/blob/assets/secret-shield-enabled-badge.svg)](https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md) in some repos, what does it mean?

**Note:** [![Secret-shield enabled](https://github.com/mapbox/secret-shield/blob/assets/secret-shield-enabled-badge.svg)](https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md) was previously called [![Secret-shield partner!](https://github.com/mapbox/secret-shield/blob/assets/partner-badge.svg)](https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md) prior to this repository's open-sourcing.

Some teams have decided to partner with secret-shield to help protect not only their repositories from accidentally committed secrets, but every other repository on the contributors' machines as well. You need to have secret-shield installed and configured globally if you want to commit to these partner repositories.

**Do the following:**

```
npm install -g @mapbox/secret-shield
secret-shield --add-hooks global
```

## I'm encountering issues and can't commit, help!

Follow these steps:
1. Install secret-shield as described above, then try again.
2. If that doesn't work, follow the errors that appear on-screen.
3. If that doesn't work, [take a look here for common issues](https://github.com/mapbox/secret-shield/blob/master/docs/commonIssues.md).
4. If that doesn't work and you need to commit right now, run `git commit` with the `--no-verify` flag to skip all checks, including the check for secrets.
5. If you need further help or want to report a bug, [open a ticket in secret-shield](https://github.com/mapbox/secret-shield/issues/new).
6. If you need more immediate help, message us in the #secret-shield slack channel.

### What if I have my own local pre-commit hooks set for some repositories?

You still need to install these global hooks. They won't interfere with the local hooks because the local hooks will take precedence.

### What if I have my own global pre-commit hooks?

You will be required to have `secret-shield --pre-commit` somewhere in your global pre-commit hook file, alongside your other hooks.

**The easy way:** add the following lines inside your hooks file:

```
# load NVM - this is important for environments are noninteractive e.g. IDEs
# if NVM isn't installed then this won't do anything.
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

secret-shield --pre-commit || exit 1
```

You can also choose to integrate secret-shield however else you want with your pre-commit hooks, as long as you put `secret-shield --pre-commit` somewhere in there.

### What if I have a hooks manager as a global pre-commit hook?

[See here.](./commonIssues.md#global-hooks-managers)
