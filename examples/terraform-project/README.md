# Terraform/Terragrunt project (single or multi)

This example shows how to run Infracost in Azure Pipelines with multiple Terraform/Terragrunt projects, both single projects or mono-repos that contain multiple projects.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terraform_project
    displayName: Terraform project
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/terraform-project/code
      # If you use private modules you'll need this env variable to use 
      # the same ssh-agent socket value across all steps. 
      - name: SSH_AUTH_SOCK
        value: /tmp/ssh_agent.sock
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
          infracost breakdown --path=/tmp/base/$(TF_ROOT) \
                              --format=json \
                              --out-file=/tmp/infracost-base.json
        displayName: Generate Infracost cost estimate baseline
        # If you're using Terraform Cloud/Enterprise and have variables or private modules stored
        # on there, specify the following to automatically retrieve the variables:
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
        # If you're using Terraform Cloud/Enterprise and have variables or private modules stored
        # on there, specify the following to automatically retrieve the variables:
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
      # The INFRACOST_ENABLE_CLOUD​=true section instructs the CLI to send its JSON output to Infracost Cloud.
      #   This SaaS product gives you visibility across all changes in a dashboard. The JSON output does not
      #   contain any cloud credentials or secrets.
      - bash: |
          INFRACOST_ENABLE_CLOUD​=true infracost comment github --path=/tmp/infracost.json \
                                   --github-token=$(githubToken) \
                                   --pull-request=$(System.PullRequest.PullRequestNumber) \
                                   --repo=$(Build.Repository.Name) \
                                   --behavior=update
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
