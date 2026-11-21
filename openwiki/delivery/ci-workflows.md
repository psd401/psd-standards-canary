---
type: Delivery Workflow
title: CI workflow callers
description: How the six GitHub Actions caller workflows in psd-standards-canary (psd-ci, license-check, openwiki-update, security-scan, claude-review, dependabot-auto-merge) are triggered, what permissions and concurrency they set, and how each delegates to a reusable workflow in PSD401/.github that is not stored in this repository. Covers the Dependabot auto-merge caller, which is pinned to the v1.10.0 reusable release while the other six callers pin v1.0.0.
tags: [ci, github-actions, reusable-workflows, triggers, permissions, security-scan, claude-review, dependabot, auto-merge]
timestamp: 2026-11-20T23:58:31Z
openwiki:
  roles: [delivery, operations]
  change_kinds: [workflow-trigger, reusable-workflow-delegation, permissions, required-check-shim, auto-merge]
  source_paths: [.github/workflows/psd-ci.yml, .github/workflows/license-check.yml, .github/workflows/openwiki-update.yml, .github/workflows/security-scan.yml, .github/workflows/claude-review.yml, .github/workflows/dependabot-auto-merge.yml]
  symbols: [jobs.psd-ci, jobs.license-check, jobs.openwiki, jobs.security-scan, jobs.claude-review, jobs.claude-review-dependabot, jobs.auto-merge]
  test_paths: []
  invariants: ["psd-ci runs on pull_request and on push to main only.", "license-check runs on pull_request only.", "openwiki-update holds contents: write and pull-requests: write and serializes runs in the openwiki concurrency group.", "security-scan runs on pull_request, push to main, a weekly Monday 09:00 UTC cron, and workflow_dispatch, with contents: read only and no secrets: inherit.", "claude-review runs on pull_request types opened, synchronize, ready_for_review, and reopened, skips the dependabot[bot] actor, and requests id-token: write.", "claude-review-dependabot runs only for the dependabot[bot] actor, has no permissions, and reports the same claude-review check name so the required context is satisfied.", "openwiki-update forwards only BEDROCK_API_KEY and PSD_AUTOMATION_APP_PRIVATE_KEY by name, not secrets: inherit.", "claude-review forwards only BEDROCK_API_KEY by name, not secrets: inherit.", "dependabot-auto-merge runs on every pull_request event, runs its job only for the dependabot[bot] actor, has top-level permissions: {}, and grants contents: write and pull-requests: write only at job level.", "Six of the seven uses: refs point to PSD401/.github v1.0.0 commit 1aa5f5351a78b15f5c71668037f5d35b9613ae41; the dependabot-auto-merge ref points to v1.10.0 commit 6e5e24ce26be55aebe0b786f4190cda409d4d33a.", "Every uses: ref is a full 40-character commit SHA with a same-line # vX.Y.Z comment.", "claude-review-dependabot delegates to reusable-claude-review-skip.yml at the same v1.0.0 SHA, not to the review reusable."]
  validation_commands: ["git diff --check -- .github/workflows", "grep -rn 'uses:' .github/workflows (every ref should be a 40-hex SHA with a same-line # vX.Y.Z comment)", "Verify changes with a pull request run in GitHub Actions; no local runner is defined in this repository."]
---

# CI workflow callers

All six workflows in `.github/workflows/` are thin callers. None of them defines build, test, license, scan, review, or merge steps itself. Each job `uses:` a reusable workflow from the organization repository `PSD401/.github`, pinned to a full commit SHA. Six pin to the `v1.0.0` release (`1aa5f53…`). The Dependabot auto-merge caller pins to the `v1.10.0` release (`6e5e24ce…`), so it is the one ref on a different release line. Two pass `secrets: inherit` (`psd-ci`, `license-check`). The OpenWiki and Claude review callers each pass named secrets only: OpenWiki passes `BEDROCK_API_KEY` and `PSD_AUTOMATION_APP_PRIVATE_KEY`, and Claude review passes `BEDROCK_API_KEY`. The security scan and the Dependabot auto-merge caller pass no secrets. The behavior that actually runs in CI therefore lives outside this repository; this page documents only what the callers declare.

