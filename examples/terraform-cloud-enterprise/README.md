# Terraform Cloud/Enterprise

This example shows how to run Infracost actions with Terraform Cloud and Terraform Enterprise. It assumes you have set a GitHub repo secret for the Terraform Cloud token (`TFC_TOKEN`). This token is used by the Infracost CLI run a speculative plan and fetch the plan JSON from Terraform Cloud to generate the cost estimate comment.

In the future, we'll add an example of how you can trigger the Infracost actions from Terraform Cloud's GitHub status checks.

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
          apiKey: $(API_KEY)

      - bash: infracost breakdown --path=examples/terraform-cloud-enterprise/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        env:
          # the following env vars are required so that Infracost can work with the Terraform Cloud remote state/execution.
          INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
          # if you are using a terraform cloud enterprise instance configure the below with your host name.  
          INFRACOST_TERRAFORM_CLOUD_HOST: "app.terraform.io"
        
      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)
