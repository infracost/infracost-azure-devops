
<h3>Infracost report</h3>
<h4>💰 Monthly cost will increase by $743 📈</h4>
<table>
  <thead>
    <td>Project</td>
    <td>Cost change</td>
    <td>New monthly cost</td>
  </thead>
  <tbody>
    <tr>
      <td>infracost/infracost-azure-devop...loud-enterprise/code/plan.json</td>
      <td>+$743</td>
      <td align="right">$743</td>
    </tr>
  </tbody>
</table>
<details>
<summary>Cost details</summary>

```
──────────────────────────────────
Project: infracost/infracost-azure-devops/examples/plan-json/terraform-cloud-enterprise/code/plan.json

+ aws_instance.web_app
  +$743

    + Instance usage (Linux/UNIX, on-demand, m5.4xlarge)
      +$561

    + root_block_device
    
        + Storage (general purpose SSD, gp2)
          +$5

    + ebs_block_device[0]
    
        + Storage (provisioned IOPS SSD, io1)
          +$125
    
        + Provisioned IOPS
          +$52

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

Monthly cost change for infracost/infracost-azure-devops/examples/plan-json/terraform-cloud-enterprise/code/plan.json
Amount:  +$743 ($0.00 → $743)

──────────────────────────────────
Key: ~ changed, + added, - removed

2 cloud resources were detected:
∙ 2 were estimated, all of which include usage-based costs, see https://infracost.io/usage-file

Infracost estimate: Monthly cost will increase by $743 ↑
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Project                                                          ┃ Cost change ┃ New monthly cost ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━┫
┃ infracost/infracost-azure-devop...loud-enterprise/code/plan.json ┃       +$743 ┃ $743             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┛
```
</details>
<sub>This comment will be updated when code changes.
</sub>

Comment not posted to GitHub (--dry-run was specified)
