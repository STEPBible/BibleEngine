# @bible-engine/importers

## Install

The package can be installed via yarn or npm as usual. However in it's current state it makes more sense to clone this repository and use the code as a reference implementation.

## Usage

Currrently there is no config file and you have to set the datasource parameters directly in `src/main.ts` (or `lib/main.js` if you just use the npm package).

To start the server run `npm run start` for the transpiled version.

To run from `src/` via `ts-node` with a watcher enabled run `npm run startDev`. You might have to run `npx pm2 install typescript` before.

To setup your database please refer to the [importers package](../importers).

## Contribution welcome

In case someone wants to make this more "standalone", feel free to refactor this into something that can imported from the package and intialized with a custom configuration. PRs welcome.
