import * as path from 'path';
import * as assert from 'assert';
import * as MockTest from 'azure-pipelines-task-lib/mock-test';

describe('InfracostSetup', function () {
  function expect(validator: () => void, runner: MockTest.MockTestRunner) {
    try {
      validator();
    }
    catch (error) {
      console.log('STDERR', runner.stderr);
      console.log('STDOUT', runner.stdout);
      throw error;
    }
  }

  async function run(testPath: string): Promise<MockTest.MockTestRunner> {
    const fullPath = path.join(__dirname, testPath);
    const runner = new MockTest.MockTestRunner(fullPath);

    await runner.runAsync();

    return runner;
  }

  afterEach(() => {
    delete process.env['BUILD_REPOSITORY_URI'];
    delete process.env['INFRACOST_AZURE_DEVOPS_PIPELINE'];
    delete process.env['INFRACOST_SKIP_UPDATE_CHECK'];
    delete process.env['INFRACOST_VCS_REPOSITORY_URL'];
  });

  it('installs the latest version of Infracost CLI', async () => {
    const test = await run('pass-default.js');

    expect(() => {
      assert.ok(test.stdOutContained('##vso[task.debug]set INFRACOST_AZURE_DEVOPS_PIPELINE=true'), 'sets Azure DevOps env var');
      assert.ok(test.stdOutContained('##vso[task.debug]set INFRACOST_SKIP_UPDATE_CHECK=true'), 'sets skip update check env var');
      assert.ok(
        test.stdOutContained('##vso[task.debug]set INFRACOST_VCS_REPOSITORY_URL=http://test-setup-repo-uri.com'),
        'sets VCS repo URL env var',
      );

      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/download/v0.9.17/infracost-linux-amd64.tar.gz'),
        'downloads the latest detected version',
      );
      assert.ok(
        test.stdOutContained('##vso[task.debug]Moving mocked-path-to-extracted-file/infracost-linux-amd64 to mocked-path-to-extracted-file/infracost'),
        'renames CLI',
      );
      assert.ok(
        test.stdOutContained('[mock tool-lib] prependPath mocked-path-to-extracted-file'),
        'adds binary path to PATH'
      );

      assert.ok(test.stdOutContained('[mock infracost] configure set api_key test-api-key'), 'configures API key');

      assert.ok(test.succeeded, 'task succeeded');
    }, test);
  });

  it('installs the specific CLI version when version is provided', async () => {
    const test = await run('pass-with-version.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/download/v0.9.15/infracost-linux-amd64.tar.gz'),
        'downloads the specified version',
      );

      assert.ok(
        !test.stdOutContained('this task targets 0.10.x'),
        'does not warn about CLI 2.x',
      );

      assert.ok(test.succeeded, 'task succeeded');
    }, test);
  });

  it('installs the CLI version when version is provided as latest', async () => {
    const test = await run('pass-with-latest-version.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/latest/download/infracost-linux-amd64.tar.gz'),
        'downloads the latest version',
      );

      assert.ok(
        !test.stdOutContained('this task targets 0.10.x'),
        'does not flag latest as CLI 2.x, the latest release of infracost/infracost is 0.10.x',
      );

      assert.ok(test.succeeded, 'task succeeded');
    }, test);
  });

  it('fails when the version provided is a CLI 2.x release', async () => {
    const test = await run('fail-with-v2-version.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('version: 2.19.1 installs Infracost CLI 2.19.1, but this task targets 0.10.x'),
        'names the version the pipeline set',
      );
      assert.ok(
        test.stdOutContained('https://www.infracost.io/docs/integrations/azure_pipelines/'),
        'points at the CI 2.x setup guide',
      );
      assert.ok(
        !test.stdOutContained('[mock tool-lib] downloadTool'),
        'does not attempt a download that can only 404',
      );

      assert.ok(test.failed, 'task failed');
    }, test);
  });

  it('fails when the version range resolves to a CLI 2.x release', async () => {
    const test = await run('fail-with-range-resolving-to-v2.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('version: >=0.9 installs Infracost CLI 2.18.3, but this task targets 0.10.x'),
        'names the range the pipeline set, not just what it resolved to',
      );

      assert.ok(test.failed, 'task failed');
    }, test);
  });

  it('installs the CLI when OS is Windows', async () => {
    const test = await run('pass-os-windows.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/download/v0.9.17/infracost-windows-x32.tar.gz'),
        'downloads the latest detected version',
      );
      assert.ok(
        !test.stdOutContained('Moving mocked-path-to-extracted-file'),
        'does not rename executable',
      );

      assert.ok(test.succeeded, 'task succeeded');
    }, test);
  });

  it('configures CLI when options are provided', async () => {
    const test = await run('pass-with-inputs.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] configure set pricing_api_endpoint http://example.com'), 'configures pricing_api_endpoint');
      assert.ok(test.stdOutContained('[mock infracost] configure set currency EUR'), 'configures currency');

      assert.ok(test.succeeded, 'task succeeded');
    }, test);
  });

  it('fails when API key is missing', async () => {
    const test = await run('fail-api-key-missing.js');

    expect(() => {
      assert.ok(test.stdOutContained('Input required: apiKey'), 'requires apiKey');

      assert.ok(test.failed, 'task failed');
    }, test);
  });

  it('fails when invalid input is provided for configuration', async () => {
    const test = await run('fail-invalid-input.js');

    expect(() => {

      assert.ok(test.failed, 'task failed');
    }, test);
  });
});
