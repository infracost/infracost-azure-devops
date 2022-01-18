# Slack Example

This example shows how to send cost estimates to Slack using Infracost Azure Pipelines tasks.

Slack message blocks have a 3000 char limit so the Infracost CLI automatically truncates the middle of slack-message output formats.

For simplicity, this is based off the terraform-plan-json example, which does not require Terraform to be installed.

<img src=".github/assets/slack-message.png" alt="Example screenshot" />

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: slack
    displayName: Slack
    pool:
      vmImage: ubuntu-latest

    steps:
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(infracostApiKey)

      - bash: infracost breakdown --path examples/slack/code/plan.json --format json --out-file /tmp/infracost.json
        displayName: Run Infracost

      - task: InfracostComment@0
        displayName: Post the comment
        inputs:
          githubToken: $(githubToken)
          path: /tmp/infracost.json
          behavior: update # Create a single comment and update it. See https://github.com/infracost/actions/tree/master/overview.md#infracostcomment-task for other options

      - bash: infracost output --path /tmp/infracost.json --format slack-message --show-skipped --out-file /tmp/slack-message.json
        displayName: Generate Slack message

      - bash: |
          # Skip posting to Slack if there's no cost change
          cost_change=$(cat /tmp/infracost.json | jq -r "(.diffTotalMonthlyCost // 0) | tonumber")
          if [ "$cost_change" = "0" ]; then
            echo "Not posting to Slack since cost change is zero"
            exit 0
          fi

          curl -X POST -H "Content-type: application/json" -d @/tmp/slack-message.json $SLACK_WEBHOOK_URL
        displayName: Send cost estimate to Slack
        env:
          SLACK_WEBHOOK_URL: $(slackWebhookUrl)
```
[//]: <> (END EXAMPLE)
