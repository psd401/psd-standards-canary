---
type: Wiki Entrypoint
title: psd-standards-canary wiki quickstart
description: Start here. Explains what the psd-standards-canary repository is (a throwaway PSD401 enforcement-testing repo with a minimal Node package), maps common change intents to source entry points, symbols, focused tests, and validation commands, and links every major wiki section.
tags: [quickstart, overview, navigation, canary, ci, openwiki]
timestamp: 2026-10-09T21:50:22Z
openwiki:
  roles: [repository, architecture]
  change_kinds: [navigation, onboarding]
  source_paths: [README.md, package.json, .github/workflows/psd-ci.yml, .github/workflows/license-check.yml, .github/workflows/openwiki-update.yml, .github/workflows/security-scan.yml, .github/workflows/claude-review.yml, .github/dependabot.yml, test/canary.test.js]
  symbols: [scripts.build, scripts.test]
  test_paths: [test/canary.test.js]
  invariants: ["The repository is a throwaway enforcement-testing canary with zero JavaScript dependencies."]
  validation_commands: ["node --test \"test/**/*.test.js\"", "node -e \"console.log('build ok')\""]
---

# psd-standards-canary wiki quickstart

`psd-standards-canary` is a public, throwaway PSD401 (Peninsula School District) repository. Its README says it exists to **test the PSD401 enforcement stack**: rulesets, required checks, secret scanning, and Actions policy. The code is intentionally minimal: a private Node package with two scripts, one unit test, five GitHub Actions caller workflows, a Dependabot config, and this generated wiki. There is no application logic, and breaking it on purpose is in scope.

## Start here

- [Architecture overview](architecture/overview.md): what each component is for and how the components relate, including the boundary with org-level enforcement settings that live outside this repository.
- [Build and test](delivery/build-and-test.md): the `build` and `test` scripts, the single unit test, and the Node version quirks that shaped the test command.
- [CI workflows](delivery/ci-workflows.md): triggers, permissions, concurrency, and secrets for the `CI`, `License`, `OpenWiki Update`, `Security Scan`, and `Claude Review` workflows, and how each delegates to a reusable workflow in `PSD401/.github`.
- [OpenWiki maintenance](operations/openwiki-maintenance.md): how the committed `openwiki/` tree is regenerated, why it is committed here, and the rules for editing it.
- [Dependency updates](operations/dependency-updates.md): the Dependabot policy, the deliberate absence of a bun ecosystem entry, and what to add with the first real dependency.

## Task routing

Use this table to go from a change intent to the first files to read. Commands run from the repository root.

| Change area or intent | Wiki page | Source entry points | Key symbols or keys | Focused tests | Minimal validation |
|---|---|---|---|---|---|
| Unit test behavior or the test runner | [Build and test](delivery/build-and-test.md) | `test/canary.test.js`, `package.json` | `test` case "the canary sings"; `scripts.test` | `node --test test/canary.test.js` | `node --test "test/**/*.test.js"` |
| Build script output | [Build and test](delivery/build-and-test.md) | `package.json` | `scripts.build` | none | `node -e "console.log('build ok')"` |
| PR and push CI wiring (`CI` workflow) | [CI workflows](delivery/ci-workflows.md) | `.github/workflows/psd-ci.yml` | job `psd-ci`; `uses:` of `reusable-psd-ci.yml@main` | none local; check the GitHub Actions run | `git diff --check -- .github/workflows` |
| License check on pull requests | [CI workflows](delivery/ci-workflows.md) | `.github/workflows/license-check.yml`, `LICENSE` | job `license-check` | none local | `git diff --check -- .github/workflows` |
| Claude review triggers, permissions, or Dependabot guard (`Claude Review` workflow) | [CI workflows](delivery/ci-workflows.md) | `.github/workflows/claude-review.yml` | job `claude-review`; `if` skipping `dependabot[bot]`; `id-token: write`; `uses:` of `reusable-claude-review.yml@main`; `secrets` passing only `BEDROCK_API_KEY` | none local; check the GitHub Actions run | `git diff --check -- .github/workflows` |
| Org security scan triggers, permissions, or secrets (`Security Scan` workflow) | [CI workflows](delivery/ci-workflows.md) | `.github/workflows/security-scan.yml` | job `security-scan`; top-level `permissions: contents: read`; no `secrets: inherit`; `uses:` of `reusable-security-scan.yml@main` | none local; check the GitHub Actions run | `git diff --check -- .github/workflows` |
| OpenWiki regeneration triggers, permissions, secrets, or concurrency | [OpenWiki maintenance](operations/openwiki-maintenance.md) | `.github/workflows/openwiki-update.yml` | job `openwiki`; `concurrency.group` `openwiki`; `permissions`; `secrets` passing `BEDROCK_API_KEY` and `PSD_AUTOMATION_APP_PRIVATE_KEY` by name | none local | `git status --short openwiki` after a manual run |
| Editing or regenerating wiki pages | [OpenWiki maintenance](operations/openwiki-maintenance.md) | `openwiki/` (generated) | `openwiki/.last-update.json` `gitHead` | none | `git status --short openwiki` |
| Dependabot scope or the bun ecosystem | [Dependency updates](operations/dependency-updates.md) | `.github/dependabot.yml`, `package.json` | `updates` `github-actions` entry | none | `git diff -- .github/dependabot.yml` |
| Adding the first runtime or dev dependency | [Dependency updates](operations/dependency-updates.md) | `package.json`, `.github/dependabot.yml` | `dependencies`, `package-ecosystem` | `node --test test/canary.test.js` | Commit `bun.lock` with the change, then run `node --test "test/**/*.test.js"` and `node -e "console.log('build ok')"` |
| Repository purpose, enforcement boundary, or licensing | [Architecture overview](architecture/overview.md) | `README.md`, `LICENSE` | MIT license text | none | none |

## Working agreements

- Prefer the narrowest check that proves the change. `node --test test/canary.test.js` is the fastest focused test; `node --test "test/**/*.test.js"` is what `npm test` runs. Both runs print a pass/fail summary, and failures print full diagnostics.
- Workflow changes can only be fully validated by GitHub Actions. There is no local runner for the reusable workflows.
- Do not hand-edit `openwiki/` pages unless explicitly asked; regenerate them through the OpenWiki workflow. See [OpenWiki maintenance](operations/openwiki-maintenance.md).
- `npm` itself failed to start in the sandbox used to verify this wiki (its `env node` lookup failed), while `node` invoked directly ran the same commands. If `npm test` fails with `node: not found`, run the underlying command shown in the table.

## Backlog

- **Reusable workflow internals** (`PSD401/.github` `reusable-psd-ci.yml`, `reusable-license-check.yml`, `reusable-openwiki.yml`, `reusable-security-scan.yml`, `reusable-claude-review.yml`): not in this repository, so steps, required checks, scanners, review behavior, and the OpenWiki auto-merge behavior are unverified here. Source anchor: `.github/workflows/psd-ci.yml`, `.github/workflows/openwiki-update.yml`, `.github/workflows/security-scan.yml`, `.github/workflows/claude-review.yml`. Reason: evidence is outside this checkout. Covered as caller-side behavior in [CI workflows](delivery/ci-workflows.md).
- **Org enforcement settings** (branch rulesets, required status checks, secret scanning, Actions policy): configured in GitHub settings and the org repository, not in files here. Source anchor: `README.md`. Reason: out of scope for file-based documentation; the architecture page describes only the repository's side.
