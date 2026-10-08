# Files

- [Build and test scripts](build-and-test.md) - The two npm scripts (build and test) in psd-standards-canary, the single node:test unit test, the glob fix that made test discovery work on current Node, and the narrow commands to validate changes.
- [CI workflow callers](ci-workflows.md) - How the three GitHub Actions caller workflows in psd-standards-canary (psd-ci, license-check, openwiki-update) are triggered, what permissions and concurrency they set, and how each delegates to a reusable workflow in PSD401/.github that is not stored in this repository.
