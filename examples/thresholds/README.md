# Cost Thresholds Example

This example shows how to set thresholds that limit when a comment is posted. For simplicity, this is based off the
terraform-plan-json example, which does not require Terraform to be installed.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master
  
jobs:
  - job: thresholds
    displayName: Thresholds
    pool:
      vmImage: ubuntu-latest
    
    steps:
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)

      - bash: infracost breakdown --path=examples/thresholds/code/plan.json --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost

      - bash: |
          # Read the breakdown JSON and get costs
          past=$(cat /tmp/infracost.json | jq -r "(.pastTotalMonthlyCost // 0) | tonumber")
          current=$(cat /tmp/infracost.json | jq -r "(.totalMonthlyCost // 0) | tonumber")
          cost_change=$(cat /tmp/infracost.json | jq -r "(.diffTotalMonthlyCost // 0) | tonumber")

          percent_change=999 # default to a high number so we post a comment if there's no past cost

          if [ "$past" != "0" ]; then
            percent_change=$(echo "100 * (($current - $past) / $past)" | bc -l)
          fi

          absolute_percent_change=$(echo "${percent_change#-}")

          echo "past: ${past}"
          echo "current: ${current}"
          echo "cost_change: ${cost_change}"
          echo "absolute_cost_change: ${cost_change#-}"
          echo "percent_change: ${percent_change}"
          echo "absolute_percent_change: ${absolute_percent_change}"

          # Set the calculated diffs as outputs to be used in future tasks/steps
          echo "##vso[task.setvariable variable=absolutePercentChange;]${absolute_percent_change}"
          echo "##vso[task.setvariable variable=percentChange;]${percent_change}"
          echo "##vso[task.setvariable variable=absoluteCostChange;]${cost_change#-}"
          echo "##vso[task.setvariable variable=costChange;]${cost_change}"
        displayName: Calculate Cost Change
      
      - task: InfracostComment@0
        displayName: Post the comment
        # Setup the conditions for the task to comment on the pipeline. We use the lt expression (less than): 
        # https://docs.microsoft.com/en-us/azure/devops/pipelines/process/expressions?view=azure-devops#lt
        # as azure automatically casts the RIGHT parameter to the type of the LEFT. Variables set in
        # task always evaluate to strings, which means using numerical expressions like lt & gt with variables as the 
        # first parameter are likely to perform incorrectly. e.g:
        #   if a absolutePercentChange is set to '999' then gt(variables.absolutePercentChange, 1000) will evaluate to true.  
        condition: lt(1, variables.absolutePercentChange) # Only comment if cost changed by more than plus or minus 1%
        # condition: lt(1, variables.percentChange) # Only comment if cost increased by more than 1%
        # condition: lt(100, variables.absoluteCostChange) # Only comment if cost changed by more than plus or minus $100
        # condition: lt(100, variables.costChange) # Only comment if cost increased by more than $100
        inputs:
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/infracost-azure-devops#comment-options for other options
```
[//]: <> (END EXAMPLE)
