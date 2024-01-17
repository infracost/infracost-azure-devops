
<h3>Infracost report</h3>
<h4>💰 Monthly cost will increase by $800 📈</h4>
<table>
  <thead>
    <td>Project</td>
    <td>Cost change</td>
    <td>New monthly cost</td>
  </thead>
  <tbody>
    <tr>
      <td>infracost/infracost-azure-devop.../terragrunt/code/dev/plan.json</td>
      <td>+$52</td>
      <td align="right">$52</td>
    </tr>
    <tr>
      <td>infracost/infracost-azure-devop...terragrunt/code/prod/plan.json</td>
      <td>+$748</td>
      <td align="right">$748</td>
    </tr>
  </tbody>
</table>
<details>
<summary>Cost details</summary>

```
──────────────────────────────────


+ aws_instance.web_app
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

+ aws_lambda_function.hello_world
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

Monthly cost change for infracost/infracost-azure-devops/examples/plan-json/terragrunt/code/dev/plan.json
Amount:  +$52 ($0.00 → $52)

──────────────────────────────────
Project: infracost/infracost-azure-devops/examples/plan-json/terragrunt/code/prod/plan.json

+ aws_instance.web_app
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

+ aws_lambda_function.hello_world
+ aws_lambda_function.hello_world
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

Monthly cost change for infracost/infracost-azure-devops/examples/plan-json/terragrunt/code/prod/plan.json
Amount:  +$748 ($0.00 → $748)

──────────────────────────────────
Key: ~ changed, + added, - removed

4 cloud resources were detected:
∙ 4 were estimated, all of which include usage-based costs, see https://infracost.io/usage-file

Infracost estimate: Monthly cost will increase by $800 ↑
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Project                                                          ┃ Cost change ┃ New monthly cost ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━┫
┃ infracost/infracost-azure-devop.../terragrunt/code/dev/plan.json ┃        +$52 ┃ $52              ┃
┃ infracost/infracost-azure-devop...terragrunt/code/prod/plan.json ┃       +$748 ┃ $748             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┛
```
</details>
<sub>This comment will be updated when code changes.
</sub>

Comment not posted to GitHub (--dry-run was specified)
