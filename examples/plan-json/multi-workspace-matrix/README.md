# Multi-Terraform workspace with matrix jobs

This example shows how to run Infracost in Azure Pipelines against a Terraform project that uses multiple workspaces using parallel matrix jobs. The first job uses a matrix to generate the plan JSONs and the second job uses another matrix to generate multiple Infracost output JSON files. `infracost comment` command in the last job combines the Infracost JSON files and posts a single comment.

[//]: <> (BEGIN EXAMPLE)
```yml
jobs:
  - job: multi_workspace_matrix
    displayName: Multi-workspace matrix
    pool:
      vmImage: ubuntu-latest
    strategy:
      matrix:
        dev:
          AWS_ACCESS_KEY_ID: $(exampleDevAwsAccessKeyId)
          AWS_SECRET_ACCESS_KEY: $(exampleDevAwsSecretAccessKey)
          WORKSPACE: 'dev'
        prod:
          AWS_ACCESS_KEY_ID: $(exampleProdAwsAccessKeyId)
          AWS_SECRET_ACCESS_KEY: $(exampleProdAwsSecretAccessKey)
          WORKSPACE: 'prod'
      maxParallel: 2

    variables:
      - name: TF_ROOT
        value: examples/plan-json/multi-workspace-matrix/code

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      # IMPORTANT: add any required steps here to setup cloud credentials so Terraform can run
      - bash: terraform init
        displayName: Terraform init
        workingDirectory: $(TF_ROOT)

      - bash: |
          terraform plan -out=$(WORKSPACE)-plan.cache -var-file=$(WORKSPACE).tfvars
          terraform show -json $(WORKSPACE)-plan.cache > $(WORKSPACE)-plan.json
        env:
          TF_WORKSPACE: $(WORKSPACE)
        displayName: Terraform plan
        workingDirectory: $(TF_ROOT)

      - task: InfracostSetup@1
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      # Generate an Infracost diff and save it to a JSON file.
      - bash: |
          infracost diff --path=$(TF_ROOT)/$(WORKSPACE)-plan.json \
                         --format=json \
                         --out-file=/tmp/infracost_$(WORKSPACE).json
        displayName: Generate Infracost diff
        env:
          AWS_ACCESS_KEY_ID: $(AWS_ACCESS_KEY_ID)
          AWS_SECRET_ACCESS_KEY: $(AWS_SECRET_ACCESS_KEY)

      - task: PublishBuildArtifacts@1
        displayName: Upload Infracost breakdown
        inputs:
          PathtoPublish: /tmp/infracost_$(WORKSPACE).json
          ArtifactName: infracost_workspace_jsons
          publishLocation: 'Container'

  - job: multi_workspace_matrix_merge
    displayName: Multi-workspace matrix merge
    pool:
      vmImage: ubuntu-latest
    dependsOn: [multi_workspace_matrix]

    steps:
      - task: DownloadBuildArtifacts@0
        inputs:
          buildType: 'current'
          downloadType: 'single'
          artifactName: infracost_workspace_jsons
          downloadPath: '$(System.DefaultWorkingDirectory)'

      - task: InfracostSetup@1
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      # Posts a comment to the PR using the 'update' behavior.
      # This creates a single comment and updates it. The "quietest" option.
      # The other valid behaviors are:
      #   delete-and-new - Delete previous comments and create a new one.
      #   hide-and-new - Minimize previous comments and create a new one.
      #   new - Create a new cost estimate comment on every push.
      # See https://www.infracost.io/docs/features/cli_commands/#comment-on-pull-requests for other options.
      - bash: |
          infracost comment github --path="infracost_workspace_jsons/*.json" \
                                   --github-token=$(githubToken) \
                                   --pull-request=$(System.PullRequest.PullRequestNumber) \
                                   --repo=$(Build.Repository.Name) \
                                   --behavior=update
        displayName: Post Infracost Comment
```
[//]: <> (END EXAMPLE)
