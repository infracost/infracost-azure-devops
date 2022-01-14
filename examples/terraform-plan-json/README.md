# Terraform plan JSON

This example shows how to run Infracost tasks with a Terraform plan JSON file. Installing Terraform is not needed since the Infracost CLI can use the plan JSON directly.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terraform_plan_json
    displayName: Terraform plan JSON
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: infracost breakdown --path=examples/terraform-plan-json/code/plan.json --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          githubToken: $(githubToken)
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/actions/tree/master/overview.md#infracostcomment-task for other options
```
[//]: <> (END EXAMPLE)
