# Terraform Cloud/Enterprise

This example shows how to run Infracost in Azure Pipelines with Terraform Cloud and Terraform Enterprise. It assumes you have set a pipeline secret variable for the Terraform Cloud token (`tfcToken`). This token is used by the Infracost CLI to run a speculative plan and fetch the plan JSON from Terraform Cloud to generate the cost estimate comment.


[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terraform_cloud_enterprise
    displayName: Terraform Cloud/Enterprise
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: infracost breakdown --path=examples/terraform-cloud-enterprise/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        env:
          # The following env vars are required so that Infracost can work with the Terraform Cloud remote state/execution.
          INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
          # If you are using a Terraform Cloud Enterprise instance configure the below with your host name.
          INFRACOST_TERRAFORM_CLOUD_HOST: "app.terraform.io"

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
