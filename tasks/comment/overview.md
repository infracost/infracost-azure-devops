# Infracost Comment Task

This Azure DevOps task takes `infracost breakdown` JSON output and posts it as a Azure DevOps Repos or GitHub comment. It assumes the `infracost` binary has already been installed using the [InfracostSetup](TBD link) task. It uses the Azure DevOps access token or GitHub token, to post comments (you can override it with inputs). This task uses the [compost](https://github.com/infracost/compost) CLI tool internally.

## Usage

The action can be used as follows. See the [top-level readme](https://github.com/infracost/infracost-azure-devops) for examples of how this task can be combined with the setup task to run Infracost.

```yml
steps:
  - task: InfracostComment@v0
    inputs:
      path: /tmp/infracost.json
```

## Inputs

The action supports the following inputs:

- `path`: Required. The path to the `infracost breakdown` JSON that will be passed to `infracost output`. For multiple paths, pass a glob pattern (e.g. "infracost_*.json", glob needs quotes) or a JSON array of paths.
- `behavior`: Optional, defaults to `update`. The behavior to use when posting cost estimate comments. Must be one of the following:
  - `update`: Create a single comment and update it on changes. This is the "quietest" option. The Azure DevOps Repos/GitHub comments UI shows what/when changed when the comment is updated. Pull request followers will only be notified on the comment create (not updates), and the comment will stay at the same location in the comment history.
  - `delete-and-new`: Delete previous cost estimate comments and create a new one. Pull request followers will be notified on each comment.
  - `hide-and-new`: Minimize previous cost estimate comments and create a new one. Pull request followers will be notified on each comment.
  - `new`: Create a new cost estimate comment. Pull request followers will be notified on each comment.
- `targetType`: Optional. Which objects should be commented on, either `pull-request` or `commit`. The `commit` option is available only for GitHub repositories.
- `tag`: Optional. Customize the comment tag. This is added to the comment as a markdown comment (hidden) to detect the previously posted comments. This is useful if you have multiple pipelines that post comments to the same pull request or commit.

## Outputs

This task does not set any direct outputs.
