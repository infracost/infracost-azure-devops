# Terraform Cloud/Enterprise

This example shows how to run Infracost on GitHub CI with Terraform Cloud and Terraform Enterprise. It assumes you have set a pipeline secret variable for the Terraform Cloud token (`tfcToken`), which is used to run a speculative plan and fetch the plan JSON from Terraform Cloud.
