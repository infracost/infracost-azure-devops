# Multi-project

These examples show how to run Infracost Azure DevOps tasks against a multi-project setup using either an [Infracost config file](https://www.infracost.io/docs/multi_project/config_file) or These examples show how to run Infracost Azure DevOps tasks against a multi-project setup using either an [Infracost config file](https://www.infracost.io/docs/multi_project/config_file) or the Azure DevOps pipeline matrix strategy.

## Using an Infracost config file

This example shows how to run Infracost Azure DevOps tasks with multiple Terraform projects using an [Infracost config file](https://www.infracost.io/docs/multi_project/config_file).

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: multi_project_config_file
    displayName: Multi-project config file
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: TerraformInstaller@0
        displayName: Install Terraform

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)
      
      - bash: infracost breakdown --config-file=examples/multi-project/code/infracost.yml --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        env:
          # IMPORTANT: add any required secrets to setup cloud credentials so Terraform can run
          DEV_AWS_ACCESS_KEY_ID: $(exampleDevAwsAccessKeyId)
          DEV_AWS_SECRET_ACCESS_KEY: $(exampleDevAwsSecretAccessKey)
          PROD_AWS_ACCESS_KEY_ID: $(exampleProdAwsAccessKeyId)
          PROD_AWS_SECRET_ACCESS_KEY: $(exampleProdAwsSecretAccessKey)

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)

## Using Azure DevOps Pipeline matrix strategy

This example shows how to run Infracost Azure DevOps tasks with multiple Terraform projects using the Azure DevOps Pipeline matrix strategy. The first job uses a matrix strategy to generate multiple Infracost output JSON files and upload them as artifacts. The second job downloads these JSON files, combines them using `infracost output`, and posts a comment.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: multi_project_matrix
    displayName: Multi-project matrix
    pool:
      vmImage: ubuntu-latest
    strategy:
      matrix:
        dev:
          AWS_ACCESS_KEY_ID: $(exampleDevAwsAccessKeyId)
          AWS_SECRET_ACCESS_KEY: $(exampleDevAwsSecretAccessKey) 
          DIR: 'dev'
        prod:
          AWS_ACCESS_KEY_ID: $(exampleProdAwsAccessKeyId)
          AWS_SECRET_ACCESS_KEY: $(exampleProdAwsSecretAccessKey)
          DIR: 'prod'
      maxParallel: 2

    steps:
      - task: TerraformInstaller@0
        displayName: Install Terraform

      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)
          
      - bash: infracost breakdown --path=examples/multi-project/code/$(DIR) --format=json --out-file=/tmp/infracost_$(DIR).json
        displayName: Run Infracost
        env:
          AWS_ACCESS_KEY_ID: $(AWS_ACCESS_KEY_ID)
          AWS_SECRET_ACCESS_KEY: $(AWS_SECRET_ACCESS_KEY)
          
      - task: PublishBuildArtifacts@1
        displayName: Upload Infracost breakdown
        inputs:
          PathtoPublish: /tmp/infracost_$(DIR).json
          ArtifactName: infracost_jsons
          publishLocation: 'Container'

  - job: multi_project_matrix_merge
    displayName: Multi-project matrix merge
    pool:
      vmImage: ubuntu-latest
    dependsOn: [multi_project_matrix]

    steps:
      - task: DownloadBuildArtifacts@0
        inputs:
          buildType: 'current'
          downloadType: 'single'
          artifactName: infracost_jsons
          downloadPath: '$(System.DefaultWorkingDirectory)'
          
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)
          
      - bash: |
          infracost output --path="infracost_jsons/*.json" --format=json --out-file=/tmp/infracost_combined.json
        displayName: Combine the results
          
      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          path: /tmp/infracost_combined.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)
