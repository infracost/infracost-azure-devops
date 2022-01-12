# Terraform Cloud/Enterprise

This example shows how to run Infracost in an Azure DevOps pipeline with Terraform Cloud and Terraform Enterprise. It assumes you have set a pipeline secret variable for the Terraform Cloud token (`tfcToken`). This token is used by the Infracost CLI run a speculative plan and fetch the plan JSON from Terraform Cloud to generate the cost estimate comment.


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
      - task: TerraformInstaller@0
        displayName: Install Terraform
        
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)

      - bash: infracost breakdown --path=examples/terraform-cloud-enterprise/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        env:
          # The following env vars are required so that Infracost can work with the Terraform Cloud remote state/execution.
          INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
          # If you are using a Terraform Cloud Enterprise instance configure the below with your host name.  
          INFRACOST_TERRAFORM_CLOUD_HOST: "app.terraform.io"
        
      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)
