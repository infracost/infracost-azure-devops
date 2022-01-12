# Open Policy Agent Example

This example shows how to set cost policies using [Open Policy Agent](https://www.openpolicyagent.org/).  For simplicity, this is based off the terraform-plan-json example, which does not require Terraform to be installed.

When the policy checks pass, the Azure DevOps pipeline step called "Check Policies" passes and outputs `Policy check passed.` in the task logs. When the policy checks fail, that step fails and the task logs show the details of the failing policies.

Create a policy file (e.g. `policy.rego`) that checks the Infracost JSON: 
```rego
package infracost

# totalDiff
deny[msg] {
	maxDiff = 1500.0
	to_number(input.diffTotalMonthlyCost) >= maxDiff

	msg := sprintf(
		"Total monthly cost diff must be less than $%.2f (actual diff is $%.2f)",
		[maxDiff, to_number(input.diffTotalMonthlyCost)],
	)
}

# instanceCost
deny[msg] {
	r := input.projects[_].breakdown.resources[_]
	startswith(r.name, "aws_instance.")

	maxHourlyCost := 2.0
	to_number(r.hourlyCost) > maxHourlyCost

	msg := sprintf(
		"AWS instances must cost less than $%.2f\\hr (%s costs $%.2f\\hr).",
		[maxHourlyCost, r.name, to_number(r.hourlyCost)],
	)
}

# instanceIOPSCost
deny[msg] {
	r := input.projects[_].breakdown.resources[_]
	startswith(r.name, "aws_instance.")

	baseHourlyCost := to_number(r.costComponents[_].hourlyCost)

	sr_cc := r.subresources[_].costComponents[_]
	sr_cc.name == "Provisioned IOPS"
	iopsHourlyCost := to_number(sr_cc.hourlyCost)

	iopsHourlyCost > baseHourlyCost

	msg := sprintf(
		"AWS instance IOPS must cost less than compute usage (%s IOPS $%.2f\\hr, usage $%.2f\\hr).",
		[r.name, iopsHourlyCost, baseHourlyCost],
	)
}
```

Then use OPA to test infrastructure cost changes against the policy.

[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master

jobs:
  - job: open_policy_agent
    displayName: Open Policy Agent
    pool: 
      vmImage: ubuntu-latest

    steps:
      - task: InfracostSetup@0
        displayName: Setup Infracost
        inputs:
          apiKey: $(apiKey)

      - bash: |
          INSTALL_LOCATION="$(Build.SourcesDirectory)/bin"
          mkdir -p ${INSTALL_LOCATION}
          
          wget -O ${INSTALL_LOCATION}/opa https://openpolicyagent.org/downloads/v${OPA_VERSION}/opa_linux_amd64_static 
          chmod +x ${INSTALL_LOCATION}/opa

          echo "##vso[task.setvariable variable=PATH;]$(PATH):${INSTALL_LOCATION}"

        displayName: Setup OPA
        env:
          OPA_VERSION: 0.35.0

      - bash: infracost breakdown --path=examples/opa/code/plan.json --format=json --out-file=/tmp/infracost.json
        displayName: Run Infracost
        
      - bash: opa eval --input /tmp/infracost.json -d examples/opa/policy/policy.rego --format pretty "data.infracost.deny" | tee /tmp/opa.out
        displayName: Run OPA

      - bash: |
          denyReasons=$(</tmp/opa.out)
          if [ "$denyReasons" != "[]" ]; then
            echo "##vso[task.logissue type=error]Policy check failed"
            echo "##vso[task.logissue type=error]$denyReasons"
            echo "##vso[task.complete result=Failed;]DONE"
          else
            echo "Policy check passed."
          fi
        displayName: Check Policies
```
[//]: <> (END EXAMPLE)
