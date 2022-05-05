# Infracost Azure Pipelines integration

This project provides Azure Pipeline tasks for Infracost along with examples of how you can use it to see cloud cost estimates for Terraform in pull requests 💰

<img src="https://github.com/infracost/infracost-azure-devops/blob/master/screenshot.png?raw=true" width="700px" alt="Example screenshot" />

Follow our [migration guide](https://www.infracost.io/docs/guides/azure_devops_migration/) if you used our old version of this repo.

## Table of contents

* [Quick start](#quick-start)
  + [Azure Repos Quick start](#azure-repos-quick-start)
  + [GitHub Repos Quick Start](#github-repos-quick-start)
  * [Troubleshooting](#troubleshooting)
    + [403 error when posting to Azure Repo](#403-error-when-posting-to-azure-repo)
    + [InfracostComment cannot detect current environment](#infracostcomment-cannot-detect-current-environment)
* [Examples](#examples)
  + [Cost policy examples](#cost-policy-examples)
* [Tasks](#tasks)
  + [InfracostSetup](#infracostsetup)
  + [InfracostComment (deprecated)](#infracostcomment)
* [Contributing](#contributing)
* [License](#license)

## Quick start

The Azure Pipelines Infracost tasks can be used with either Azure Repos (only git is supported) or GitHub repos. The following steps assume a simple Terraform directory is being used, we recommend you use a more relevant [example](#examples) if required.

1. In the Azure DevOps Marketplace, Add the [Terraform installer task](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks) to your organization by clicking 'Get it free', selecting your organization and clicking Install. If you do not have permission to install the task, you can submit a request to your organization's admin who will get emailed the details of the request.
2. Repeat step 1 for the [Infracost tasks](https://marketplace.visualstudio.com/items?itemName=Infracost.infracost-tasks).
3. Retrieve your Infracost API key by running `infracost configure get api_key`. We recommend using your same API key in all environments. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.
4. If you are using an Azure Repos repositories follow the [Azure Repos quick start](#azure-repos-quick-start). Currently this only supports Git repositories.
5. If you are using a GitHub repository follow the [GitHub Repos quick start](#github-repos-quick-start)

### Azure Repos Quick start

1. Create a new pipeline, selecting 
   1. **Azure Repos Git** when prompted in the **"Connect"** stage
   2. Select the appropriate repo you wish to integrate Infracost with in the **"Select"** stage
   3. Choose "Starter Pipeline" in the **"Configure"** stage
   4. Replace the Starter Pipeline yaml with the following:
    ```yaml
    # The Azure Pipelines docs (https://docs.microsoft.com/en-us/azure/devops/pipelines/process/tasks) describe other options.
    # Running on pull requests to `master` (or your default branch) is a good default.
    pr:
      - master

    variables:
      - name: TF_ROOT
        value: PATH/TO/TERRAFORM/CODE # Update this!

    jobs:
      - job: infracost
        displayName: Run Infracost
        pool:
          vmImage: ubuntu-latest

        steps:
            # Typically the Infracost actions will be used in conjunction with the Terraform tool installer task.
            # If this task is not available you can add it to your org from https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks.
            # Subsequent steps can run Terraform commands as bash tasks. Alternatively, the Terraform tasks
            # can be used, but we recommend bash tasks since they are simpler.
          - task: TerraformInstaller@0
            displayName: Install Terraform

          # IMPORTANT: add any required steps here to setup cloud credentials so Terraform can run

          - bash: terraform init
            displayName: Terraform init
            workingDirectory: $(TF_ROOT)

          - bash: terraform plan -out tfplan.binary
            displayName: Terraform plan
            workingDirectory: $(TF_ROOT)

          - bash: terraform show -json tfplan.binary > plan.json
            displayName: Terraform show
            workingDirectory: $(TF_ROOT)

          # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
          # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
          - task: InfracostSetup@0
            displayName: Setup Infracost
            inputs:
              apiKey: $(infracostApiKey)

          # Run Infracost and generate the JSON output, the following docs might be useful:
          # Multi-project/workspaces: https://www.infracost.io/docs/features/config_file
          # Combine Infracost JSON files: https://www.infracost.io/docs/features/cli_commands/#combined-output-formats
          # Environment variables: https://www.infracost.io/docs/integrations/environment_variables/
          - bash: infracost breakdown --path=$(TF_ROOT)/plan.json --format=json --out-file=/tmp/infracost.json
            displayName: Run Infracost

          # Add a cost estimate comment to a Azure Repos pull request.
          - bash: |
              infracost comment azure-repos \
                 --path /tmp/infracost.json \
                 --azure-access-token $(System.AccessToken) \
                 --pull-request $(System.PullRequest.PullRequestId) \
                 --repo-url $(Build.Repository.Uri) \
                 --behavior update
            displayName: Post Infracost comment
    ```
   5. select "Save" from the "Save and run" dropdown and add the appropriate commit message
2. Enable pull request build triggers. **Without this, Azure Pipelines do not trigger builds with the pull request ID**, thus comments cannot be posted by the integration.
    1. From your Azure DevOps organization, click on **your project** > Project Settings > Repositories
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/repository-settings.png?raw=true)
    2. Select the repository that your created the pipeline for in step 1
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/filter-repositories.png?raw=true)
    3. Select the Policies tab and under the Branch Policies select on your default branch (master or main)
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/branch-policy.png?raw=true)
    4. Scroll to Build Validation and click + sign to add one if you don't have one already
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/build-validation.png?raw=true)
    5. Set your 'Build pipeline' to the pipeline you created in step 1, leave 'Path filter' blank, set 'Trigger' to Automatic, and 'Policy requirement' to Optional (you can also use Required but we don't recommend it).
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/build-policy.png?raw=true)
3. Enable Azure Pipelines to post pull request comments
    1. From your Azure DevOps organization, click on your project > Project Settings > Repositories > your repository.
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/filter-repositories.png?raw=true)
    2. Click on the Securities tab, scroll down to Users and click on the '[project name] Build Service ([org name])' user, and set the 'Contribute to pull requests' to Allow.
   ![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/contribute-to-prs.png?raw=true)

4. Add secret variables: from your Azure DevOps organization, click on your project > Pipelines > your pipeline > Edit > Variables, and click the + sign to add variables for the following. Also tick the 'Keep this value secret' option.

    - `infracostApiKey`: with your Infracost API key as the value, and select 'Keep this value secret'.
    - Any cloud provider credentials you need for running `terraform init` and `terraform plan`:
      - **Terraform Cloud/Enterprise users**: the [Terraform docs](https://www.terraform.io/cli/config/config-file#credentials-1) explain how to configure credentials for this using a config file, or you can pass the credentials as environment variables directly to Infracost as in [this example](examples/terraform-cloud-enterprise).
      - **AWS users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables) explain the environment variables to set for this.
      - **Azure users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) explain the options.
      - **Google users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#full-reference) explain the options, e.g. using `GOOGLE_CREDENTIALS`.

5. 🎉 That's it! Send a new pull request to change something in Terraform that costs money. You should see a pull request comment that gets updated, e.g. the 📉 and 📈 emojis will update as changes are pushed!
6. Follow [the docs](https://www.infracost.io/usage-file) if you'd also like to show cost for of usage-based resources such as AWS Lambda or S3. The usage for these resources are fetched from CloudWatch/cloud APIs and used to calculate an estimate.

If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

### GitHub Repos Quick Start

1. Create a new pipeline, selecting
   1. **Github** when prompted in the **"Connect"** stage
   2. Select the appropriate repo you wish to integrate Infracost with in the **"Select"** stage
   3. Choose "Starter Pipeline" in the **"Configure"** stage
   4. Replace the Starter Pipeline yaml with the following:
      ```yaml
      # The Azure Pipelines docs (https://docs.microsoft.com/en-us/azure/devops/pipelines/process/tasks) describe other options.
      # Running on pull requests to `master` (or your default branch) is a good default.
      pr:
        - master

      variables:
        - name: TF_ROOT
          value: PATH/TO/TERRAFORM/CODE # Update this!

      jobs:
        - job: infracost
          displayName: Run Infracost
          pool:
            vmImage: ubuntu-latest

          steps:
              # Typically the Infracost actions will be used in conjunction with the Terraform tool installer task
              # If this task is not available you can add it to your org from https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks.
              # Subsequent steps can run Terraform commands as they would in the shell.
            - task: TerraformInstaller@0
              displayName: Install Terraform

            # IMPORTANT: add any required steps here to setup cloud credentials so Terraform can run

            - bash: terraform init
              displayName: Terraform init
              workingDirectory: $(TF_ROOT)

            - bash: terraform plan -out tfplan.binary
              displayName: Terraform plan
              workingDirectory: $(TF_ROOT)

            - bash: terraform show -json tfplan.binary > plan.json
              displayName: Terraform show
              workingDirectory: $(TF_ROOT)

            # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
            # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
            - task: InfracostSetup@0
              displayName: Setup Infracost
              inputs:
                apiKey: $(infracostApiKey)

            # Run Infracost and generate the JSON output, the following docs might be useful:
            # Multi-project/workspaces: https://www.infracost.io/docs/features/config_file
            # Combine Infracost JSON files: https://www.infracost.io/docs/features/cli_commands/#combined-output-formats
            # Environment variables: https://www.infracost.io/docs/integrations/environment_variables/
            - bash: infracost breakdown --path=$(TF_ROOT)/plan.json --format=json --out-file=/tmp/infracost.json
              displayName: Run Infracost

          # Add a cost estimate comment to a GitHub pull request.
          - bash: |
              infracost comment github \
                 --path /tmp/infracost.json \
                 --github-token $(githubToken) \
                 --pull-request $(System.PullRequest.PullRequestNumber) \
                 --repo $(Build.Repository.Name) \
                 --behavior update
            displayName: Post Infracost comment
      ```
   5. select "Save" from the "Save and run" dropdown and add the appropriate commit message
2. Create a GitHub token (such as [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)) that can be used by the pipeline to post comments. The token needs to have `repo` scope so it can post comments. If you are using SAML single sign-on, you must first [authorize the token](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).
3. Add secret variables to the pipeline you created in step 1. From your Azure DevOps organization, click on your project > Pipelines > your pipeline > Edit > Variables, and click the + sign to add variables for the following:

    - `infracostApiKey`: with your Infracost API key as the value, and select 'Keep this value secret'.
    - `githubToken` with your GitHub access token as the value, and select 'Keep this value secret'.
    - Any cloud provider credentials you need for running `terraform init` and `terraform plan`:
      - **Terraform Cloud/Enterprise users**: the [Terraform docs](https://www.terraform.io/cli/config/config-file#credentials-1) explain how to configure credentials for this using a config file, or you can pass the credentials as environment variables directly to Infracost as in [this example](examples/terraform-cloud-enterprise).
      - **AWS users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables) explain the environment variables to set for this.
      - **Azure users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) explain the options.
      - **Google users**: the [Terraform docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#full-reference) explain the options, e.g. using `GOOGLE_CREDENTIALS`.
4. 🎉 That's it! Send a new pull request to change something in Terraform that costs money. You should see a pull request comment that gets updated, e.g. the 📉 and 📈 emojis will update as changes are pushed!
5. Follow [the docs](https://www.infracost.io/usage-file) if you'd also like to show cost for of usage-based resources such as AWS Lambda or S3. The usage for these resources are fetched from CloudWatch/cloud APIs and used to calculate an estimate.

If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

### Troubleshooting

> **InfracostComment TASK IS DEPRECATED**
>
> The task will soon be removed, please use `infracost comment` directly.

#### 403 error when posting to Azure Repo
If you receive a 403 error when running the `InfracostComment` task in your pipeline:
![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/403.png?raw=true)
This is normally because the build agent does not have permissions to post to the Azure Repo. Make sure step 3 (Enable Azure Pipelines to post pull request comments) of the [Azure Repos Quick start](#azure-repos-quick-start) is complete. 

#### InfracostComment cannot detect current environment
![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/unable-to-detect.png?raw=true)
If using `InfracostComment` with Azure Repos we require that this task is triggered by a pull request. Make sure you've completed step 2 (Enable pull request build triggers) of the [Azure Repos Quick start](#azure-repos-quick-start).
Then make sure your pipelines are being triggered by pull request events and nothing else.

## Examples

The [examples](https://github.com/infracost/infracost-azure-devops/tree/master/examples) directory demonstrates how these actions can be used in different workflows, including:
  - [Terraform directory](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terraform-directory): a Terraform directory containing HCL code
  - [Terraform plan JSON](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terraform-plan-json): a Terraform plan JSON file
  - [Terragrunt](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terragrunt): a Terragrunt project
  - [Terraform Cloud/Enterprise](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terraform-cloud-enterprise): a Terraform project using Terraform Cloud/Enterprise
  - [Multi-project using config file](https://github.com/infracost/infracost-azure-devops/blob/master/examples/multi-project/README.md#using-an-infracost-config-file): multiple Terraform projects using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
  - [Multi-project using build matrix](https://github.com/infracost/infracost-azure-devops/blob/master/examples/multi-project/README.md#using-azure-pipelines-matrix-strategy): multiple Terraform projects using the Azure pipelines matrix strategy
  - [Multi-Terraform workspace](https://github.com/infracost/infracost-azure-devops/tree/master/examples/multi-terraform-workspace): multiple Terraform workspaces using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
  - [Private Terraform module](https://github.com/infracost/infracost-azure-devops/tree/master/examples/private-terraform-module): a Terraform project using a private Terraform module
  - [Slack](https://github.com/infracost/infracost-azure-devops/tree/master/examples/slack): send cost estimates to Slack

### Cost policies

Infracost policies enable centralized teams, who are often helping others with cloud costs, to provide advice before resources are launched, setup guardrails, and prevent human error. Follow [our docs](https://www.infracost.io/docs/features/cost_policies/) to use Infracost's native support for Open Policy Agent (OPA) policies. This enables you to see passing/failing policies in Infracost pull request comments (shown below) without having to install anything else.

![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/policy-passing-github.png)

If you use HashiCorp Sentinel, follow [our example](https://github.com/infracost/infracost-azure-devops/tree/master/examples/sentinel) to output the policy pass/fail results into CI/CD logs.

## Tasks

We recommend you use the above quick start guide and examples, which combine the following individual actions.

### InfracostSetup

This task installs and configures the Infracost CLI.

```yml
steps:
  - task: InfracostSetup@v0
    inputs:
      apiKey: $(infracostApiKey)
```

It accepts the following inputs:

- `apiKey`: Required. Your Infracost API key. It can be retrieved by running `infracost configure get api_key`. We recommend using your same API key in all environments. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.
- `version`: Optional, defaults to `0.9.x`. [SemVer ranges](https://www.npmjs.com/package/semver#ranges) are supported, so instead of a [full version](https://github.com/infracost/infracost/releases) string, you can use `0.9.x`. This enables you to automatically get the latest backward compatible changes in the 0.9 release (e.g. new resources or bug fixes).
- `currency`: Optional. Convert output from USD to your preferred [ISO 4217 currency](https://en.wikipedia.org/wiki/ISO_4217#Active_codes), e.g. EUR, BRL or INR.
- `pricingApiEndpoint`: Optional. For [self-hosted](https://www.infracost.io/docs/cloud_pricing_api/self_hosted) users, endpoint of the Cloud Pricing API, e.g. https://cloud-pricing-api.
- `enableDashboard`: Optional, defaults to `false`. Enables [Infracost dashboard features](https://www.infracost.io/docs/features/share_links), not supported for self-hosted Cloud Pricing API.

### InfracostComment

> **THIS TASK IS DEPRECATED**
>
> This task will soon be removed, please use `infracost comment` directly.

This task adds comments to GitHub pull requests and commits, or Azure Repos pull requests.

```yml
steps:
  - task: InfracostComment@v0
    inputs:
      githubToken: $(githubToken)
      path: /tmp/infracost.json
      behavior: update
```

It accepts the following inputs:

- `path`: Required. The path to the `infracost breakdown` JSON that will be passed to `infracost output`. For multiple paths, pass a glob pattern (e.g. "infracost_*.json", glob needs quotes) or a JSON array of paths.
- `githubToken`: GitHub access token. Required if repository provider is GitHub.
- `azureReposToken`: Azure Repos access token. Required if repository provider is Azure Repos.
- `behavior`: Optional, defaults to `update`. The behavior to use when posting cost estimate comments. Must be one of the following:
  - `update`: Create a single comment and update it on changes. This is the "quietest" option. The Azure DevOps Repos/GitHub comments UI shows what/when changed when the comment is updated. Pull request followers will only be notified on the comment create (not updates), and the comment will stay at the same location in the comment history.
  - `delete-and-new`: Delete previous cost estimate comments and create a new one. Pull request followers will be notified on each comment.
  - `hide-and-new`: Minimize previous cost estimate comments and create a new one. Pull request followers will be notified on each comment. This behavior is available only for GitHub repositories.
  - `new`: Create a new cost estimate comment. Pull request followers will be notified on each comment.
- `targetType`: Optional. Which objects should be commented on, either `pull-request` or `commit`. The `commit` option is available only for GitHub repositories.
- `tag`: Optional. Customize the comment tag. This is added to the comment as a markdown comment (hidden) to detect the previously posted comments. This is useful if you have multiple pipelines that post comments to the same pull request or commit.

## Contributing

Issues and pull requests are welcome! For development details, see the [contributing](https://github.com/infracost/infracost-azure-devops/blob/master/CONTRIBUTING.md) guide. For major changes, including interface changes, please open an issue first to discuss what you would like to change. [Join our community Slack channel](https://www.infracost.io/community-chat), we are a friendly bunch and happy to help you get started :)

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
