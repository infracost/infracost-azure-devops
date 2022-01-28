# Contributing

🙌 Thank you for contributing and joining our mission to help engineers use cloud infrastructure economically and efficiently 🚀.

[Join our community Slack channel](https://www.infracost.io/community-chat) if you have any questions or need help contributing.

## Examples

This repo has an extensive list of example pipelines that can be used to jump start Infracost CI usage. 

### Adding examples

Copy another example that is similar to what you'd like to add. If you don't know which to pick, try the [terraform-directory](./examples/terraform-directory).

1. Update your example's readme file with the required steps.
2. Run `npm run examples:generate_tests` to generate tests for your example.
3. Update the [repo readme](README.md), the [examples readme](./examples/README.md) and your new example's readme with the description of the example.
4. Send a pull request and wait for an Infracost team member to review it, they'll work with you to update the example's golden file tests and expected output.

### Testing examples

Examples are tested by extracting them from the README.md files into an Azure Pipeline.

To extract the examples, the `npm run examples:generate_tests` script loops through the example directories, reads the READMEs and extracts any YAML code blocks between the markdown comment markers:

````
[//]: <> (BEGIN EXAMPLE)
```yml
pr:
  - master
name: MyExample

jobs:
  - job: my_example
    ...
```
[//]: <> (END EXAMPLE)
````

The script replaces any `InfracostComment` tasks with steps to generate and test the content of the comment using golden files from the [./testdata](./testdata) directory.

All the examples are then added to the  Azure Pipeline definition [examples-test.yml](./.azure/pipelines/examples-test.yml) as separate jobs.

The script that handles extracting and modifying the examples is [./scripts/generateExamplesTest.js](./scripts/generateExamplesTests.js)

## Task Development

Looking to make changes to the core Infracost Azure Pipeline tasks? Here's some caveats to follow:

## Testing Locally

Each task has a set of tests. To run them:

1. `cd` to `tasks/<InfracostX>/`.
2. Run `npm install`.
3. Run `npm run test`.

To add tests to a given task:

1. Add a test file under the `tests/` folder that sets up a `MockRunner` with the task you wish to test. This should include all the inputs and pipeline setup you need to run the given scenario. See [./tasks/InfracostSetup/tests/pass-with-inputs.ts](./tasks/InfracostSetup/tests/pass-with-inputs.ts) as an example.
2. Write a test `spec` in the `tests/_suite.ts` file which should include the test file you created from step 1.
3. Write any assertions on the output and state of the task
4. Run `npm run test`

### Running Tasks locally

Unfortunately Azure Pipeline doesn't have the concept of local runners. Meaning you won't be able to test any task changes locally on your machine. 
Instead, ensure your changes are covered by unit tests, then open a PR with your changes. One of the Infracost team will help you test your changes
in a live Azure environment before merging into master.

## Releases

One of the Infracost team members should follow these steps to release this repo. We only create tags, not GitHub releases, as part of the release process as the GH releases aren't needed yet.

1. Bump the version in [vss-extension.json](./vss-extension.json) (following semantic versioning).
2. Update the task versions in [InfacostSetup](./tasks/InfracostSetup/task.json) & [InfracostComment](./tasks/InfracostComment/task.json) to the same version as in step 1.
3. Create a PR with these changes and merge them in after approval.
4. `git checkout master && git pull origin master`.
5. `git tag vX.Y.Z && git push origin vX.Y.Z` using the same version as in step 1.
6. `git push origin vX.Y.Z`.
7. ensure the `Infracost.InfracostAzureDevops.PublishExtension` has run and is green.
8. Check the [marketplace](https://marketplace.visualstudio.com/manage/publishers/Infracost) has the updated extension version. 
