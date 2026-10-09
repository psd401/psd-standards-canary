---
type: Delivery Workflow
title: CI workflow callers
description: How the five GitHub Actions caller workflows in psd-standards-canary (psd-ci, license-check, openwiki-update, security-scan, claude-review) are triggered, what permissions and concurrency they set, and how each delegates to a reusable workflow in PSD401/.github that is not stored in this repository.
tags: [ci, github-actions, reusable-workflows, triggers, permissions, security-scan, claude-review]
timestamp: 2026-10-09T05:51:09Z
openwiki:
  roles: [delivery, operations]
  change_kinds: [workflow-trigger, reusable-workflow-delegation, permissions]
  source_paths: [.github/workflows/psd-ci.yml, .github/workflows/license-check.yml, .github/workflows/openwiki-update.yml, .github/workflows/security-scan.yml, .github/workflows/claude-review.yml]
  symbols: [jobs.psd-ci, jobs.license-check, jobs.openwiki, jobs.security-scan, jobs.claude-review]
  test_paths: []
  invariants: ["psd-ci runs on pull_request and on push to main only.", "license-check runs on pull_request only.", "openwiki-update holds contents: write and pull-requests: write and serializes runs in the openwiki concurrency group.", "security-scan runs on pull_request, push to main, a weekly Monday 09:00 UTC cron, and workflow_dispatch, with contents: read only and no secrets: inherit.", "claude-review runs on pull_request types opened, ready_for_review, and reopened, skips the dependabot[bot] actor, and requests id-token: write.", "Callers pin reusable workflows to @main deliberately, so org-level changes propagate."]
  validation_commands: ["git diff --check -- .github/workflows", "Verify changes with a pull request run in GitHub Actions; no local runner is defined in this repository."]
---

# CI workflow callers

All five workflows in `.github/workflows/` are thin callers. None of them defines build, test, license, scan, or review steps itself. Each job `uses:` a reusable workflow from the organization repository `PSD401/.github`, pinned to `@main`. Four pass `secrets: inherit`; the security scan does not (see the callers table). The behavior that actually runs in CI therefore lives outside this repository; this page documents only what the callers declare.

```mermaid
flowchart TD
  PR["Pull request"] --> LC["license-check.yml"]
  PR --> CI["psd-ci.yml"]
  PR --> SS["security-scan.yml"]
  PR --> CR["claude-review.yml"]
  PUSH["Push to main"] --> CI
  PUSH --> OW["openwiki-update.yml"]
  PUSH --> SS
  CRON["Weekly schedule Monday 08:00 UTC"] --> OW
  SCAN["Weekly schedule Monday 09:00 UTC"] --> SS
  MANUAL["Manual workflow_dispatch"] --> OW
  MANUAL --> SS
  CI --> RCI["reusable-psd-ci.yml at PSD401 .github main"]
  LC --> RLC["reusable-license-check.yml at PSD401 .github main"]
  OW --> ROW["reusable-openwiki.yml at PSD401 .github main"]
  SS --> RSS["reusable-security-scan.yml at PSD401 .github main"]
  CR --> RCR["reusable-claude-review.yml at PSD401 .github main"]
```

Caption: triggers for each caller workflow and the external reusable workflow each one delegates to.

## Callers

| Workflow | Triggers | Delegates to | Extra settings |
|---|---|---|---|
| `psd-ci.yml` (name `CI`, job `psd-ci`) | `pull_request`; `push` on `main` | `PSD401/.github/.github/workflows/reusable-psd-ci.yml@main` | `secrets: inherit` |
| `license-check.yml` (name `License`, job `license-check`) | `pull_request` only | `PSD401/.github/.github/workflows/reusable-license-check.yml@main` | `secrets: inherit` |
| `openwiki-update.yml` (name `OpenWiki Update`, job `openwiki`) | `workflow_dispatch`; `push` on `main`; cron `0 8 * * 1` | `PSD401/.github/.github/workflows/reusable-openwiki.yml@main` | `with: base_branch: main`; `secrets: inherit`; permissions and concurrency (below) |
| `security-scan.yml` (name `Security Scan`, job `security-scan`) | `pull_request`; `push` on `main`; cron `0 9 * * 1`; `workflow_dispatch` | `PSD401/.github/.github/workflows/reusable-security-scan.yml@main` | top-level and job `permissions: contents: read`; no `secrets` key, so no `secrets: inherit` |
| `claude-review.yml` (name `Claude Review`, job `claude-review`) | `pull_request` types `opened`, `ready_for_review`, `reopened` | `PSD401/.github/.github/workflows/reusable-claude-review.yml@main` | job `permissions`: `contents`, `pull-requests`, `issues` read and `id-token: write`; `if` skips `dependabot[bot]`; `secrets: inherit` |

