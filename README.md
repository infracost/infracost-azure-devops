# Infracost Azure DevOps integration

This Azure DevOps Pipeline YAML template runs [Infracost](https://infracost.io) against pull requests and automatically adds a pull request comment showing the cost estimate difference for the planned state. It works with Azure DevOps Pipelines with Azure Repos (git) and GitHub repos. A demo of the Azure DevOps Repos integration is [here](https://dev.azure.com/infracost/base/_git/azure-devops-repo-demo), and GitHub repos is [here](https://github.com/infracost/azure-devops-github-demo).

The template uses the latest version of Infracost by default as we regularly add support for more cloud resources. If you run into any issues, please join our [community Slack channel](https://www.infracost.io/community-chat); we'd be happy to guide you through it.

As mentioned in our [FAQ](https://infracost.io/docs/faq), no cloud credentials or secrets are sent to the Cloud Pricing API. Infracost does not make any changes to your Terraform state or cloud resources.

<img src="screenshot.png" width="700px" alt="Example screenshot" />

## Table of Contents

* [Usage methods](#usage-methods)
  * [Azure Repos](#azure-repos)
  * [GitHub Repos](#github-repos)
* [Environment variables](#environment-variables)
  * [Integration variables](#integration-variables)
  * [CLI variables](#cli-variables)
* [Contributing](#contributing)

# Usage methods

This Azure DevOps Pipeline template can be used with either:
1. Azure Repos (only git is supported)
2. GitHub Repos

## Azure Repos

1. Enable pull request build triggers: from your Azure DevOps organization, click on your project > Project Settings > Repositories > your repository > click on the Policies tab > under the Branch Policies, click on your default branch > if you don't already have a Build Validation, click on the + sign to add one. To add one: select your Pipeline, leave path filter blank, set the Trigger to Automatic, and Policy requirement to Optional (your can also use Required but we don't recommend it). Without this, Azure DevOps Pipelines do not trigger builds with the pull request ID, thus comments cannot be posted by the integration.

2. Enable DevOps Pipelines to post pull request comments: from your Azure DevOps organization, click on your project > Project Settings > Repositories, click on the Securities tab, under Users click on the "[project name] Build Service ([org name])" user, and set the "Contribute to pull requests" to Allow.

3. Add secret variables: from your Azure DevOps organization, click on your project > Pipelines > your pipeline > Edit > Variables, and click the + sign to add variables for the following. Also tick the "Keep this value secret" option.
    - `SYSTEM_ACCESSTOKEN`: leave this as `$(System.AccessToken)` so the [default REST API token](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#system-variables-devops-services) is available to post pull request comments.
    - `INFRACOST_API_KEY`: your Infracost API key. To get an API key [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register`.
    - [Azure credentials](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) so Terraform init can be run. Usually these are `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_SUBSCRIPTION_ID` and `ARM_TENANT_ID`.

4. Add the following stage to your `azure-pipelines.yml` (create this file if you don't have one already). You can customize the `env` section to add variables and environment variables mentioned in the following sections. If you're using a self-hosted agent, please ensure that `bc`, `curl` and `git` are installed as the `diff.sh` script uses those.

    ```yml
    pool:
      vmImage: ubuntu-latest

    stages:
      - stage: infracost
        condition: eq(variables['Build.Reason'], 'PullRequest')
        jobs: 
          - job: infracost
            displayName: Run Infracost
            steps:
              - checkout: self
              - bash: |
                  sudo apt-get update -qq && sudo apt-get -qq install bc curl git
                  curl -sL https://github.com/infracost/infracost/releases/latest/download/infracost-linux-amd64.tar.gz | tar xz -C /tmp
                  sudo mv /tmp/infracost-linux-amd64 /usr/bin/infracost
                  curl -sL -o infracost_diff.sh https://raw.githubusercontent.com/infracost/infracost/master/scripts/ci/diff.sh
                  chmod +x infracost_diff.sh
                  ./infracost_diff.sh
                displayName: Run Infracost diff
                env:
                  SYSTEM_ACCESSTOKEN: $(System.AccessToken) # Do not change this, it's used to post comments
                  INFRACOST_API_KEY: $(INFRACOST_API_KEY)
                  ARM_CLIENT_ID: $(ARM_CLIENT_ID)
                  ARM_CLIENT_SECRET: $(ARM_CLIENT_SECRET)
                  ARM_SUBSCRIPTION_ID: $(ARM_SUBSCRIPTION_ID)
                  ARM_TENANT_ID: $(ARM_TENANT_ID)
                  path: path/to/code
    ```

5. Send a new pull request to change something in Terraform that costs money; a comment should be posted on the pull request. Check the Azure DevOps Pipeline logs and [this page](https://www.infracost.io/docs/integrations/cicd#cicd-troubleshooting) if there are issues.

## GitHub Repos

1. Create a GitHub token (such as Personal Access Token) that can be used by the Azure DevOps Pipeline to post comments. The token needs to have `repo` scope so it can post comments.

2. Add secret variables: from your Azure DevOps organization, click on your project > Pipelines > your pipeline > Edit > Variables, and click the + sign to add variables for the following. Also tick the "Keep this value secret" option.
    - `INFRACOST_API_KEY`: your Infracost API key. To get an API key [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register`.
    - `GITHUB_TOKEN`: your GitHub Token.
    - [Azure credentials](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) so Terraform init can be run. Usually these are `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_SUBSCRIPTION_ID` and `ARM_TENANT_ID`.

3. Add the following stage to your `azure-pipelines.yml` (create this file if you don't have one already). You can customize the `env` section to add environment variables mentioned in the following sections. If you're using a self-hosted agent, please ensure that `bc`, `curl` and `git` are installed as the `diff.sh` script uses those.

    ```yml
    pool:
      vmImage: ubuntu-latest

    stages:
      - stage: infracost
        condition: eq(variables['Build.Reason'], 'PullRequest')
        jobs: 
          - job: infracost
            displayName: Run Infracost
            steps:
              - checkout: self
              - bash: |
                  sudo apt-get update -qq && sudo apt-get -qq install bc curl git
                  curl -sL https://github.com/infracost/infracost/releases/latest/download/infracost-linux-amd64.tar.gz | tar xz -C /tmp
                  sudo mv /tmp/infracost-linux-amd64 /usr/bin/infracost
                  curl -sL -o infracost_diff.sh https://raw.githubusercontent.com/infracost/infracost/master/scripts/ci/diff.sh
                  chmod +x infracost_diff.sh
                  ./infracost_diff.sh
                displayName: Run Infracost diff
                env:
                  INFRACOST_API_KEY: $(INFRACOST_API_KEY)
                  GITHUB_TOKEN: $(GITHUB_TOKEN)
                  ARM_CLIENT_ID: $(ARM_CLIENT_ID)
                  ARM_CLIENT_SECRET: $(ARM_CLIENT_SECRET)
                  ARM_SUBSCRIPTION_ID: $(ARM_SUBSCRIPTION_ID)
                  ARM_TENANT_ID: $(ARM_TENANT_ID)
                  path: path/to/code
    ```

4. Send a new pull request to change something in Terraform that costs money; a comment should be posted on the pull request. Check the Azure DevOps Pipeline logs and [this page](https://www.infracost.io/docs/integrations/cicd#cicd-troubleshooting) if there are issues.

# Environment variables

There are two sets of environment variables: ones that are used by this integration, and ones that are used by the Infracost CLI. Both can be specified in the `env:` block of your `azure-pipelines.yml` file.

## Integration variables

### `path`

**Optional** Path to the Terraform directory or JSON/plan file. Either `path` or `config_file` is required.

### `terraform_plan_flags`

**Optional** Flags to pass to the 'terraform plan' command, e.g. `"-var-file=my.tfvars -var-file=other.tfvars"`. Applicable when path is a Terraform directory.

### `terraform_workspace`

**Optional** The Terraform workspace to use. Applicable when path is a Terraform directory. Only set this for multi-workspace deployments, otherwise it might result in the Terraform error "workspaces not supported".

### `usage_file`

**Optional** Path to Infracost [usage file](https://www.infracost.io/docs/usage_based_resources#infracost-usage-file) that specifies values for usage-based resources, see [this example file](https://github.com/infracost/infracost/blob/master/infracost-usage-example.yml) for the available options.

### `config_file`

**Optional** If your repo has **multiple Terraform projects or workspaces**, define them in a [config file](https://www.infracost.io/docs/config_file/) and set this input to its path. Their results will be combined into the same diff output. Cannot be used with path, terraform_plan_flags or usage_file inputs. 

### `show_skipped`

**Optional** Show unsupported resources, some of which might be free, at the bottom of the Infracost output (default is false).

### `post_condition`

**Optional** A JSON string describing the condition that triggers pull request comments, can be one of these:
- `'{"update": true}'`: we suggest you start with this option. When a commit results in a change in cost estimates vs earlier commits, the integration will create **or update** a PR comment (not commit comments). The GitHub comments UI can be used to see when/what was changed in the comment. PR followers will only be notified on the comment create (not update), and the comment will stay at the same location in the comment history. This is initially supported for GitHub, please let us know if you'd like to see this for GitLab and BitBucket.
- `'{"has_diff": true}'`: a commit comment is put on the first commit with a Terraform change (i.e. there is a diff) and on every subsequent commit (regardless of whether or not there is a Terraform change in the particular commit). This is the default behavior but we think `update` might be a better default so we might change this in the future.
- `'{"always": true}'`: a commit comment is put on every commit.
- `'{"percentage_threshold": 0}'`: absolute percentage threshold that triggers a comment. For example, set to 1 to post a comment if the cost estimate changes by more than plus or minus 1%. A commit comment is put on every commit with a Terraform change that results in a cost diff that is bigger than the threshold.

Please use [this GitHub discussion](https://github.com/infracost/infracost/discussions/1016) to tell us what you'd like to see in PR comments.

### `sync_usage_file` (experimental)

**Optional**  If set to `true` this will create or update the usage file with missing resources, either using zero values or pulling data from AWS CloudWatch. For more information see the [Infracost docs here](https://www.infracost.io/docs/usage_based_resources#1-generate-usage-file). You must also specify the `usage_file` input if this is set to `true`.

### `GITHUB_TOKEN`

**Optional** This is required if your repo is in GitHub so comments can be posted. This can be your Personal access token, and needs to have `repo` scope so it can post comments.

### `GIT_SSH_KEY`

**Optional** If you're using Terraform modules from private Git repositories you can set this environment variable to your private Git SSH key so Terraform can access your module.

### `SLACK_WEBHOOK_URL`

**Optional** Set this to also post the pull request comment to a [Slack Webhook](https://slack.com/intl/en-tr/help/articles/115005265063-Incoming-webhooks-for-Slack), which should post it in the corresponding Slack channel.

## CLI variables

This section describes the main environment variables that can be used with the Infracost CLI. Other supported environment variables are described in the [this page](https://www.infracost.io/docs/integrations/environment_variables). [Secret variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch#secret-variables) can be used for sensitive environment values.

Terragrunt users should also read [this page](https://www.infracost.io/docs/iac_tools/terragrunt). Terraform Cloud/Enterprise users should also read [this page](https://www.infracost.io/docs/iac_tools/terraform_cloud_enterprise).

### `INFRACOST_API_KEY`

**Required** To get an API key [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register`.

### Cloud credentials

**Required** You do not need to set cloud credentials if you use Terraform Cloud/Enterprise's remote execution mode, instead you should follow [this page](https://www.infracost.io/docs/iac_tools/terraform_cloud_enterprise).

For all other users, the following is needed so Terraform can run `init`:
- Azure users should read [this section](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret) to see which environment variables work for their use-case.
- AWS users should set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or read [this section](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables) of the Terraform docs for other options. If your Terraform project uses multiple AWS credentials you can configure them using the [Infracost config file](https://www.infracost.io/docs/multi_project/config_file/#examples). We have an example of [how this works with GitHub actions here](https://github.com/infracost/infracost-gh-action#multiple-aws-credentials).
- GCP users should set `GOOGLE_CREDENTIALS`, or read [this section](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#full-reference) of the Terraform docs for other options.

### `INFRACOST_TERRAFORM_BINARY`

**Optional** Used to change the path to the `terraform` binary or version.

## Contributing

Issues and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
