# Private Terraform module

This example shows how to run Infracost Azure Devops tasks with a Terraform project that uses a private Terraform module. This requires a secret to be added to your GitHub repository called `gitSshKeyBase464` containing a base 64 encoded private key so that Terraform can access the private repository.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: private_terraform_module
    displayName: Private Terraform module
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0
        displayName: Install Terraform
        
      # Add your git SSH key so Terraform can checkout the private modules
      - bash: |
          mkdir -p .ssh
          echo "$(echo $GIT_SSH_KEY_BASE_64 | base64 -d)" > .ssh/git_ssh_key
          chmod 400 .ssh/git_ssh_key
          echo "##vso[task.setvariable variable=GIT_SSH_COMMAND;]ssh -i $(pwd)/.ssh/git_ssh_key -o 'StrictHostKeyChecking=no'"
        displayName: Add git SSH key
        env:
          GIT_SSH_KEY_BASE_64: $(gitSshKeyBase64)

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)
      
      - bash: |
          infracost breakdown --path=examples/private-terraform-module/code --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        # IMPORTANT: add any required secrets to setup cloud credentials so Terraform can run
        # env:

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)