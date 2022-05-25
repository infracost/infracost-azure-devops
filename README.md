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
* [Examples](#examples)
  + [Cost policy examples](#cost-policy-examples)
* [Tasks](#tasks)
  + [InfracostSetup](#infracostsetup)
* [Contributing](#contributing)
* [License](#license)

## Quick start

The Azure Pipelines Infracost tasks can be used with either Azure Repos (only git is supported) or GitHub repos. The following steps assume a simple Terraform directory is being used, we recommend you use a more relevant [example](#examples) if required.

1. In the Azure DevOps Marketplace, Add the  [Infracost tasks](https://marketplace.visualstudio.com/items?itemName=Infracost.infracost-tasks) to your organization by clicking 'Get it free', selecting your organization and clicking Install. If you do not have permission to install the task, you can submit a request to your organization's admin who will get emailed the details of the request.
2. Retrieve your Infracost API key by running `infracost configure get api_key`. We recommend using your same API key in all environments. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.
3. If you are using an Azure Repos repositories follow the [Azure Repos quick start](#azure-repos-quick-start). Currently this only supports Git repositories.
4. If you are using a GitHub repository follow the [GitHub Repos quick start](#github-repos-quick-start)

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
      # If you use private modules you'll need this env variable to use 
      # the same ssh-agent socket value across all steps. 
      - name: SSH_AUTH_SOCK
        value: /tmp/ssh_agent.sock

    jobs:
      - job: infracost
        displayName: Run Infracost
        pool:
          vmImage: ubuntu-latest

        steps:
          # If you use private modules, add a base 64 encoded secret
          # called gitSshKeyBase64 with your private key, so Infracost can access
          # private repositories (similar to how Terraform/Terragrunt does).
          # - bash: |
          #     ssh-agent -a $(SSH_AUTH_SOCK)
          #     mkdir -p ~/.ssh
          #     echo "$(echo $GIT_SSH_KEY_BASE_64 | base64 -d)" | tr -d '\r' | ssh-add -
          #     ssh-keyscan github.com >> ~/.ssh/known_hosts
          #   displayName: Add GIT_SSH_KEY
          #   env:
          #     GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)
   
          # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
          # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
          - task: InfracostSetup@1
            displayName: Setup Infracost
            inputs:
              apiKey: $(infracostApiKey)

          # Clone the base branch of the pull request (e.g. main/master) into a temp directory.
          - bash: |
              branch=$(System.PullRequest.TargetBranch)
              branch=${branch#refs/heads/}
              git clone $(Build.Repository.Uri) --branch=${branch} --single-branch /tmp/base
            displayName: Checkout base branch

          # Generate an Infracost cost estimate baseline from the comparison branch, so that Infracost can compare the cost difference.
          - bash: |
              infracost breakdown --path=$(TF_ROOT) \
                                  --format=json \
                                  --out-file=/tmp/infracost-base.json
            displayName: Generate Infracost cost estimate baseline
            # If you're using Terraform Cloud/Enterprise and have variables stored on there
            # you can specify the following to automatically retrieve the variables:
            # env:
            #   INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
            #   INFRACOST_TERRAFORM_CLOUD_HOST: app.terraform.io # Change this if you're using Terraform Enterprise

          # Generate an Infracost diff and save it to a JSON file.
          - bash: |
              infracost diff --path=$(TF_ROOT) \
                             --format=json \
                             --compare-to=/tmp/infracost-base.json \
                             --out-file=/tmp/infracost.json
            displayName: Generate Infracost diff
            # If you're using Terraform Cloud/Enterprise and have variables stored on there
            # you can specify the following to automatically retrieve the variables:
            # env:
            #   INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
            #   INFRACOST_TERRAFORM_CLOUD_HOST: app.terraform.io # Change this if you're using Terraform Enterprise

          # Posts a comment to the PR using the 'update' behavior.
          # This creates a single comment and updates it. The "quietest" option.
          # The other valid behaviors are:
          #   delete-and-new - Delete previous comments and create a new one.
          #   new - Create a new cost estimate comment on every push.
          # See https://www.infracost.io/docs/features/cli_commands/#comment-on-pull-requests for other options.
          - bash: |
              infracost comment azure-repos --path=/tmp/infracost.json \
                                            --azure-access-token=$(System.AccessToken) \
                                            --pull-request=$(System.PullRequest.PullRequestId) \
                                            --repo-url=$(Build.Repository.Uri) \
                                            --behavior=update
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
        # If you use private modules you'll need this env variable to use 
        # the same ssh-agent socket value across all steps. 
        - name: SSH_AUTH_SOCK
          value: /tmp/ssh_agent.sock

      jobs:
        - job: infracost
          displayName: Run Infracost
          pool:
            vmImage: ubuntu-latest

          steps:
           # If you use private modules, add a base 64 encoded secret
           # called gitSshKeyBase64 with your private key, so Infracost can access
           # private repositories (similar to how Terraform/Terragrunt does).
           # - bash: |
           #     ssh-agent -a $(SSH_AUTH_SOCK)
           #     mkdir -p ~/.ssh
           #     echo "$(echo $GIT_SSH_KEY_BASE_64 | base64 -d)" | tr -d '\r' | ssh-add -
           #     ssh-keyscan github.com >> ~/.ssh/known_hosts
           #   displayName: Add GIT_SSH_KEY
           #   env:
           #     GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)
      
            # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
            # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
            - task: InfracostSetup@1
              displayName: Setup Infracost
              inputs:
                apiKey: $(infracostApiKey)

            # Clone the base branch of the pull request (e.g. main/master) into a temp directory.
            - bash: |
                branch=$(System.PullRequest.TargetBranch)
                branch=${branch#refs/heads/}
                git clone $(Build.Repository.Uri) --branch=${branch} --single-branch /tmp/base
              displayName: Checkout base branch


            # Generate an Infracost cost estimate baseline from the comparison branch, so that Infracost can compare the cost difference.
            - bash: |
                infracost breakdown --path=$(TF_ROOT) \
                                    --format=json \
                                    --out-file=/tmp/infracost-base.json
              displayName: Generate Infracost cost estimate baseline
            # If you're using Terraform Cloud/Enterprise and have variables stored on there
            # you can specify the following to automatically retrieve the variables:
            # env:
            #   INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
            #   INFRACOST_TERRAFORM_CLOUD_HOST: app.terraform.io # Change this if you're using Terraform Enterprise

            # Generate an Infracost diff and save it to a JSON file.
            - bash: |
                infracost diff --path=$(TF_ROOT) \
                               --format=json \
                               --compare-to=/tmp/infracost-base.json \
                               --out-file=/tmp/infracost.json
              displayName: Generate Infracost diff
            # If you're using Terraform Cloud/Enterprise and have variables stored on there
            # you can specify the following to automatically retrieve the variables:
            # env:
            #   INFRACOST_TERRAFORM_CLOUD_TOKEN: $(tfcToken)
            #   INFRACOST_TERRAFORM_CLOUD_HOST: app.terraform.io # Change this if you're using Terraform Enterprise

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
            displayName: Post Infracost comment
      ```
   5. select "Save" from the "Save and run" dropdown and add the appropriate commit message
2. Create a GitHub token (such as [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)) that can be used by the pipeline to post comments. The token needs to have `repo` scope so it can post comments. If you are using SAML single sign-on, you must first [authorize the token](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).
3. Add secret variables to the pipeline you created in step 1. From your Azure DevOps organization, click on your project > Pipelines > your pipeline > Edit > Variables, and click the + sign to add variables for the following:

    - `infracostApiKey`: with your Infracost API key as the value, and select 'Keep this value secret'.
    - `githubToken` with your GitHub access token as the value, and select 'Keep this value secret'.
4. 🎉 That's it! Send a new pull request to change something in Terraform that costs money. You should see a pull request comment that gets updated, e.g. the 📉 and 📈 emojis will update as changes are pushed!
5. Follow [the docs](https://www.infracost.io/usage-file) if you'd also like to show cost for of usage-based resources such as AWS Lambda or S3. The usage for these resources are fetched from CloudWatch/cloud APIs and used to calculate an estimate.

If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

### Troubleshooting

#### 403 error when posting to Azure Repo
If you receive a 403 error when running the `infracost comment` command in your pipeline:
![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/403.png?raw=true)
This is normally because the build agent does not have permissions to post to the Azure Repo. Make sure step 3 (Enable Azure Pipelines to post pull request comments) of the [Azure Repos Quick start](#azure-repos-quick-start) is complete.

## Examples

The [examples](https://github.com/infracost/infracost-azure-devops/tree/master/examples) directory demonstrates how these actions can be used for different projects. They all work by using the default Infracost CLI option that parses HCL, thus a Terraform Plan JSON is not needed.
  - [Terraform/Terragrunt projects (single or multi)](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terraform-project): a repository containing one or more (e.g. mono repos) Terraform or Terragrunt projects
  - [Multi-projects using a config file](https://github.com/infracost/infracost-azure-devops/tree/master/examples/multi-project-config-file): repository containing multiple Terraform projects that need different inputs, i.e. variable files or Terraform workspaces
  - [Slack](https://github.com/infracost/infracost-azure-devops/tree/master/examples/slack): send cost estimates to Slack

For advanced use cases where the estimate needs to be generated from Terraform plan JSON files, see the [plan JSON examples here](https://github.com/infracost/infracost-azure-devops/tree/master/examples#plan-json-examples).

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

## Contributing

Issues and pull requests are welcome! For development details, see the [contributing](https://github.com/infracost/infracost-azure-devops/blob/master/CONTRIBUTING.md) guide. For major changes, including interface changes, please open an issue first to discuss what you would like to change. [Join our community Slack channel](https://www.infracost.io/community-chat), we are a friendly bunch and happy to help you get started :)

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
