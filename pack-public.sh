#!/bin/sh

packDestination=""
[ -z "$1" ] || packDestination="--pack-destination $(readlink -f -- "$1")"

cd "$(readlink -f -- "$(dirname "$0")")"

# pnpm doesn't like to recurse for the pack command, and turbo doesn't
# understand it as a package script. this script should pack a tarball for every
# non-private package.

pnpm turbo run build --filter="./packages/*"

for packageJ in packages/*/package.json; do
    package=$(dirname $packageJ)
    private=$(pnpm pkg get private -C "$package")
    if [ "$private" != "true" ]; then
        pnpm pack $packDestination -C "$package" &
    fi
done

wait