```mermaid
flowchart TD
  PR["Pull request"] --> LC["license-check.yml"]
  PR --> CI["psd-ci.yml"]
  PR --> SS["security-scan.yml"]
  PR --> CR["claude-review.yml"]
  PR --> DAM["dependabot-auto-merge.yml (Dependabot actor only)"]
  PUSH["Push to main"] --> CI
  PUSH --> OW["openwiki-update.yml"]
  PUSH --> SS
  CRON["Weekly schedule Monday 08:00 UTC"] --> OW
  SCAN["Weekly schedule Monday 09:00 UTC"] --> SS
  MANUAL["Manual workflow_dispatch"] --> OW
  MANUAL --> SS
  CI --> RCI["reusable-psd-ci.yml at PSD401 .github v1.0.0"]
  LC --> RLC["reusable-license-check.yml at PSD401 .github v1.0.0"]
  OW --> ROW["reusable-openwiki.yml at PSD401 .github v1.0.0"]
  SS --> RSS["reusable-security-scan.yml at PSD401 .github v1.0.0"]
  CR --> RCR["reusable-claude-review.yml at PSD401 .github v1.0.0"]
  DAM --> RDAM["reusable-dependabot-auto-merge.yml at PSD401 .github v1.10.0"]
```

Caption: triggers for each caller workflow and the external reusable workflow each one delegates to.

## Callers

| Workflow | Triggers | Delegates to | Extra settings |
|---|---|---|---|
| `psd-ci.yml` (name `CI`, job `psd-ci`) | `pull_request`; `push` on `main` | `PSD401/.github/.github/workflows/reusable-psd-ci.yml@1aa5f53…` (`v1.0.0`) | `secrets: inherit` |
| `license-check.yml` (name `License`, job `license-check`) | `pull_request` only | `PSD401/.github/.github/workflows/reusable-license-check.yml@1aa5f53…` (`v1.0.0`) | `secrets: inherit` |
| `openwiki-update.yml` (name `OpenWiki Update`, job `openwiki`) | `workflow_dispatch`; `push` on `main`; cron `0 8 * * 1` | `PSD401/.github/.github/workflows/reusable-openwiki.yml@1aa5f53…` (`v1.0.0`) | `with: base_branch: main`; `secrets` passes `BEDROCK_API_KEY` and `PSD_AUTOMATION_APP_PRIVATE_KEY` by name; permissions and concurrency (below) |
| `security-scan.yml` (name `Security Scan`, job `security-scan`) | `pull_request`; `push` on `main`; cron `0 9 * * 1`; `workflow_dispatch` | `PSD401/.github/.github/workflows/reusable-security-scan.yml@1aa5f53…` (`v1.0.0`) | top-level and job `permissions: contents: read`; no `secrets` key, so no `secrets: inherit` |
| `claude-review.yml` (name `Claude Review`, job `claude-review`) | `pull_request` types `opened`, `synchronize`, `ready_for_review`, `reopened` | `PSD401/.github/.github/workflows/reusable-claude-review.yml@1aa5f53…` (`v1.0.0`) | job `permissions`: `contents`, `pull-requests`, `issues` read and `id-token: write`; `if` skips `dependabot[bot]`; `secrets` passes only `BEDROCK_API_KEY: ${{ secrets.BEDROCK_API_KEY }}` |
| `claude-review.yml` job `claude-review-dependabot` (reports check name `claude-review`) | `pull_request` (same file); runs only when the actor is `dependabot[bot]` | `PSD401/.github/.github/workflows/reusable-claude-review-skip.yml@1aa5f53…` (`v1.0.0`) | `permissions: {}`; no secrets; exists so the required `claude-review` context is reported on Dependabot pull requests |
| `dependabot-auto-merge.yml` (name `Dependabot auto-merge`, job `auto-merge`) | `pull_request` (no `types` filter); the job runs only when `github.event.pull_request.user.login` is `dependabot[bot]` | `PSD401/.github/.github/workflows/reusable-dependabot-auto-merge.yml@6e5e24ce26be55aebe0b786f4190cda409d4d33a` (`# v1.10.0`, not `v1.0.0`) | top-level `permissions: {}`; job `permissions`: `contents: write`, `pull-requests: write`; `with: merge_method: squash`; no `secrets` key |

## What the callers control

