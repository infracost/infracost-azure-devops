
<h4>💰 Infracost report</h4>
<h4>Monthly estimate increased by $561 📈</h4>
<table>
  <thead>
    <td>Changed project</td>
    <td><span title="Baseline costs are consistent charges for provisioned resources, like the hourly cost for a virtual machine, which stays constant no matter how much it is used. Infracost estimates these resources assuming they are used for the whole month (730 hours).">Baseline cost</span></td>
    <td><span title="Usage costs are charges based on actual usage, like the storage cost for an object storage bucket. Infracost estimates these resources using the monthly usage values in the usage-file.">Usage cost</span>*</td>
    <td>Total change</td>
    <td>New monthly cost</td>
  </thead>
  <tbody>
    <tr>
      <td>infracost/infracost-azure-devops</td>
      <td align="right">+$1,303</td>
      <td align="right">-</td>
      <td align="right">+$1,303</td>
      <td align="right">$1,303</td>
    </tr>
    <tr>
      <td>infracost/infracost-azure-devop...erraform-cloud-enterprise/code</td>
      <td align="right">-$743</td>
      <td align="right">-</td>
      <td align="right">-$743</td>
      <td align="right">$0</td>
    </tr>
  </tbody>
</table>


*Usage costs can be estimated by updating [Infracost Cloud settings](https://www.infracost.io/docs/features/usage_based_resources), see [docs](https://www.infracost.io/docs/features/usage_based_resources/#infracost-usageyml) for other options.
<details>

<summary>Estimate details </summary>

```
Key: * usage cost, ~ changed, + added, - removed

──────────────────────────────────
Project: main

+ aws_instance.web_app
  +$1,303

    + Instance usage (Linux/UNIX, on-demand, m5.8xlarge)
      +$1,121

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

Monthly cost change for infracost/infracost-azure-devops
Amount:  +$1,303 ($0.00 → $1,303)

──────────────────────────────────
Project: main

- aws_lambda_function.hello_world
  Monthly cost depends on usage

    - Requests
      Monthly cost depends on usage
        -$0.20 per 1M requests

    - Ephemeral storage
      Monthly cost depends on usage
        -$0.0000000309 per GB-seconds

    - Duration (first 6B)
      Monthly cost depends on usage
        -$0.0000166667 per GB-seconds

- aws_instance.web_app
  -$743

    - Instance usage (Linux/UNIX, on-demand, m5.4xlarge)
      -$561

    - root_block_device
    
        - Storage (general purpose SSD, gp2)
          -$5

    - ebs_block_device[0]
    
        - Storage (provisioned IOPS SSD, io1)
          -$125
    
        - Provisioned IOPS
          -$52

Monthly cost change for infracost/infracost-azure-devops/examples/plan-json/terraform-cloud-enterprise/code
Amount:  -$743 ($743 → $0.00)

──────────────────────────────────
Key: * usage cost, ~ changed, + added, - removed

*Usage costs can be estimated by updating Infracost Cloud settings, see docs for other options.

2 cloud resources were detected:
∙ 2 were estimated

Infracost estimate: Monthly estimate increased by $561 ↑
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Changed project                                                  ┃ Baseline cost ┃ Usage cost* ┃ Total change ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━┫
┃ infracost/infracost-azure-devops                                 ┃       +$1,303 ┃           - ┃      +$1,303 ┃
┃ infracost/infracost-azure-devop...erraform-cloud-enterprise/code ┃         -$743 ┃           - ┃        -$743 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┛
```
</details>
<sub>This comment will be updated when code changes.
</sub>

Comment not posted to GitHub (--dry-run was specified)
