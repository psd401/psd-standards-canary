---
type: Delivery Reference
title: Build and test scripts
description: The two npm scripts (build and test) in psd-standards-canary, the single node:test unit test, the glob fix that made test discovery work on current Node, and the narrow commands to validate changes.
tags: [build, test, node-test, npm-scripts, ci]
timestamp: 2026-10-08T05:35:32Z
openwiki:
  roles: [delivery, testing]
  change_kinds: [test-script, build-script, node-test]
  source_paths: [package.json, test/canary.test.js]
  symbols: [scripts.build, scripts.test, the canary sings]
  test_paths: [test/canary.test.js]
  invariants: ["The test script must pass a quoted glob to node --test; Node 21+ no longer accepts a directory path.", "The build script performs no compilation and only prints build ok.", "There are no dependencies, so no install step is required."]
  validation_commands: ["node --test test/canary.test.js", "node --test \"test/**/*.test.js\"", "node -e \"console.log('build ok')\""]
---

# Build and test scripts

The repository has no compiled output and no runtime code. Its delivery surface is two scripts in `package.json` and one unit test. They are the only checks this repository defines locally; what CI runs on top of them is defined by the external reusable workflows. For how CI invokes the repository, see [CI workflows](ci-workflows.md).

## Scripts

| Script | Command | Behavior |
|---|---|---|
| `build` | `node -e "console.log('build ok')"` | Prints `build ok` and exits 0. Nothing is compiled or bundled. |
| `test` | `node --test "test/**/*.test.js"` | Runs every file matching `test/**/*.test.js` with the Node built-in test runner. |

The `test` glob is quoted so Node expands it, not the shell. Passing the directory `test/` directly fails: `node --test test/` treats the directory as a module path and reports `Cannot find module '.../test'` as a failing test named `test`. This was reproduced on Node v22.23.3 during this wiki update (exit 1). Commit `a4bcab1` (which carries the "Fix test script" change) switched the script from `node --test test/` to the glob form on `main`; before that fix, CI on `main` had been failing since commit `4abcead`. A side branch, `origin/canary/test-pr`, holds a different attempt (commit `06d5b1b`) that changed the script to bare `node --test`; that change is not in `main`'s history.

## Test suite

- `test/canary.test.js` contains one case, `the canary sings`, which asserts `1 + 1` strictly equals `2`. It uses `node:test` `test` and `node:assert`.
- The suite has no fixtures, mocks, or external services. Adding a test means adding a `*.test.js` file under `test/`; the glob picks it up automatically.

## Verified behavior

Checked during this wiki run on Node v22.23.3:

- `node --test "test/**/*.test.js"` reports `tests 1`, `pass 1`, `fail 0`, exit 0.
- `node --test test/canary.test.js` passes the same single case.
- `node -e "console.log('build ok')"` prints `build ok` and exits 0.
- `node --test test/` exits 1 with a failing `test` case (the directory-argument failure described above).

Commit `a4bcab1`'s message records an earlier result: on Node v24.5.0, `node --test test/` reported a phantom failing test named `test` even though the single real test passed. That form is no longer used; keep the glob form.

## Validation for changes

Use the narrowest command that covers the change:

1. Changing a single test: `node --test test/canary.test.js`.
2. Changing test discovery or the `test` script: `node --test "test/**/*.test.js"` (this is exactly what `npm test` runs).
3. Changing the `build` script: `node -e "console.log('build ok')"`.

Environment note: in the sandbox used for this run, `npm run build` and `npm test` failed with `/usr/bin/env: 'node': No such file or directory` even though `node` exists at `/usr/local/bin/node`. Run the underlying commands directly when `npm` is unavailable. This is an environment issue, not a repository defect.

## Scope boundaries

- No install step is needed. Do not add a lockfile or dependency unless the first real dependency is being introduced; the Dependabot bun entry is tied to that event. See [Dependency updates](../operations/dependency-updates.md).
- Failure output from `node --test` is complete by default; there is no quieter flag wired into the scripts.

## Related

- [Architecture overview](../architecture/overview.md) for how the scripts fit the repository.
- [CI workflows](ci-workflows.md) for which events trigger the reusable checks that run these scripts.