- **Triggers.** `psd-ci` runs on both pull requests and pushes to `main`. `license-check` runs only on pull requests. The OpenWiki job runs on push to `main`, weekly, and on demand. `security-scan` runs on pull requests, pushes to `main`, a weekly Monday 09:00 UTC cron (one hour after the OpenWiki cron), and on demand. `claude-review` runs only on pull requests that are opened, receive a new push (`synchronize`), are marked ready for review, or are reopened.
- **Claude review.** The job requests `id-token: write`, which is the caller's responsibility because the org default token is read-only and reusable workflows cannot elevate permissions. Its `if` skips Dependabot-triggered runs, since those cannot grant `id-token: write` to the reusable and would fail at startup; the file comment says the reusable also self-guards. Its secrets are scoped to the one key the reusable reads, `BEDROCK_API_KEY` (Claude on Amazon Bedrock). An earlier version used `secrets: inherit`, which handed the review job every org and repository secret; the commit that narrowed it cites the decision in `PSD401/.github#16`, which is also a commit-message claim. The `synchronize` type (commit `32dbc7c`) makes the review re-run after each push to a pull request, not only when the PR is opened, marked ready, or reopened. Per that commit message, a re-review posts only new or unresolved IMPORTANT findings and says which earlier findings are fixed. The same message says the review is a required check on production repos, but it never fails on its findings; the commit that added the workflow (`1e7081e`) describes it as posting one severity-tiered comment and not approving or blocking merges. These are commit-message claims; the reusable is not in this repository. The same message says OpenWiki-only pull requests are skipped, which is likewise not verifiable here.
- **Dependabot auto-merge.** The workflow runs on every `pull_request` event, but its single job is guarded by `if: github.event.pull_request.user.login == 'dependabot[bot]'`, so human-authored pull requests skip it. The file comment says the reusable turns on auto-merge for Dependabot pull requests whose every update is a patch to a development dependency, citing `standards/04-security.md` rule 4 (a standards document not in this repository). The repository has no npm dependencies today, so whether any Dependabot pull request here ever matches that rule is not visible in this checkout. The job's `contents: write` and `pull-requests: write` are the only grants; the workflow sets `permissions: {}` at the top level and passes no secrets. Its `merge_method: squash` is the only `with:` input. The caller is pinned to the `v1.10.0` release commit `6e5e24ce…` with a `# v1.10.0` comment. A recent commit replaced an earlier pre-release branch pin, and the file header now describes the behavior and the `merge_method` choice rather than a canary run. Its release differs from the `v1.0.0` used by the other six reusable refs, so the two release lines coexist in this repository.
- **Permissions (security scan).** `contents: read` at both the workflow and job level. It requests no write scopes, unlike the OpenWiki caller.
- **Secrets (security scan).** The caller omits `secrets: inherit`, so no organization secrets are forwarded to the reusable scan. It can use only the token its job permissions grant. It is the only caller that forwards no secrets at all; whether the scan needs any is not visible here. Claude review forwards exactly one named secret, as described above. The Dependabot auto-merge caller also forwards no secrets.
- **Permissions (OpenWiki only).** `contents: write` and `pull-requests: write`. The inline comment states the caller must grant these because the org default token is read-only.
- **Secrets (OpenWiki only).** The caller passes exactly two named secrets, not `secrets: inherit` (commit `27c4745`, whose message says the reusable workflow reads only these two). `BEDROCK_API_KEY` is the model credential. `PSD_AUTOMATION_APP_PRIVATE_KEY` is the key for the psd-automation GitHub App that, per the commit message, opens and merges the docs pull request. Both the App role and the reusable's use of the key are commit-message claims; the reusable is not in this repository.
- **Concurrency (OpenWiki only).** Group `openwiki` with `cancel-in-progress: true`. The workflow comment explains that several merges in a row would otherwise queue full regenerations, and only the last output survives.
- **Action pinning.** Every `uses:` ref is pinned to a full 40-character commit SHA, not a branch. All seven refs carry a same-line `# vX.Y.Z` version comment: six name `v1.0.0`, and the Dependabot auto-merge caller names `v1.10.0` (see above). The reusable refs were previously `@main`; commit `f350896` moved all six release-pinned refs to the `v1.0.0` release commit (`1aa5f53…`) and removed the earlier `@main` and `zizmor: ignore[unpinned-uses]` comments. The commit message gives the reason: under `@main`, any merge in `PSD401/.github` ran immediately in every caller with this repository's permissions and secrets, and the org standard (`psd-dev-standards` standards/06 §4, per the commit message) requires SHA pins with Dependabot bumping them. Those are commit-message claims; the standard itself is not in this repository.

