# Slack Example

This example shows how to send cost estimates to Slack by combining the Infracost GitHub Action with the official [slackapi/slack-github-action](https://github.com/slackapi/slack-github-action) repo.

Slack message blocks have a 3000 char limit so the Infracost CLI automatically truncates the middle of `slack-message` output formats.

<img src="/.github/assets/slack-message.png" alt="Example screenshot" />

[//]: <> (BEGIN EXAMPLE)
```yml
jobs:
  - job: slack
    displayName: Slack
    pool:
      vmImage: ubuntu-latest

    variables:
      - name: TF_ROOT
        value: examples/terraform-project/code
      # If you use private modules you'll need this env variable to use
      # the same ssh-agent socket value across all steps.
      - name: SSH_AUTH_SOCK
        value: /tmp/ssh_agent.sock

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

      - task: InfracostSetup@2
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
          infracost breakdown --path=/tmp/base/$(TF_ROOT) \
                              --format=json \
                              --out-file=/tmp/infracost-base.json
        displayName: Generate Infracost cost estimate baseline
        env:
          # The SYSTEM_ACCESSTOKEN is used to add the pull request metadata to Infracost's output
          SYSTEM_ACCESSTOKEN: $(System.AccessToken)

      # Generate an Infracost diff and save it to a JSON file.
      - bash: |
          infracost diff --path=$(TF_ROOT) \
                         --format=json \
                         --compare-to=/tmp/infracost-base.json \
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

      - bash: infracost output --path=/tmp/infracost.json --format=slack-message --show-skipped --out-file=/tmp/slack_message.json
        displayName: Generate Slack message

      - bash: |
          # Skip posting to Slack if there's no cost change
          cost_change=$(cat /tmp/infracost.json | jq -r "(.diffTotalMonthlyCost // 0) | tonumber")
          if [ "$cost_change" = "0" ]; then
            echo "Not posting to Slack since cost change is zero"
            exit 0
          fi

          curl -X POST -H "Content-type: application/json" -d @/tmp/slack_message.json $SLACK_WEBHOOK_URL
        displayName: Send cost estimate to Slack
        env:
          SLACK_WEBHOOK_URL: $(slackWebhookUrl)
```
[//]: <> (END EXAMPLE)
