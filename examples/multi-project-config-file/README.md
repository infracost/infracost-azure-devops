# Multi-project using config file

This example shows how to run Infracost in Azure Pipelines with multiple Terraform projects using a config file. The [config file]((https://www.infracost.io/docs/config_file/)) can be used to specify variable files or the Terraform workspaces for different projects.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: multi_project_config_file
    displayName: Multi-project config file
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/multi-project-config-file/code

    steps:
      - task: InfracostSetup@1
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)
          version: v0.10.0-beta.1

      # Checkout the branch you want Infracost to compare costs against. This example is using the
      # target PR branch.
      - bash: |
          branch=$(System.PullRequest.TargetBranch)
          branch=${branch#refs/heads/}
          git clone $(Build.Repository.Uri) --branch=${branch} --single-branch /tmp/base
        displayName: Checkout base branch

      # Generate an Infracost cost estimate baseline from the comparison branch, so that Infracost can compare the cost difference.
      - bash: |
          infracost breakdown --config-file=/tmp/base/$(TF_ROOT)/infracost.yml \
                              --format=json \
                              --out-file=/tmp/infracost-base.json
        displayName: Generate Infracost cost estimate baseline

      - bash: |
          infracost diff --config-file=$(TF_ROOT)/infracost.yml \
                         --format=json \
                         --compare-to=/tmp/infracost-base.json \
                         --out-file=/tmp/infracost.json
        displayName: Generate Infracost diff

      # Posts a comment to the PR using the 'update' behavior.
      # This creates a single comment and updates it. The "quietest" option.
      # The other valid behaviors are:
      #   delete-and-new - Delete previous comments and create a new one.
      #   hide-and-new - Minimize previous comments and create a new one.
      #   new - Create a new cost estimate comment on every push.
      # See https://www.infracost.io/docs/features/cli_commands/#comment-on-pull-requests for other options.
      - bash: |
          infracost comment github --path=/tmp/infracost.json \
                                   --github-token=$(githubToken) \
                                   --pull-request=$(System.PullRequest.PullRequestNumber) \
                                   --repo=$(Build.Repository.Name) \
                                   --behavior=update
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
