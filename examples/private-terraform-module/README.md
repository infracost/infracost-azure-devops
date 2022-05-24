# Private Terraform module

This example shows how to run Infracost in Azure Pipelines with a Terraform project that uses a private Terraform module. This requires a secret to be added to your GitHub repository called `GIT_SSH_KEY` containing a private key so that Infracost can access the private repository.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: private_terraform_module
    displayName: Private Terraform module
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/private-terraform-module/code

    steps:
      - task: InfracostSetup@1
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      # Add your git SSH key so Infracost can checkout the private modules
      - bash: |
          mkdir -p .ssh
          echo "$(echo $GIT_SSH_KEY_BASE_64 | base64 -d)" > .ssh/git_ssh_key
          chmod 400 .ssh/git_ssh_key
          echo "##vso[task.setvariable variable=GIT_SSH_COMMAND;]ssh -i $(pwd)/.ssh/git_ssh_key -o 'StrictHostKeyChecking=no'"
        displayName: Add GIT_SSH_KEY
        env:
          GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)

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
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
