# Terraform Cloud/Enterprise

This example shows how to run Infracost on GitHub CI with Terraform Cloud and Terraform Enterprise. It assumes you have set a pipeline secret variable for the Terraform Cloud token (`tfcToken`), which is used to run a speculative plan and fetch the plan JSON from Terraform Cloud.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: terraform_cloud_enterprise
    displayName: Terraform Cloud/Enterprise
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/plan-json/terraform-cloud-enterprise/code
      - name: TFC_HOST
        value: app.terraform.io # Change this if you're using Terraform Enterprise
      # This instructs the CLI to send cost estimates to Infracost Cloud. Our SaaS product
      #   complements the open source CLI by giving teams advanced visibility and controls.
      #   The cost estimates are transmitted in JSON format and do not contain any cloud 
      #   credentials or secrets (see https://infracost.io/docs/faq/ for more information).
      - name: INFRACOST_ENABLE_CLOUD
        value: true
        
    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      # IMPORTANT: add any required steps here to setup cloud credentials so Terraform can run
      - bash: |
          cat <<EOF > $HOME/.terraformrc
          credentials "$(TFC_HOST)" {
            token = "$(tfcToken)"
          }
          EOF
          terraform init
        displayName: Terraform init
        workingDirectory: $(TF_ROOT)

      # When using TFC remote execution, terraform doesn't allow us to save the plan output.
      # So we have to save the plan logs so we can parse out the run ID and fetch the plan JSON
      - bash: |
          echo "Running terraform plan"
          terraform plan -no-color | tee /tmp/plan_logs.txt

          echo "Parsing the run URL and ID from the logs"
          run_url=$(grep -A1 'To view this run' /tmp/plan_logs.txt | tail -n 1)
          run_id=$(basename $run_url)

          echo "Getting the run plan response from https://$TFC_HOST/api/v2/runs/$run_id/plan"
          run_plan_resp=$(wget -q -O - --header="Authorization: Bearer $(tfcToken)" "https://$TFC_HOST/api/v2/runs/$run_id/plan")
          echo "Extracting the plan JSON path"
          plan_json_path=$(echo $run_plan_resp | sed 's/.*\"json-output\":\"\([^\"]*\)\".*/\1/')

          echo "Downloading the plan JSON from https://$TFC_HOST$plan_json_path"
          wget -q -O plan.json --header="Authorization: Bearer $(tfcToken)" "https://$TFC_HOST$plan_json_path"
        displayName: Retrieve plan JSONs
        workingDirectory: $(TF_ROOT)

      - task: InfracostSetup@1
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      # Generate an Infracost diff and save it to a JSON file.
      - bash: |
          infracost diff --path=$(TF_ROOT)/plan.json \
                         --format=json \
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
