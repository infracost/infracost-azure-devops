
💰 Infracost estimate: **monthly cost will increase by $800 📈**
<table>
  <thead>
    <td>Project</td>
    <td>Previous</td>
    <td>New</td>
    <td>Diff</td>
  </thead>
  <tbody>
    <tr>
      <td>infracost/infracost-azure-devop...orm-project/code/dev/plan.json</td>
      <td align="right">$0</td>
      <td align="right">$52</td>
      <td>+$52</td>
    </tr>
    <tr>
      <td>infracost/infracost-azure-devop...rm-project/code/prod/plan.json</td>
      <td align="right">$0</td>
      <td align="right">$748</td>
      <td>+$748</td>
    </tr>
    <tr>
      <td>All projects</td>
      <td align="right">$0</td>
      <td align="right">$800</td>
      <td>+$800</td>
    </tr>
  </tbody>
</table>


<details>
<summary><strong>Infracost output</strong></summary>

```
Project: infracost/infracost-azure-devops/examples/terraform-project/code/dev/plan.json

+ module.base.aws_instance.web_app
  +$52

    + Instance usage (Linux/UNIX, on-demand, t2.micro)
      +$8

    + root_block_device

        + Storage (general purpose SSD, gp2)
          +$5

    + ebs_block_device[0]

        + Storage (provisioned IOPS SSD, io1)
          +$13

        + Provisioned IOPS
          +$26

+ module.base.aws_lambda_function.hello_world
  Monthly cost depends on usage

    + Requests
      Monthly cost depends on usage
        +$0.20 per 1M requests

    + Ephemeral storage
        Monthly cost depends on usage
        +$0.0000000309 per GB-seconds

    + Duration (first 6B)
      Monthly cost depends on usage
        +$0.0000166667 per GB-seconds

Monthly cost change for infracost/infracost-azure-devops/examples/terraform-project/code/dev/plan.json
Amount:  +$52 ($0.00 → $52)

──────────────────────────────────
Project: infracost/infracost-azure-devops/examples/terraform-project/code/prod/plan.json

+ module.base.aws_instance.web_app
  +$748

    + Instance usage (Linux/UNIX, on-demand, m5.4xlarge)
      +$561

    + root_block_device

        + Storage (general purpose SSD, gp2)
          +$10

    + ebs_block_device[0]

        + Storage (provisioned IOPS SSD, io1)
          +$125

        + Provisioned IOPS
          +$52

+ module.base.aws_lambda_function.hello_world
  Monthly cost depends on usage

    + Requests
      Monthly cost depends on usage
        +$0.20 per 1M requests

    + Ephemeral storage
        Monthly cost depends on usage
        +$0.0000000309 per GB-seconds

    + Duration (first 6B)
      Monthly cost depends on usage
        +$0.0000166667 per GB-seconds

Monthly cost change for infracost/infracost-azure-devops/examples/terraform-project/code/prod/plan.json
Amount:  +$748 ($0.00 → $748)

──────────────────────────────────
Key: ~ changed, + added, - removed

4 cloud resources were detected:
∙ 4 were estimated, all of which include usage-based costs, see https://infracost.io/usage-file
```
</details>

This comment will be updated when the cost estimate changes.

<sub>
  Is this comment useful? <a href="https://dashboard.infracost.io/feedback/redirect?runId=&value=yes" rel="noopener noreferrer" target="_blank">Yes</a>, <a href="https://dashboard.infracost.io/feedback/redirect?runId=&value=no" rel="noopener noreferrer" target="_blank">No</a>, <a href="https://dashboard.infracost.io/feedback/redirect?runId=&value=other" rel="noopener noreferrer" target="_blank">Other</a>
</sub>

Comment not posted to GitHub (--dry-run was specified)
