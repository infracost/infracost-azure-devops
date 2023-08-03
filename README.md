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
2. If you haven't done so already, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost auth login` to get a free API key.
3. Retrieve your Infracost API key by running `infracost configure get api_key`.
4. If you are using an Azure Repos repositories follow the [Azure Repos quick start](#azure-repos-quick-start). Currently this only supports Git repositories.
5. If you are using a GitHub repository follow the [GitHub Repos quick start](#github-repos-quick-start)

### Azure Repos Quick start

1. Create a new pipeline, selecting
   1. **Azure Repos Git** when prompted in the **"Connect"** stage
   2. Select the appropriate repo you wish to integrate Infracost with in the **"Select"** stage
   3. Choose "Starter Pipeline" in the **"Configure"** stage
   4. Replace the Starter Pipeline yaml with the following:
    ```yaml
    # You can set up build triggers, as per the Quick Start guide to see comments on all pull
    # requests to a specific branch.
    # If you are seeing the build triggered twice you can try uncommenting the below line:
    # trigger: none

    variables:
      - name: TF_ROOT
        value: PATH/TO/TERRAFORM/CODE # Update this!
      # If you use private modules you'll need this env variable to use
      # the same ssh-agent socket value across all steps.
      - name: SSH_AUTH_SOCK
        value: /tmp/ssh_agent.sock
      # If you're using Terraform Cloud/Enterprise and have variables stored on there
      # you can specify the following to automatically retrieve the variables:
      # - name: INFRACOST_TERRAFORM_CLOUD_TOKEN
      #   value: $(tfcToken)
      # - name: INFRACOST_TERRAFORM_CLOUD_HOST
      #   value: app.terraform.io # Change this if you're using Terraform Enterprise

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
          #     # Update this to github.com, gitlab.com, bitbucket.org, ssh.dev.azure.com or your source control server's domain
          #     ssh-keyscan ssh.dev.azure.com >> ~/.ssh/known_hosts
          #   displayName: Add GIT_SSH_KEY
          #   env:
          #     GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)

          # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
          # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
          - task: InfracostSetup@2
            displayName: Setup Infracost
            inputs:
              apiKey: $(infracostApiKey)

          # Clone the base branch of the pull request (e.g. main/master) into a temp directory.
          - bash: |
              branch=$(System.PullRequest.TargetBranch)
              branch=${branch#refs/heads/}
              # Try adding the following to git clone if you're having issues cloning a private repo: --config http.extraheader="AUTHORIZATION: bearer $(System.AccessToken)"
              git clone $(Build.Repository.Uri) --branch=${branch} --single-branch /tmp/base
            displayName: Checkout base branch

          # Generate an Infracost cost estimate baseline from the comparison branch, so that Infracost can compare the cost difference.
          - bash: |
              infracost breakdown --path=/tmp/base/$(TF_ROOT) \
                                  --format=json \
                                  --out-file=/tmp/infracost-base.json
            displayName: Generate Infracost cost estimate baseline

          # Generate an Infracost diff and save it to a JSON file.
          - bash: |
              infracost diff --path=$(TF_ROOT) \
                             --format=json \
                             --compare-to=/tmp/infracost-base.json \
                             --out-file=/tmp/infracost.json
            displayName: Generate Infracost diff

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

    <img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/azure-pr-comment.png" alt="Example pull request" width="90%" />

6. In [Infracost Cloud](https://dashboard.infracost.io), go to Org Settings and enable the dashboard, then trigger your CI/CD pipeline again. This causes the CLI to send its JSON output to your dashboard; the JSON does not contain any cloud credentials or secrets, see the [FAQ](https://infracost.io/docs/faq/) for more information.

    This is our SaaS product that builds on top of Infracost open source. It enables team leads, managers and FinOps practitioners to setup [tagging policies](https://www.infracost.io/docs/infracost_cloud/tagging_policies/), [guardrails](https://www.infracost.io/docs/infracost_cloud/guardrails/) and [best practices](https://www.infracost.io/docs/infracost_cloud/cost_policies/) to help guide the team. For example, you can check for required tag keys/values, or suggest switching AWS GP2 volumes to GP3 as they are more performant and cheaper.

    <img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/infracost-cloud-dashboard.png" alt="Infracost Cloud gives team leads, managers and FinOps practitioners visibility across all cost estimates in CI/CD" width="58%" /><img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/pull-request-tags.png" alt="Communicate and enforce FinOps tags in pull requests" width="42%" />

If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

### GitHub Repos Quick Start

👉👉 We recommend using the [**free Infracost GitHub App**](https://www.infracost.io/docs/integrations/github_app/) instead as it has many benefits over Azure DevOps integration

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
        # If you're using Terraform Cloud/Enterprise and have variables stored on there
        # you can specify the following to automatically retrieve the variables:
        # env:
        # - name: INFRACOST_TERRAFORM_CLOUD_TOKEN
        #   value: $(tfcToken)
        # - name: INFRACOST_TERRAFORM_CLOUD_HOST
        #   value: app.terraform.io # Change this if you're using Terraform Enterprise
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
           #     # Update this to github.com, gitlab.com, bitbucket.org, ssh.dev.azure.com or your source control server's domain
           #     ssh-keyscan github.com >> ~/.ssh/known_hosts
           #   displayName: Add GIT_SSH_KEY
           #   env:
           #     GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)

            # Install the Infracost CLI, see https://github.com/infracost/infracost-azure-devops#infracostsetup
            # for other inputs such as version, and pricingApiEndpoint (for self-hosted users).
            - task: InfracostSetup@2
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
                infracost breakdown --path=/tmp/base/$(TF_ROOT) \
                                    --format=json \
                                    --out-file=/tmp/infracost-base.json
              displayName: Generate Infracost cost estimate baseline

            # Generate an Infracost diff and save it to a JSON file.
            - bash: |
                infracost diff --path=$(TF_ROOT) \
                               --format=json \
                               --compare-to=/tmp/infracost-base.json \
                               --out-file=/tmp/infracost.json
              displayName: Generate Infracost diff

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

   If there are issues, check the GitHub Actions logs and [this page](https://www.infracost.io/docs/troubleshooting/).

    <img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/pr-comment.png" alt="Example pull request" width="70%" />

5. In [Infracost Cloud](https://dashboard.infracost.io), go to Org Settings and enable the dashboard, then trigger your CI/CD pipeline again. This causes the CLI to send its JSON output to your dashboard; the JSON does not contain any cloud credentials or secrets, see the [FAQ](https://infracost.io/docs/faq/) for more information.

    This is our SaaS product that builds on top of Infracost open source. It enables team leads, managers and FinOps practitioners to setup [tagging policies](https://www.infracost.io/docs/infracost_cloud/tagging_policies/), [guardrails](https://www.infracost.io/docs/infracost_cloud/guardrails/) and [best practices](https://www.infracost.io/docs/infracost_cloud/cost_policies/) to help guide the team. For example, you can check for required tag keys/values, or suggest switching AWS GP2 volumes to GP3 as they are more performant and cheaper.

    <img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/infracost-cloud-dashboard.png" alt="Infracost Cloud gives team leads, managers and FinOps practitioners visibility across all cost estimates in CI/CD" width="58%" /><img src="https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/pull-request-tags.png" alt="Communicate and enforce FinOps tags in pull requests" width="42%" />

If there are issues, you can enable the 'Enable system diagnostics' check box when running the pipeline manually or for more options see [this page](https://docs.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs).

### Troubleshooting

#### 403 error when posting to Azure Repo
If you receive a 403 error when running the `infracost comment` command in your pipeline:
![](https://github.com/infracost/infracost-azure-devops/blob/master/.github/assets/403.png?raw=true)

Try the following steps:
1. This is normally because the build agent does not have permissions to post to the Azure Repo. Make sure step 3 (Enable Azure Pipelines to post pull request comments) of the [Azure Repos Quick start](#azure-repos-quick-start) is complete.
2. If the above step does not fix the issue, change the "Post Infracost comment" task to the following format so instead of using `$(System.AccessToken)` directly, you pass it in via an environment variable:
    ```sh
    - script: |
        infracost comment azure-repos \
          --path=/tmp/infracost.json \
          --azure-access-token=$SYSTEM_ACCESSTOKEN \
          --pull-request=$(System.PullRequest.PullRequestId) \
          --repo-url=$(Build.Repository.Uri) \
          --behavior=update
      displayName: Post Infracost comment
      env:
        SYSTEM_ACCESSTOKEN: $(System.AccessToken)
    ```
3. If you're using the "Limit job authorization scope to current project for non-release pipelines" option in Azure Repos, see [this article](https://www.linkedin.com/pulse/azure-pipelines-infracost-dreaded-403-error-pete-mallam/): this changes the Build Service Identity that will be performing the task. So rather than the usual Build Service for the project, you are now using a Build Service for the Organization.

## Examples

The [examples](https://github.com/infracost/infracost-azure-devops/tree/master/examples) directory demonstrates how these actions can be used for different projects. They all work by using the default Infracost CLI option that parses HCL, thus a Terraform Plan JSON is not needed.
  - [Terraform/Terragrunt projects (single or multi)](https://github.com/infracost/infracost-azure-devops/tree/master/examples/terraform-project): a repository containing one or more (e.g. mono repos) Terraform or Terragrunt projects
  - [Multi-projects using a config file](https://github.com/infracost/infracost-azure-devops/tree/master/examples/multi-project-config-file): repository containing multiple Terraform projects that need different inputs, i.e. variable files or Terraform workspaces
  - [Slack](https://github.com/infracost/infracost-azure-devops/tree/master/examples/slack): send cost estimates to Slack

For advanced use cases where the estimate needs to be generated from Terraform plan JSON files, see the [plan JSON examples here](https://github.com/infracost/infracost-azure-devops/tree/master/examples#plan-json-examples).

## Task

We recommend you use the above quick start guide and examples, which uses the following task.

### InfracostSetup

This task installs and configures the Infracost CLI.

```yml
steps:
  - task: InfracostSetup@v2
    inputs:
      apiKey: $(infracostApiKey)
```

It accepts the following inputs:

- `apiKey`: Required. Your Infracost API key. It can be retrieved by running `infracost configure get api_key`. We recommend using your same API key in all environments. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost auth login` to get a free API key.
- `version`: Optional, defaults to `0.10.x`. [SemVer ranges](https://www.npmjs.com/package/semver#ranges) are supported, so instead of a [full version](https://github.com/infracost/infracost/releases) string, you can use `0.10.x`. This enables you to automatically get the latest backward compatible changes in the 0.10 release (e.g. new resources or bug fixes).
- `currency`: Optional. Convert output from USD to your preferred [ISO 4217 currency](https://en.wikipedia.org/wiki/ISO_4217#Active_codes), e.g. EUR, BRL or INR.
- `pricingApiEndpoint`: Optional. For [self-hosted](https://www.infracost.io/docs/cloud_pricing_api/self_hosted) users, endpoint of the Cloud Pricing API, e.g. https://cloud-pricing-api.

## Contributing

Issues and pull requests are welcome! For development details, see the [contributing](https://github.com/infracost/infracost-azure-devops/blob/master/CONTRIBUTING.md) guide. For major changes, including interface changes, please open an issue first to discuss what you would like to change. [Join our community Slack channel](https://www.infracost.io/community-chat), we are a friendly bunch and happy to help you get started :)

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
