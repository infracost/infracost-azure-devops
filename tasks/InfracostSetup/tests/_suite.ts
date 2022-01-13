import * as path from 'path';
import * as assert from 'assert';
import * as MockTest from 'azure-pipelines-task-lib/mock-test';

describe('InfracostSetup', function () {
  function expect(validator: () => void, runner: MockTest.MockTestRunner, done: Mocha.Done) {
    try {
      validator();
      done();
    }
    catch (error) {
      console.log('STDERR', runner.stderr);
      console.log('STDOUT', runner.stdout);
      done(error);
    }
  }

  function run(testPath: string): MockTest.MockTestRunner {
    const fullPath = path.join(__dirname, testPath);
    const runner = new MockTest.MockTestRunner(fullPath);

    runner.run();

    return runner;
  }

  afterEach(() => {
    delete process.env['BUILD_REPOSITORY_URI'];
    delete process.env['INFRACOST_AZURE_DEVOPS_PIPELINE'];
    delete process.env['INFRACOST_SKIP_UPDATE_CHECK'];
    delete process.env['INFRACOST_VCS_REPOSITORY_URL'];
  });

  it('installs the latest version of Infracost CLI', (done: Mocha.Done) => {
    const test = run('pass-default.js');

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
    }, test, done);
  });

  it('installs the specific CLI version when version is provided', (done: Mocha.Done) => {
    const test = run('pass-with-version.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/download/v0.9.15/infracost-linux-amd64.tar.gz'),
        'downloads the specified version',
      );

      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('installs the CLI version when version is provided as latest', (done: Mocha.Done) => {
    const test = run('pass-with-latest-version.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('[mock tool-lib] downloadTool https://github.com/infracost/infracost/releases/latest/download/infracost-linux-amd64.tar.gz'),
        'downloads the latest version',
      );

      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('installs the CLI when OS is Windows', (done: Mocha.Done) => {
    const test = run('pass-os-windows.js');

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
    }, test, done);
  });

  it('configures CLI when options are provided', (done: Mocha.Done) => {
    const test = run('pass-with-inputs.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] configure set pricing_api_endpoint http://example.com'), 'configures pricing_api_endpoint');
      assert.ok(test.stdOutContained('[mock infracost] configure set currency EUR'), 'configures currency');
      assert.ok(test.stdOutContained('[mock infracost] configure set enable_dashboard true'), 'configures enable_dashboard');

      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('fails when API key is missing', (done: Mocha.Done) => {
    const test = run('fail-api-key-missing.js');

    expect(() => {
      assert.ok(test.stdOutContained('Input required: apiKey'), 'requires apiKey');

      assert.ok(test.failed, 'task failed');
    }, test, done);
  });

  it('fails when invalid input is provided for configuration', (done: Mocha.Done) => {
    const test = run('fail-invalid-input.js');

    expect(() => {

      assert.ok(test.failed, 'task failed');
    }, test, done);
  });
});
