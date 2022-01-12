# Infracost Azure DevOps integration

This project provides an Azure DevOps task for Infracost along with examples of how you can use it to to see cloud cost estimates for Terraform in pull requests 💰

## Quick start

The following steps assume a simple Terraform directory is being used, we recommend you use a more relevant [example](#examples) if required.

1. Retrieve your Infracost API key by running `infracost configure get api_key`. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.

2. In your Azure DevOps project create a new pipeline by going to 'Pipelines' > 'New pipeline', connect to your code repo and select 'Starter pipeline'.

3. Add a pipeline variable called `apiKey` with your Infracost API key as the value, and select 'Keep this value secre'.

4. Create required variables for any cloud credentials that are needed for Terraform to run.

    - **Terraform Cloud/Enterprise users**: the [Terraform docs](https://www.terraform.io/cli/config/config-file#credentials-1) explain how to configure credentials for this using a config file, or you can pass the credentials as environment variables directly to Infracost as in [this example](examples/terraform-cloud-enterprise).
    - **AWS users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables) explain the environment variables to set for this.
    - **Azure users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) explain the options.
    - **Google users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#full-reference) explain the options, e.g. using `GOOGLE_CREDENTIALS`.

5.  Add the following to the `azure-pipelines.yml` file:

    ```yaml
    pr:
      - master

    variables:
      TF_ROOT: PATH/TO/TERRAFORM/CODE

    jobs:
      - job: terraform_plan_json
        displayName: Terraform plan JSON
        pool:
          vmImage: ubuntu-latest

        steps:
          - task: TerraformInstaller@0
            displayName: Install Terraform

          - bash: terraform init
            displayName: Terraform init
            workingDirectory: $(TF_ROOT)

          - bash: terraform plan -out tfplan.binary
            displayName: Terraform plan
            workingDirectory: $(TF_ROOT)

          - bash: terraform show -json tfplan.binary > plan.json
            displayName: Terraform show
            workingDirectory: $(TF_ROOT)

          - task: InfracostSetup@0
            displayName: Setup Infracost
            inputs:
              apiKey: $(apiKey)

          - bash: infracost breakdown --path=$(TF_ROOT)/plan.json --format=json --out-file=/tmp/infracost.json
            displayName: Run Infracost

          - task: InfracostComment@0
            displayName: Post the comment
            inputs:
              path: /tmp/infracost.json
              behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
    ```

6. Click 'Save and run'

7. 🎉 That's it! Send a new pull request to change something in Terraform that costs money. You should see a pull request comment that gets updated, e.g. the 📉 and 📈 emojis will update as changes are pushed!

    If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

## Examples

The [examples](examples) directory demonstrates how these actions can be used in different workflows, including:
  - [Terraform directory](examples/terraform-directory): a Terraform directory containing HCL code
  - [Terraform plan JSON](examples/terraform-plan-json): a Terraform plan JSON file
  - [Terragrunt](examples/terragrunt): a Terragrunt project
  - [Terraform Cloud/Enterprise](examples/terraform-cloud-enterprise): a Terraform project using Terraform Cloud/Enterprise
  - [Multi-project using config file](examples/multi-project/README.md#using-an-infracost-config-file): multiple Terraform projects using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
  - [Multi-project using build matrix](examples/multi-project/README.md#using-azure-devops-pipeline-matrix-strategy): multiple Terraform projects using Azure DevOps Pipeline matrix strategy
  - [Multi-Terraform workspace](examples/multi-terraform-workspace): multiple Terraform workspaces using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
  - [Private Terraform module](examples/private-terraform-module/README.md): a Terraform project using a private Terraform module
  - [Slack](examples/slack): send cost estimates to Slack

Cost policy examples:
- [Thresholds](examples/thresholds): only post a comment when cost thresholds are exceeded
- [Conftest](examples/conftest): check Infracost cost estimates against policies using Conftest
- [OPA](examples/opa): check Infracost cost estimates against policies using Open Policy Agent
- [Sentinel](examples/sentinel): check Infracost cost estimates against policies using Hashicorp's Sentinel

## Comment options

For different commenting options specify the following inputs to the `InfracostComment` task:

- `behavior`: Optional, defaults to `update`. The behavior to use when posting cost estimate comments. Must be one of the following:
  - `update`: Create a single comment and update it on changes. This is the "quietest" option. pull request followers will only be notified on the comment create (not updates), and the comment will stay at the same location in the comment history.
  - `delete-and-new`: Delete previous cost estimate comments and create a new one. pull request followers will be notified on each comment.
  - `new`: Create a new cost estimate comment. pull request followers will be notified on each comment.

- `targetType`: Optional. Which objects should be commented on, either `pull-request` or `commit`.

- `tag`:  Optional. Customize the comment tag. This is added to the comment as a markdown comment (hidden) to detect the previously posted comments. This is useful if you have multiple workflows that post comments to the same pull request or commit.

## Contributing

Issues and pull requests are welcome! For development details, see the [contributing](CONTRIBUTING.md) guide. For major changes, including interface changes, please open an issue first to discuss what you would like to change. [Join our community Slack channel](https://www.infracost.io/community-chat), we are a friendly bunch and happy to help you get started :)

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
