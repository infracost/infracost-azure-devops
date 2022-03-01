# Terragrunt

This example shows how to run Infracost Azure Pipeline tasks with Terragrunt.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terragrunt
    displayName: Terragrunt
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      - bash: |
          INSTALL_LOCATION="$(Build.SourcesDirectory)/bin"
          mkdir -p ${INSTALL_LOCATION}

          curl -sL "https://github.com/gruntwork-io/terragrunt/releases/latest/download/terragrunt_linux_amd64" > ${INSTALL_LOCATION}/terragrunt
          chmod +x ${INSTALL_LOCATION}/terragrunt

          echo "##vso[task.setvariable variable=PATH;]$(PATH):${INSTALL_LOCATION}"

        displayName: Setup Terragrunt

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: infracost breakdown --path=examples/terragrunt/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost

      - bash: |
          # Create a single comment and update it. See https://www.infracost.io/docs/features/cli_commands/#comment-on-pull-requests for other options
          infracost comment github \
            --path /tmp/infracost.json \
            --github-token $(githubToken) \
            --pull-request $(System.PullRequest.PullRequestNumber) \
            --repo $(Build.Repository.Name) \
            --behavior update
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
