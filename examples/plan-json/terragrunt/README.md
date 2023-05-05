# Terragrunt

This example shows how to run Infracost in Azure Pipelines with Terragrunt.

[//]: <> (BEGIN EXAMPLE)
```yml
jobs:
  - job: terragrunt_project
    displayName: Terragrunt project
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/plan-json/terragrunt/code

    steps:
      - task: TerraformInstaller@0  # This can be obtained by installing the Microsoft Terraform extension: https://marketplace.visualstudio.com/items?itemName=ms-devlabs.custom-terraform-tasks
        displayName: Install Terraform

      - bash: |
          INSTALL_LOCATION="$(Build.SourcesDirectory)/bin"
          mkdir -p ${INSTALL_LOCATION}

          curl -sL "https://github.com/gruntwork-io/terragrunt/releases/latest/download/terragrunt_linux_amd64" > ${INSTALL_LOCATION}/terragrunt
          chmod +x ${INSTALL_LOCATION}/terragrunt

          echo "##vso[task.setvariable variable=PATH;]$(PATH):${INSTALL_LOCATION}"
        displayName: Setup Terragrunt

      # Generate plan JSON files for all Terragrunt modules and
      # add them to an Infracost config file
      - bash: |
          terragrunt run-all --terragrunt-ignore-external-dependencies plan -out=plan.cache

          # Find the plan files
          plans=($(find . -name plan.cache | tr '\n' ' '))

          # Generate plan JSON files by running terragrunt show for each plan file
          planjsons=()
          for plan in "${plans[@]}"; do
            # Find the Terraform working directory for running terragrunt show
            # We want to take the dir of the plan file and strip off anything after the .terraform-cache dir
            # to find the location of the Terraform working directory that contains the Terraform code
            dir=$(dirname $plan)
            dir=$(echo "$dir" | sed 's/\(.*\)\/\.terragrunt-cache\/.*/\1/')

            echo "Running terragrunt show for $(basename $plan) for $dir";
            terragrunt show -json $(basename $plan) --terragrunt-working-dir=$dir --terragrunt-no-auto-init > $dir/plan.json
            planjsons=(${planjsons[@]} "$dir/plan.json")
          done

          # Sort the plan JSONs so we get consistent project ordering in the config file
          IFS=$'\n' planjsons=($(sort <<<"${planjsons[*]}"))

          # Generate Infracost config file
          echo -e "version: 0.1\n\nprojects:\n" > infracost.yml
          for planjson in "${planjsons[@]}"; do
            echo -e "  - path: $(TF_ROOT)/$planjson" >> infracost.yml
          done
        displayName: Generate plan JSONs
        workingDirectory: $(TF_ROOT)

      - task: InfracostSetup@2
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      # Generate an Infracost diff and save it to a JSON file.
      - bash: |
          infracost diff --config-file=$(TF_ROOT)/infracost.yml \
                         --format=json \
                         --out-file=/tmp/infracost.json
        displayName: Generate Infracost diff
        env:
          # The SYSTEM_ACCESSTOKEN is used to add the pull request metadata to Infracost's output
          SYSTEM_ACCESSTOKEN: $(System.AccessToken)

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
