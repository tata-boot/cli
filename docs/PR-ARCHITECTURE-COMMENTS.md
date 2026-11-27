# PR architecture comments

`.github/workflows/pr-architecture-comments.yml` runs `fsd check` (and
`fsd doctor`) on a pull request and posts the result as a sticky comment,
so reviewers see the architecture state without leaving the PR. The comment
is updated in place on every push — one comment per PR, marked with
`<!-- fsd-architecture-check -->`.

## In this repository

On PRs to `FSD-CLI/cli` the workflow checks a minimal fixture project
(`fsd.config.json` + the six FSD layer directories) using the CLI code from
the PR itself (`node bin/index.mjs`, after `npm ci`). That dogfoods both
the check command and the commenting logic: if either breaks, the PR that
broke it gets a failing comment.

## Reusing it in another FSD project

Call the workflow from the project's own workflow file:

```yaml
name: Architecture check

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  architecture:
    uses: FSD-CLI/cli/.github/workflows/pr-architecture-comments.yml@main
    permissions:
      contents: read
      pull-requests: write
```

Inputs:

| Input | Default | Meaning |
|---|---|---|
| `working-directory` | `.` | Directory of the FSD project to check. |
| `node-version` | `22.12.0` | Node.js version to run the check with. |
| `run-doctor` | `true` | Also run `fsd doctor` (toolchain + project metrics). |
| `cli-command` | `npx create-fsd-architecture@latest` | Command that runs the CLI. Pin a version (e.g. `npx create-fsd-architecture@2.8.0`) for stable results. |

Requirements in the calling repository:

- The project must have an `fsd.config.json` (created by the CLI) at
  `working-directory`, so `fsd check` has something to inspect.
- The calling workflow must grant `pull-requests: write`, otherwise the
  comment step fails; the check step itself only needs `contents: read`.
- The workflow skips draft PRs and comments again once they are marked
  ready for review.
