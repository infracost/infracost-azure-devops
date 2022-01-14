# Terragrunt

This example shows how to run Infracost Azure DevOps tasks with Terragrunt.

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

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          githubToken: $(githubToken)
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/actions/tree/master/overview.md#infracostcomment-task for other options
```
[//]: <> (END EXAMPLE)
