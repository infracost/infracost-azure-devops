# Terraform directory

This example shows how to run Infracost Azure DevOps tasks with a Terraform project containing HCL code.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terraform_directory
    displayName: Terraform Directory
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: infracost breakdown --path=examples/terraform-directory/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options

```
[//]: <> (END EXAMPLE)
