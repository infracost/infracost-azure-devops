import taskLib = require('azure-pipelines-task-lib/task');
import compost from '@infracost/compost';
import { PostBehavior, TargetType } from '@infracost/compost';
import { promises as fsPromises } from 'fs';

/**
 * generateOutput() creates a formatted comment body and saves it to a temporary
 * file. Returns the file path.
 *
 * @param path - path input
 * @param format - comment format
 * @param behavior - post behavior, used by `infracost output` command
 * @return the saved file path
 */
function generateOutput(path: string, format: string, behavior: string): string {
  const outputFile = '/tmp/infracost-comment.md';

  let pathList: string[];
  try {
    pathList = JSON.parse(path);
  } catch(error) {
    if (error instanceof SyntaxError) {
      pathList = [path];
    } else {
      throw error;
    }
  }
  const pathArgs = pathList.map(path => `--path ${path}`);

  taskLib.setVariable('INFRACOST_CI_POST_CONDITION', behavior);

  const result = taskLib.execSync(
    'infracost',
    [
      'output',
      ...pathArgs,
      `--format ${format}`,
      `--out-file ${outputFile}`,
      '--show-skipped',
    ].join(' ')
  );

  return result.code === 0 ? outputFile : '';
}

/**
 * feedbackLink() returns an anchor HTML tag with feedback URL.
 *
 * @param value - feedback answer
 * @param label - value's display name
 * @return a generated anchor HTML tag
 */
function feedbackLink(value: string, label: string): string {
  return `<a href=\"https://www.infracost.io/feedback/submit/?value=${value}\" rel=\"noopener noreferrer\" target=\"_blank\">${label}</a>`;
};

/**
 * formatOutput() returns a generated comment body updated with additional notes.
 *
 * @param output - comment body
 * @param format - comment format
 * @param behavior - post behavior, used by `infracost output` command
 * @return formatted coment
 */
function formatOutput(output: string, targetType: string, behavior: string): string {
  let note = '';

  if (targetType !== 'commit') {
    switch (behavior) {
      case ('update'):
        note = 'This comment will be updated when the cost estimate changes.';
        break;
      case ('delete-and-new'):
        note = 'This comment will be replaced when the cost estimate changes.';
        break;
    }
  }

  if (note !== '') {
    output += `\n${note}\n\n`;
  }

  output += `<sub>\n  Is this comment useful? ${feedbackLink("yes", "Yes")}, ${feedbackLink("no", "No")}\n<sub>\n`;

  return output;
}

/**
 * run() is a main entrypoint of the InfracostComment task.
 * It generates a comment body using previously installed `infracost` CLI tool
 * and posts it to the repository.
 */
async function run() {
  const githubProvider = 'GitHub';
  const azureProvider = 'TfsGit';

  try {
    // Collect inputs
    const path: string = taskLib.getInput('path', true) ?? '';
    const behavior: string = taskLib.getInput('behavior') ?? 'update';
    const targetType: string = taskLib.getInput('targetType') ?? 'pull-request';
    const tag: string | undefined = taskLib.getInput('tag');
    const dryRun = taskLib.getBoolInput('dryRun');

    const repoProvider = taskLib.getVariable('BUILD_REPOSITORY_PROVIDER');

    if (repoProvider === azureProvider && targetType === 'commit') {
      const failMessage = 'Azure DevOps Repos only support pull-request targetType';
      taskLib.setResult(taskLib.TaskResult.Failed, failMessage);
      return;
    }

    // Detect comment format
    let format = 'azure-repos-comment';
    if (repoProvider === githubProvider) {
      format = 'github-comment';
    }

    // Generate a comment
    const outputFile = generateOutput(path, format, behavior);
    const data = await fsPromises.readFile(outputFile);
    const comment = formatOutput(data.toString(), targetType, behavior);

    // Send the comment
    const platform = compost.autodetect({
      logger: console,
      tag: tag,
      dryRun: dryRun,
      targetType: targetType as TargetType,
    });
    const postBehavior = behavior as PostBehavior;

    if (platform) {
      platform.postComment(postBehavior, comment);
    }
  } catch (e) {
    let message = 'failed to post a comment';

    if (e instanceof Error) {
      message = e.message;
    }

    taskLib.setResult(taskLib.TaskResult.Failed, message);
  }
}

run();