import * as path from 'path';
import * as assert from 'assert';
import * as MockTest from 'azure-pipelines-task-lib/mock-test';

describe('InfracostComment', function () {
  function expect(validator: () => void, runner: MockTest.MockTestRunner, done: Mocha.Done) {
    try {
      validator();
      done();
    }
    catch (error) {
      console.log("STDERR", runner.stderr);
      console.log("STDOUT", runner.stdout);
      done(error);
    }
  }

  function run(testPath: string): MockTest.MockTestRunner {
    const fullPath = path.join(__dirname, testPath);
    const runner = new MockTest.MockTestRunner(fullPath);

    runner.run();

    return runner;
  }

  beforeEach((done) => {
    process.env['BUILD_REPOSITORY_PROVIDER'] = 'GitHub';

    done();
  });

  after(() => { });

  it('sends comment when repo provider is GitHub', (done: Mocha.Done) => {
    process.env['BUILD_REPOSITORY_PROVIDER'] = 'GitHub';

    const test = run('pass-string-path.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output github-comment'), 'calls infracost output with GitHub format');
      assert.ok(test.stdOutContained('##vso[task.debug]set INFRACOST_CI_POST_CONDITION=update'), 'sets env var with behavior');

      assert.ok(test.stdOutContained('[mock compost] autodetect targetType pull-request'), 'uses default targetType');
      assert.ok(test.stdOutContained('[mock compost] postComment behavior update'), 'uses default behavior');

      assert.ok(test.stdOutContained('This comment will be updated when the cost estimate changes.'), 'adds note');
      assert.ok(test.stdOutContained('Is this comment useful?'), 'adds feedback links');

      assert.ok(test.stdOutContained('[mock compost] postComment body mocked-file:infracost-comment.md'), 'posts comment');

      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('sends comment when repo provider is Azure DevOps', (done: Mocha.Done) => {
    process.env['BUILD_REPOSITORY_PROVIDER'] = 'TfsGit';

    const test = run('pass-string-path.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output azure-devops-comment'), 'calls infracost output with Azure DevOps format');
      assert.ok(test.stdOutContained('##vso[task.debug]set INFRACOST_CI_POST_CONDITION=update'), 'sets env var with behavior');

      assert.ok(test.stdOutContained('[mock compost] autodetect targetType pull-request'), 'uses default targetType');
      assert.ok(test.stdOutContained('[mock compost] postComment behavior update'), 'uses default behavior');

      assert.ok(test.stdOutContained('This comment will be updated when the cost estimate changes.'), 'adds note');
      assert.ok(test.stdOutContained('Is this comment useful?'), 'adds feedback links');

      assert.ok(test.stdOutContained('[mock compost] postComment body mocked-file:infracost-comment.md'), 'posts comment');
      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('sends comment when path is a glob pattern', (done: Mocha.Done) => {
    const test = run('pass-glob-pattern-path.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output github-comment'), 'calls infracost output');
      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('sends comment when path is JSON array', (done: Mocha.Done) => {
    const test = run('pass-json-path.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output github-comment'), 'calls infracost output');
      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('sends comment when optional inputs are provided', (done: Mocha.Done) => {
    const test = run('pass-optional-inputs.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output github-comment'), 'calls infracost output');
      assert.ok(test.stdOutContained('[mock compost] postComment behavior new'), 'uses behavior input');

      assert.ok(test.stdOutContained('[mock compost] autodetect tag test-tag'), 'uses tag input');
      assert.ok(test.stdOutContained('[mock compost] autodetect targetType commit'), 'uses targetType input');
      assert.ok(test.stdOutContained('[mock compost] autodetect dryRun true'), 'uses dryRun input');

      assert.ok(!test.stdOutContained('This comment will be'), 'does not add note');
      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('sends comment with note when new comment is created', (done: Mocha.Done) => {
    const test = run('pass-inputs-new-comment.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('This comment will be replaced when the cost estimate changes.'),
        'uses note for comment creation'
      );
      assert.ok(test.succeeded, 'task succeeded');
    }, test, done);
  });

  it('fails when path is missing', (done: Mocha.Done) => {
    const test = run('fail-missing-path.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('##vso[task.complete result=Failed;]Failed to post a comment: Input required: path'),
          'checks input'
      );
      assert.ok(test.failed, 'task failed');
    }, test, done);
  });

  it('fails when path is invalid', (done: Mocha.Done) => {
    const test = run('fail-invalid-path.js');

    expect(() => {
      assert.ok(test.stdOutContained('[mock infracost] output error'), 'calls infracost output with invalid path');
      assert.ok(test.stdOutContained('Failed to post a comment: infracost failed with return code: 42'), 'handles error');
      assert.ok(test.failed, 'task failed');
    }, test, done);
  });

  it('fails when CI is not detected', (done: Mocha.Done) => {
    const test = run('fail-ci-not-detected.js');

    expect(() => {
      assert.ok(
        test.stdOutContained('##vso[task.complete result=Failed;]Failed to post a comment: Unable to detect current environment'),
          'handles undetected environment'
      );
      assert.ok(test.failed, 'task failed');
    }, test, done);
  });
});