## What the callers control

- **Triggers.** `psd-ci` runs on both pull requests and pushes to `main`. `license-check` runs only on pull requests. The OpenWiki job runs on push to `main`, weekly, and on demand. `security-scan` runs on pull requests, pushes to `main`, a weekly Monday 09:00 UTC cron (one hour after the OpenWiki cron), and on demand. `claude-review` runs only on pull requests that are opened, marked ready for review, or reopened.
- **Claude review.** The job requests `id-token: write`, which is the caller's responsibility because the org default token is read-only and reusable workflows cannot elevate permissions. Its `if` skips Dependabot-triggered runs, since those cannot grant `id-token: write` to the reusable and would fail at startup; the file comment says the reusable also self-guards. The commit that added it (`1e7081e`) describes the review as advisory: it posts one severity-tiered comment and never approves or blocks a merge. That is a commit-message claim; the reusable is not in this repository. The same message says OpenWiki-only pull requests are skipped, which is likewise not verifiable here.
- **Permissions (security scan).** `contents: read` at both the workflow and job level. It requests no write scopes, unlike the OpenWiki caller.
- **Secrets (security scan).** The caller omits `secrets: inherit`, so no organization secrets are forwarded to the reusable scan. It can use only the token its job permissions grant. This is the only caller that does not forward secrets; whether the scan needs any is not visible here.
- **Permissions (OpenWiki only).** `contents: write` and `pull-requests: write`. The inline comment states the caller must grant these because the org default token is read-only.
- **Concurrency (OpenWiki only).** Group `openwiki` with `cancel-in-progress: true`. The workflow comment explains that several merges in a row would otherwise queue full regenerations, and only the last output survives.
- **Action pinning.** The reusable reference uses `@main` on purpose, so central changes propagate to every repository (the comment cites a drift-kill design). The `zizmor: ignore[unpinned-uses]` annotations mark this as an accepted exception to pinning.

## Boundaries and gaps

- The reusable workflows are not in this repository. Their steps, the checks they report, and the auto-merge behavior are not inspectable here. The OpenWiki caller's commit message says `auto_merge` uses the reusable default (`true`) so that docs pull requests limited to `openwiki/` merge themselves. Treat that as a commit-message claim, not verified code. The same applies to `reusable-security-scan.yml`, whose scanners and reporting are unverified here; the pinning comment in `security-scan.yml` cites `psd-dev-standards` standards/06 as the reason for `@main`.
- Nothing in this repository runs the callers' results locally. The only local checks are the package scripts described in [Build and test](build-and-test.md).
- `psd-ci` also runs on `push` to `main`, where a failure is not surfaced by a pull request check. Commit `a4bcab1` reports that CI on `main` had failed since `4abcead` without being noticed, because the canary gets few pushes and no failure alert covers push-triggered CI.

## Change guidance

- Changing a trigger or permission: edit only the caller file, and keep the job name stable if branch protection or required checks refer to it. Verify with a pull request run in GitHub Actions; there is no local runner.
- Changing the reusable pin (for example `@main` to a tag): this crosses into the org's propagation policy. Escalate rather than changing it in a single repository.
- Changing `security-scan.yml` permissions or adding `secrets: inherit`: the scan currently runs read-only and without forwarded secrets. Widening either is a policy change to confirm against the reusable workflow before merging.
- Changing `claude-review.yml`: keep the Dependabot `if` guard, since removing it reintroduces the startup failure described in the file comment. Its review is advisory per the commit message, so do not add it as a required check without confirming with the org workflow owners.
- Validation before pushing: `git diff --check -- .github/workflows` is the narrowest local check available for whitespace; semantic validation happens only when Actions runs.

## Related

- [OpenWiki maintenance](../operations/openwiki-maintenance.md) for what the OpenWiki job does after it starts.
- [Dependency updates](../operations/dependency-updates.md) for how Dependabot keeps the `uses:` action versions current.
- [Architecture overview](../architecture/overview.md) for how these callers fit the enforcement-testing purpose.
