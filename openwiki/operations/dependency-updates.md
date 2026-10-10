---
type: Operations Policy
title: Dependency updates and Dependabot policy
description: Why psd-standards-canary's Dependabot config covers only github-actions on a weekly schedule, why the bun ecosystem entry is deliberately absent while the package has zero dependencies and no bun.lock, and what to change when the first real dependency is added.
tags: [dependabot, dependencies, bun, lockfile, github-actions, supply-chain]
timestamp: 2026-10-10T02:50:26Z
openwiki:
  roles: [operations, delivery]
  change_kinds: [dependency-policy, dependabot, lockfile]
  source_paths: [.github/dependabot.yml, package.json]
  symbols: [updates, package-ecosystem]
  test_paths: []
  invariants: ["package.json declares no dependencies, so no lockfile is committed.", "Dependabot updates only github-actions, weekly, from the repository root.", "A bun ecosystem entry must be added together with the first real dependency and its bun.lock."]
  validation_commands: ["git diff -- .github/dependabot.yml", "Check the Dependabot run or pull requests in the GitHub repository settings after a change."]
---

# Dependency updates and Dependabot policy

The package has no dependencies. `package.json` declares only `name`, `version`, `private`, `description`, and `scripts`, and the repository commits no lockfile. The only things Dependabot can usefully update today are the GitHub Actions versions referenced by the workflows in `.github/workflows/`.

## Current configuration

`.github/dependabot.yml` declares one update entry:

- `package-ecosystem: github-actions`, `directory: /`, `schedule.interval: weekly`.

The file header reads "Managed per PSD standards" and records the bun ecosystem decision in its comments.

## Why there is no bun entry

The comment in `.github/dependabot.yml` explains the trade-off:

- Bun repositories use the `bun` ecosystem in Dependabot. npm entries would edit `package.json` without a `bun.lock`, which makes the frozen-lockfile install in `psd-ci` refuse (per the file comment).
- This canary has zero JavaScript dependencies, so bun does not write a `bun.lock`. A `bun` Dependabot entry would only produce weekly "missing lockfile" errors.
- Commit `4abcead` states the same decision: "the standard bun ecosystem entry is deliberately omitted".
- Known cost: the bun ecosystem has no security-update pull requests. The comment notes that security alerts are unaffected and a weekly digest tracks them. This cost applies once the entry is added.

## When to change this

Add the standard bun entry, copied from the template the comment names (`template-nextjs-app`), together with the first real dependency and its committed `bun.lock`. Adding the entry earlier reintroduces the weekly failure.

Do not hand-add an npm entry: the file comment says npm entries edit `package.json` without a lockfile and break the frozen install.

## Interaction with workflows

- The `github-actions` ecosystem watches the `uses:` lines in `.github/workflows/`. Those lines reference org reusable workflows on `@main`, which is a branch rather than a version, so the callers' references are not version bumps Dependabot manages (general Dependabot behavior; not verified in this run). The GitHub Actions versions it can bump are whatever pinned `uses:` lines the caller files contain; the current callers all use `@main` for the reusable workflows.
- Dependabot pull requests that change a workflow run the same callers described in [CI workflows](../delivery/ci-workflows.md).
- `.github/workflows/dependabot-canary.yml` is a temporary exception. It pins `actions/checkout` to an outdated SHA (`v6.0.0`) on purpose, so the `github-actions` ecosystem opens an update pull request for it. The file is `workflow_dispatch` only and must be removed after the PSD401/.github#27 test. Do not treat its pin as a policy example.
- Dependabot-triggered pull requests run the `claude-review` caller's Dependabot-only job, which reports the required check without a review. See [CI workflows](../delivery/ci-workflows.md#callers).

## Verification

- `git diff -- .github/dependabot.yml` for the change itself.
- Dependabot activity is visible in the repository's Dependabot settings; there is no local command that exercises it.
- Once a bun entry exists, confirm `bun.lock` is committed in the same change, because the frozen-lockfile install in `psd-ci` depends on it.

## Related

- [Build and test](../delivery/build-and-test.md) for the scripts that use no installed packages today.
- [Architecture overview](../architecture/overview.md) for why the package is kept dependency-free.
