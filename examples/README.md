# Examples

All examples post a single comment on merge requests, which gets updated as more changes are pushed. The examples show how to run the actions with:

- [Terraform directory](terraform-directory): a Terraform project containing HCL code
- [Terraform plan JSON](terraform-plan-json): a Terraform plan JSON file
- [Terragrunt](terragrunt): a Terragrunt project
- [Terraform Cloud/Enterprise](terraform-cloud-enterprise): a Terraform project using Terraform Cloud/Enterprise
- [Multi-project using config file](multi-project/README.md#using-an-infracost-config-file): multiple Terraform projects using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
- [Multi-project using build matrix](multi-project/README.md#using-azure-devops-pipeline-matrix-strategy): multiple Terraform projects using the Azure Pipelines matrix strategy
- [Multi-Terraform workspace](multi-terraform-workspace): multiple Terraform workspaces using the Infracost [config file](https://www.infracost.io/docs/multi_project/config_file)
- [Slack](slack): send cost estimates to Slack

Cost policy examples:
- [Thresholds](thresholds): only post a comment when cost thresholds are exceeded
- [Conftest](conftest): check Infracost cost estimates against policies using Conftest
- [OPA](opa): check Infracost cost estimates against policies using Open Policy Agent
- [Sentinel](sentinel): check Infracost cost estimates against policies using Hashicorp's Sentinel

See the [contributing](../CONTRIBUTING.md) guide if you'd like to add an example.
