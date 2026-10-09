---
type: Architecture Overview
title: psd-standards-canary architecture overview
description: What the psd-standards-canary repository is for, its components (package scripts, one unit test, four CI caller workflows, Dependabot config, generated OpenWiki pages), and how they relate to PSD401 org-level enforcement.
tags: [architecture, canary, enforcement, ci, openwiki]
timestamp: 2026-10-09T05:32:30Z
openwiki:
  roles: [architecture, repository]
  change_kinds: [repository-layout, enforcement-testing]
  source_paths: [README.md, package.json, test/canary.test.js, .github/workflows/psd-ci.yml, .github/workflows/license-check.yml, .github/workflows/openwiki-update.yml, .github/workflows/security-scan.yml, .github/dependabot.yml, LICENSE]
  symbols: [scripts.build, scripts.test]
  test_paths: [test/canary.test.js]
  invariants: ["The repository has zero JavaScript dependencies and no lockfile.", "Code in this repository exists to exercise PSD401 enforcement; intentional breakage is in scope."]
  validation_commands: ["node --test \"test/**/*.test.js\"", "node -e \"console.log('build ok')\""]
---

# psd-standards-canary architecture overview

`psd-standards-canary` is a throwaway, public repository from PSD401 (Peninsula School District). Its README states it exists to **test the PSD401 enforcement stack**: rulesets, required checks, secret scanning, and Actions policy. Nothing here is real product code, and the repository is expected to be broken on purpose. The committed code is deliberately minimal so that failures in CI or policy checks can be attributed to the enforcement setup, not to application logic.

## Components

| Component | Source | Responsibility |
|---|---|---|
| Package manifest | `package.json` | Private package (`"private": true`) with no `dependencies` or `devDependencies` keys. Defines the `build` and `test` scripts. See [Build and test](../delivery/build-and-test.md). |
| Unit test | `test/canary.test.js` | One `node:test` case, `the canary sings`, asserting `1 + 1 === 2`. It is the only executable test. |
| PR and push CI caller | `.github/workflows/psd-ci.yml` | Runs on pull requests and pushes to `main`; delegates to an org reusable workflow. See [CI workflows](../delivery/ci-workflows.md). |
| License check caller | `.github/workflows/license-check.yml` | Runs on pull requests; delegates to an org reusable license check. See [CI workflows](../delivery/ci-workflows.md). |
| OpenWiki update caller | `.github/workflows/openwiki-update.yml` | Regenerates this wiki on push, weekly, and manually. See [OpenWiki maintenance](../operations/openwiki-maintenance.md). |
| Security scan caller | `.github/workflows/security-scan.yml` | Runs the org security scan on pull requests, pushes to `main`, weekly, and manually; read-only permissions and no forwarded secrets. See [CI workflows](../delivery/ci-workflows.md). |
| Dependabot config | `.github/dependabot.yml` | Weekly `github-actions` updates only. See [Dependency updates](../operations/dependency-updates.md). |
| License | `LICENSE` | MIT License, copyright PSD401 (2026). |
| Generated wiki | `openwiki/` | Generated documentation (this knowledge base). Not hand-maintained; see [OpenWiki maintenance](../operations/openwiki-maintenance.md). |

## How the pieces relate

- The four caller workflows contain no build, scan, or license logic of their own. Each one `uses:` a reusable workflow from `PSD401/.github`, pinned to `@main`. The reusable workflows' contents are not in this repository, so what they run against this code is an evidence gap; see [CI workflows](../delivery/ci-workflows.md) for what the callers do and do not show.
- CI execution depends on the package scripts. The only local checks are `npm test` and `npm run build`; see [Build and test](../delivery/build-and-test.md).
- The OpenWiki workflow writes into `openwiki/` on `main`, and the commit that added it notes that a committed wiki is needed so org-level OpenWiki smoke tests can exercise the update-an-existing-wiki path. The mechanics are in [OpenWiki maintenance](../operations/openwiki-maintenance.md).
- Dependabot watches the workflow files, so action version bumps arrive as pull requests that run the same caller workflows. See [Dependency updates](../operations/dependency-updates.md).

## Dependency and runtime posture

- No runtime or dev dependencies are declared, so no lockfile is committed. The `bun` Dependabot ecosystem is deliberately absent because bun will not write a lockfile for a dependency-free `package.json`.
- Tests and build use only Node built-ins (`node:test`, `node:assert`) and `node -e`. See [Build and test](../delivery/build-and-test.md).

## Out of scope for this repository

- Branch rulesets, required status checks, secret scanning, and Actions policy are configured at the organization or repository settings level, not in files here. This wiki can only describe what the repository exposes to them.
- Application behavior: there is none. The `build` script only prints `build ok`.

## Related pages

- [Quickstart](../quickstart.md) for task routing.
- [Build and test](../delivery/build-and-test.md) for the scripts and the test suite.
- [CI workflows](../delivery/ci-workflows.md) for triggers, permissions, and reusable-workflow delegation.
- [OpenWiki maintenance](../operations/openwiki-maintenance.md) for how this wiki is regenerated.
- [Dependency updates](../operations/dependency-updates.md) for Dependabot policy.
 Dependabot policy.
