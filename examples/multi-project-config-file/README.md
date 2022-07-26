# Multi-project using config file

This example shows how to run Infracost in Azure Pipelines with multiple Terraform projects using a config file. The [config file]((https://www.infracost.io/docs/config_file/)) can be used to specify variable files or the Terraform workspaces for different projects.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: multi_project_config_file
    displayName: Multi-project config file
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/multi-project-config-file/code
      # If you use private modules you'll need this env variable to use 
      # the same ssh-agent socket value across all steps. 
      - name: SSH_AUTH_SOCK
        value: /tmp/ssh_agent.sock
      # This instructs the CLI to send cost estimates to Infracost Cloud. Our SaaS product
      #   complements the open source CLI by giving teams advanced visibility and controls.
      #   The cost estimates are transmitted in JSON format and do not contain any cloud 
      #   credentials or secrets (see https://infracost.io/docs/faq/ for more information).
      - name: INFRACOST_ENABLE_CLOUD
        value: true        

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
          cd /tmp/base
          infracost breakdown --config-file=$(TF_ROOT)/infracost.yml \
                              --format=json \
                              --out-file=/tmp/infracost-base.json
        displayName: Generate Infracost cost estimate baseline

      - bash: |
          cd -
          infracost diff --config-file=$(TF_ROOT)/infracost.yml \
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
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
