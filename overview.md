# Infracost extension for Azure Pipelines

This extension provides tasks to setup and use [Infracost](https://www.infracost.io/) in Azure Pipelines.

# How to use

After installing this extension you can use it in tasks in [your pipeline](https://docs.microsoft.com/en-us/azure/devops/pipelines/).

# Available tasks

- **InfracostSetup**: installs and configures Infracost CLI.
- **InfracostComment**: adds comments to GitHub pull requests and commits, or Azure Repos pull requests.

## InfracostSetup Task

This Azure DevOps Task downloads and installs the Infracost CLI in your Azure Pipelines. Subsequent steps in the same job can run the CLI in the same way it is run on the command line.

### Usage

The task can be used as follows. You probably want to run Infracost CLI commands then use the **InfracostComment** task to post comments! See the [examples](https://github.com/infracost/infracost-azure-devops/examples) section on GitHub for examples of how these tasks can be combined.

```yml
steps:
  - task: InfracostSetup@v0
    inputs:
      apiKey: $(infracostApiKey)
```

### Inputs

The action supports the following inputs:

- `apiKey`: Required. Your Infracost API key. It can be retrieved by running `infracost configure get api_key`. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.

- `version`: Optional, defaults to `0.9.x`. [SemVer ranges](https://www.npmjs.com/package/semver#ranges) are supported, so instead of a [full version](https://github.com/infracost/infracost/releases) string, you can use `0.9.x`. This enables you to automatically get the latest backward compatible changes in the 0.9 release (e.g. new resources or bug fixes).

- `currency`: Optional. Convert output from USD to your preferred [ISO 4217 currency](https://en.wikipedia.org/wiki/ISO_4217#Active_codes), e.g. EUR, BRL or INR.

- `pricingApiEndpoint`: Optional. For [self-hosted](https://www.infracost.io/docs/cloud_pricing_api/self_hosted) users, endpoint of the Cloud Pricing API, e.g. https://cloud-pricing-api.

- `enableDashboard`: Optional, defaults to `false`. Enables [Infracost dashboard features](https://www.infracost.io/docs/features/share_links), not supported for self-hosted Cloud Pricing API.

### Outputs

This task does not set any direct outputs.

## InfracostComment Task

This Azure DevOps task takes `infracost breakdown` JSON output and posts it as a Azure DevOps Repos or GitHub comment. It assumes the `infracost` binary has already been installed using the **InfracostSetup** task. It uses the Azure DevOps access token or GitHub token, to post comments (you can override it with inputs). This task uses the [compost](https://github.com/infracost/compost) CLI tool internally.

### Usage

The action can be used as follows. See the [top-level readme](https://github.com/infracost/infracost-azure-devops) for examples of how this task can be combined with the setup task to run Infracost.

```yml
steps:
  - task: InfracostComment@v0
    inputs:
      githubToken: $(githubToken)
      path: /tmp/infracost.json
      behavior: update
```

### Inputs

The action supports the following inputs:

- `path`: Required. The path to the `infracost breakdown` JSON that will be passed to `infracost output`. For multiple paths, pass a glob pattern (e.g. "infracost_*.json", glob needs quotes) or a JSON array of paths.
- `githubToken`: GitHub access token. Required if repository provider is GitHub.
- `azureReposToken`: Azure Repos access token. Required if repository provider is Azure Repos.
- `behavior`: Optional, defaults to `update`. The behavior to use when posting cost estimate comments. Must be one of the following:
  - `update`: Create a single comment and update it on changes. This is the "quietest" option. The Azure DevOps Repos/GitHub comments UI shows what/when changed when the comment is updated. Pull request followers will only be notified on the comment create (not updates), and the comment will stay at the same location in the comment history.
  - `delete-and-new`: Delete previous cost estimate comments and create a new one. Pull request followers will be notified on each comment.
  - `hide-and-new`: Minimize previous cost estimate comments and create a new one. Pull request followers will be notified on each comment.
  - `new`: Create a new cost estimate comment. Pull request followers will be notified on each comment.
- `targetType`: Optional. Which objects should be commented on, either `pull-request` or `commit`. The `commit` option is available only for GitHub repositories.
- `tag`: Optional. Customize the comment tag. This is added to the comment as a markdown comment (hidden) to detect the previously posted comments. This is useful if you have multiple pipelines that post comments to the same pull request or commit.

### Outputs

This task does not set any direct outputs.

# Source code

The source code of this extension is on [GitHub](https://github.com/infracost/infracost-azure-devops).

# Contributing

Issues and pull requests are welcome. For major changes, please [open an issue](https://github.com/infracost/infracost-azure-devops/issues/new) first to discuss what you would like to change.