## Boundaries and gaps

- The reusable workflows are not in this repository. Their steps, the checks they report, and the auto-merge behavior (including `reusable-dependabot-auto-merge.yml` at `v1.10.0`, which is not visible here) are not inspectable here. The OpenWiki caller's commit message says `auto_merge` uses the reusable default (`true`) so that docs pull requests limited to `openwiki/` merge themselves. Treat that as a commit-message claim, not verified code. The same applies to `reusable-security-scan.yml`, whose scanners and reporting are unverified here; commit `f350896` says the security-scan reusable will fail any unpinned `uses:` ref once its next release lands (`PSD401/.github#30`), so the SHA pin is required there too. Because the auto-merge job requests write scopes on a Dependabot-authored pull request, whether those writes succeed depends on the token GitHub grants to Dependabot-triggered runs; that behavior is not in this repository and is unverified here.
- Nothing in this repository runs the callers' results locally. The only local checks are the package scripts described in [Build and test](build-and-test.md).
- `psd-ci` also runs on `push` to `main`, where a failure is not surfaced by a pull request check. Commit `a4bcab1` reports that CI on `main` had failed since `4abcead` without being noticed, because the canary gets few pushes and no failure alert covers push-triggered CI.

## Change guidance

- Changing a trigger or permission: edit only the caller file, and keep the job name stable if branch protection or required checks refer to it. Verify with a pull request run in GitHub Actions; there is no local runner.
- Changing a reusable pin (for example moving the `v1.0.0` SHA to a newer release): this crosses into the org's propagation policy. Keep the full SHA and its same-line `# vX.Y.Z` comment together, and keep the six `v1.0.0` reusable refs on one commit; the Dependabot auto-merge caller is pinned separately. Do not reintroduce `@main`; the org standard requires SHA pins, and the commit that added them says `@main` let any upstream merge run at once in every caller. Escalate rather than changing the pin in a single repository.
- Changing `openwiki-update.yml` secrets: keep the explicit two-name list. Adding a secret means the reusable workflow needs it; widening back to `secrets: inherit` exposes every org and repository secret to the docs job, which the commit `27c4745` removed on purpose.
- Changing `dependabot-auto-merge.yml`: keep the `dependabot[bot]` actor guard on the job, since it is the only thing that limits merging to Dependabot pull requests. Keep the top-level `permissions: {}` and the job-level write grants together; widening either, or adding `secrets`, changes what an automatic merge can touch. Moving the `6e5e24ce…` pin to another release changes which reusable behavior runs, so confirm with the `PSD401/.github` owners first. Keep the `# v1.10.0` comment in sync with the SHA.
- Changing `security-scan.yml` permissions or adding `secrets: inherit`: the scan currently runs read-only and without forwarded secrets. Widening either is a policy change to confirm against the reusable workflow before merging.
- Changing `claude-review.yml`: keep the Dependabot `if` guard, since removing it reintroduces the startup failure described in the file comment. Keep `claude-review-dependabot` in step with the main job: its job name must stay `claude-review`, or the Dependabot required context disappears. Its shim job references `reusable-claude-review-skip.yml` at the same `v1.0.0` SHA as the main job; the earlier PR-branch pin was removed. Keep the explicit `BEDROCK_API_KEY` pass-through; switching back to `secrets: inherit` widens the review job to every org and repository secret. Its trigger types include `synchronize`, so each push to an open PR re-runs the review; removing that type changes how often the check runs. Commit `32dbc7c` says the review is a required check on production repos, so changes to its trigger, guard, or failure behavior affect merges and should be confirmed with the org workflow owners.
- Validation before pushing: `git diff --check -- .github/workflows` is the narrowest local check available for whitespace; semantic validation happens only when Actions runs.

## Related

- [OpenWiki maintenance](../operations/openwiki-maintenance.md) for what the OpenWiki job does after it starts.
- [Dependency updates](../operations/dependency-updates.md) for how Dependabot keeps the `uses:` action versions current and how the Dependabot auto-merge caller fits that path.
- [Architecture overview](../architecture/overview.md) for how these callers fit the enforcement-testing purpose.
sting purpose.
) for how these callers fit the enforcement-testing purpose.
w these callers fit the enforcement-testing purpose.
sting purpose.
) for how these callers fit the enforcement-testing purpose.
t the enforcement-testing purpose.
