---
type: Operations Policy
title: Dependency updates and Dependabot policy
description: Why psd-standards-canary's Dependabot config covers only github-actions on a weekly schedule, why the bun ecosystem entry is deliberately absent while the package has zero dependencies and no bun.lock, and what to change when the first real dependency is added.
tags: [dependabot, dependencies, bun, lockfile, github-actions, supply-chain]
timestamp: 2026-11-20T23:58:31Z
openwiki:
  roles: [operations, delivery]
  change_kinds: [dependency-policy, dependabot, lockfile]
  source_paths: [.github/dependabot.yml, package.json, .github/workflows/dependabot-auto-merge.yml]
  symbols: [updates, package-ecosystem, jobs.auto-merge]
  test_paths: []
  invariants: ["package.json declares no dependencies, so no lockfile is committed.", "Dependabot updates only github-actions, weekly, from the repository root.", "The dependabot-auto-merge caller acts only on pull requests authored by dependabot[bot] and is pinned to the v1.10.0 release, not the v1.0.0 release used by the other reusable refs.", "A bun ecosystem entry must be added together with the first real dependency and its bun.lock."]
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

- The `github-actions` ecosystem watches the `uses:` lines in `.github/workflows/`. Since commit `f350896`, every `uses:` ref is a full commit SHA, and the six org reusable workflows it pinned are at `PSD401/.github` `v1.0.0`. The Dependabot auto-merge caller is pinned to `PSD401/.github` `v1.10.0` (full SHA `6e5e24ce…`, same-line `# v1.10.0` comment), so every `uses:` ref now carries a release tag. Its pin moved from a pre-release branch commit in a recent change. The commit message for the earlier pinning work says the org standard expects Dependabot to bump these pins, which is the intended path for reusable-workflow updates. Whether Dependabot actually opens those pull requests here is not verified in this run. Before that change, the reusable refs were `@main`, a branch that Dependabot cannot version-bump.
- Dependabot pull requests that change a workflow run the same callers described in [CI workflows](../delivery/ci-workflows.md).
- Dependabot-triggered pull requests run the `claude-review` caller's Dependabot-only job, which reports the required check without a review. See [CI workflows](../delivery/ci-workflows.md#callers).
- Dependabot-authored pull requests also run the `dependabot-auto-merge` caller (`.github/workflows/dependabot-auto-merge.yml`). Its job is guarded to the `dependabot[bot]` actor and calls a `PSD401/.github` reusable with `contents: write`, `pull-requests: write`, and `merge_method: squash`. Its file comment says it targets patch updates to development dependencies, a rule that this repository cannot exercise today because it has no npm dependencies and Dependabot only watches `github-actions`. Changing the Dependabot scope therefore also changes which pull requests reach this auto-merge path; see [CI workflows](../delivery/ci-workflows.md#callers) for its trigger and permission details.

## Verification

- `git diff -- .github/dependabot.yml` for the change itself.
- `grep -rn 'uses:' .github/workflows` to confirm every reusable ref is a full SHA with a same-line `# vX.Y.Z` comment. Six point to `v1.0.0`; `dependabot-auto-merge.yml` points to `v1.10.0`.
- Dependabot activity is visible in the repository's Dependabot settings; there is no local command that exercises it.
- Once a bun entry exists, confirm `bun.lock` is committed in the same change, because the frozen-lockfile install in `psd-ci` depends on it.

## Related

- [Build and test](../delivery/build-and-test.md) for the scripts that use no installed packages today.
- [Architecture overview](../architecture/overview.md) for why the package is kept dependency-free.
