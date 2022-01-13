# Multi-Terraform workspace

This example shows how to run Infracost in an Azure DevOps pipeline against a Terraform project that uses multiple workspaces using an [Infracost config file](https://www.infracost.io/docs/multi_project/config_file).

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: multi_terraform_workspace_config_file
    displayName: Multi-Terraform workspace config file
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: |
          infracost breakdown --config-file=examples/multi-terraform-workspace/code/infracost.yml --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        env:
          # IMPORTANT: add any required secrets to setup cloud credentials so Terraform can run
          DEV_AWS_ACCESS_KEY_ID: $(exampleDevAwsAccessKeyId)
          DEV_AWS_SECRET_ACCESS_KEY: $(exampleDevAwsSecretAccessKey)
          PROD_AWS_ACCESS_KEY_ID: $(exampleProdAwsAccessKeyId)
          PROD_AWS_SECRET_ACCESS_KEY: $(exampleProdAwsSecretAccessKey)

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          githubToken: $(githubToken)
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)
