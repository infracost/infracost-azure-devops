# Setup Infracost Task

This Azure DevOps Task downloads and installs the Infracost CLI in your Azure DevOps Pipeline. Subsequent steps in the same job can run the CLI in the same way it is run on the command line.

## Usage

The task can be used as follows. You probably want to run Infracost CLI commands then use the [comment](TODO link to comment webpage) task to post comments! See the [examples](https://github.com/infracost/infracost-azure-devops/examples) section on github for examples of how these tasks can be combined.

```yml
steps:
  - task: SetupInfracostTask@v0
    inputs:
      apiKey: $(apiKey)
```

## Inputs

The action supports the following inputs:

- `apiKey`: Required. Your Infracost API key. It can be retrieved by running `infracost configure get api_key`. If you don't have one, [download Infracost](https://www.infracost.io/docs/#quick-start) and run `infracost register` to get a free API key.

- `version`: Optional, defaults to `0.9.x`. [SemVer ranges](https://www.npmjs.com/package/semver#ranges) are supported, so instead of a [full version](https://github.com/infracost/infracost/releases) string, you can use `0.9.x`. This enables you to automatically get the latest backward compatible changes in the 0.9 release (e.g. new resources or bug fixes).

- `currency`: Optional. Convert output from USD to your preferred [ISO 4217 currency](https://en.wikipedia.org/wiki/ISO_4217#Active_codes), e.g. EUR, BRL or INR.

- `pricingApiEndpoint`: Optional. For [self-hosted](https://www.infracost.io/docs/cloud_pricing_api/self_hosted) users, endpoint of the Cloud Pricing API, e.g. https://cloud-pricing-api.

- `enableDashboard`: Optional, defaults to `false`. Enables [Infracost dashboard features](https://www.infracost.io/docs/features/share_links), not supported for self-hosted Cloud Pricing API.

## Outputs

This task does not set any direct outputs.
