
<h4>💰 Infracost report</h4>
<h4>Monthly estimate increased by $800 📈</h4>
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
      <td>dev</td>
      <td align="right">+$52</td>
      <td align="right">-</td>
      <td align="right">+$52</td>
      <td align="right">$52</td>
    </tr>
    <tr>
      <td>prod</td>
      <td align="right">+$748</td>
      <td align="right">-</td>
      <td align="right">+$748</td>
      <td align="right">$748</td>
    </tr>
  </tbody>
</table>


*Usage costs can be estimated by updating [Infracost Cloud settings](https://www.infracost.io/docs/features/usage_based_resources), see [docs](https://www.infracost.io/docs/features/usage_based_resources/#infracost-usageyml) for other options.
<details>

<summary>Estimate details </summary>

```
Key: * usage cost, ~ changed, + added, - removed

──────────────────────────────────
Project: dev

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

Monthly cost change for dev
Amount:  +$52 ($0.00 → $52)

──────────────────────────────────
Project: prod

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

Monthly cost change for prod
Amount:  +$748 ($0.00 → $748)

──────────────────────────────────
Key: * usage cost, ~ changed, + added, - removed

*Usage costs can be estimated by updating Infracost Cloud settings, see docs for other options.

4 cloud resources were detected:
∙ 4 were estimated

Infracost estimate: Monthly estimate increased by $800 ↑
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Changed project                                    ┃ Baseline cost ┃ Usage cost* ┃ Total change ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━┫
┃ dev                                                ┃          +$52 ┃           - ┃         +$52 ┃
┃ prod                                               ┃         +$748 ┃           - ┃        +$748 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┛
```
</details>
<sub>This comment will be updated when code changes.
</sub>

Comment not posted to GitHub (--dry-run was specified)
