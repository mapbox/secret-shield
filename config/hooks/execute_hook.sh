#!/bin/sh

HOOK=$(basename $0)

# Execute a repository-local hook first.
LOCAL_HOOK=$(git rev-parse --show-toplevel 2>/dev/null | sed -e "s/\$/\/.git\/hooks\/$HOOK/")
if [ ! -z "$LOCAL_HOOK" ] && [ -x "$LOCAL_HOOK" ]; then
    exec "$LOCAL_HOOK" "$@"
    exit 1
fi

# If there's no repository-local hook, try executing a secret-shield hook if it exists.
SHIELD_HOOK=$(dirname $0)/$HOOK.local
if [ -x "$SHIELD_HOOK" ]; then
    exec "$SHIELD_HOOK" "$@"
    exit 1
fi
