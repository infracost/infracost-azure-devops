import taskLib = require('azure-pipelines-task-lib/task');
import compost, { PostBehavior, TargetType } from '@infracost/compost';
import { promises as fsPromises } from 'fs';

/**
 * setEnvVariable sets ENV variable.
 *
 * @param name - ENV variable name
 * @param value - ENV variable value
 */
function setEnvVariable(name: string, value: string, isSecret: boolean = false) {
  process.env[name] = value;

  const debugValue = isSecret ? '************' : value;
  taskLib.debug(`set env var ${name}=${debugValue}`);
}

/**
 * generateOutput() creates a formatted comment body and saves it to a temporary
 * file. Returns the file path.
 *
 * @param path - path input
 * @param format - comment format
 * @param behavior - post behavior, used by `infracost output` command
 * @return the saved file path
 */
async function generateOutput(path: string, format: string, behavior: string): Promise<string> {
  const outputFile = 'infracost-comment.md';

  let pathList: string[] | string;
  try {
    pathList = JSON.parse(path);

    if (typeof(pathList) === 'string') {
      pathList = [path];
    }
  } catch(error) {
    if (error instanceof SyntaxError) {
      pathList = [path];
    } else {
      throw error;
    }
  }
  const pathArgs = pathList.map(path => `-path=${path}`);

  setEnvVariable('INFRACOST_CI_POST_CONDITION', behavior);

  const resultCode = await taskLib.exec(
    'infracost',
    [
      'output',
      ...pathArgs,
      `--format=${format}`,
      `--out-file=${outputFile}`,
      '--show-skipped',
    ].join(' '),
  );

  if (resultCode !== 0) {
    throw new Error(`infracost output command failed with code ${resultCode}`);
  }

  return outputFile;
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
 * RepoProvider defines an interface for repository provider settings
 */
interface RepoProvider {
  inputToken: string,
  envVariable: string,
  commentFormat: string,
}

/**
 * supportedRepoProviders defines settings for supported repository providers
 */
const supportedRepoProviders: { [name: string]: RepoProvider } = {
  'GitHub': {
    inputToken: 'githubToken',
    envVariable: 'GITHUB_TOKEN',
    commentFormat: 'github-comment',
  },
  'TfsGit': {
    inputToken: 'azureReposToken',
    envVariable: 'SYSTEM_ACCESSTOKEN',
    commentFormat: 'azure-repos-comment',
  },
}

/**
 * setupRepoProvider() detects the repository provider and configures the task with it.
 *
 * @return repo provider
 */
function setupRepoProvider(): RepoProvider {
  const env = taskLib.getVariable('BUILD_REPOSITORY_PROVIDER') ?? '';
  const provider = supportedRepoProviders[env];

  if (!provider) {
    throw new Error(`Unsupported repo provider: ${env}.`);
  }

  const token = taskLib.getInput(provider.inputToken) ?? '';
  if (token === '') {
    throw new Error(`Input required: ${provider.inputToken}`);
  }

  setEnvVariable(provider.envVariable, token, true);

  if (taskLib.getVariable('System.Debug') === 'true') {
    setEnvVariable("DEBUG", "*")
  }

  return provider;
}

/**
 * run() is a main entrypoint of the InfracostComment task.
 * It generates a comment body using previously installed `infracost` CLI tool
 * and posts it to the repository.
 */
async function run() {
  try {
    // Collect inputs
    const path: string = taskLib.getInput('path', true) ?? '';

    const behavior: string = taskLib.getInput('behavior') ?? 'update';
    const targetType: string = taskLib.getInput('targetType') ?? 'pull-request';
    const tag: string | undefined = taskLib.getInput('tag');
    const dryRun = taskLib.getBoolInput('dryRun');

    // Detect repo provider
    const repoProvider = setupRepoProvider();

    // Generate a comment
    const outputFile = await generateOutput(path, repoProvider.commentFormat, behavior);
    const data = await fsPromises.readFile(outputFile);
    const comment = formatOutput(data.toString(), targetType, behavior);

    // Send the comment
    const platform = compost.autodetect({
      logger: console,
      tag,
      dryRun,
      targetType: targetType as TargetType,
    });
    const postBehavior = behavior as PostBehavior;

    if (platform) {
      await platform.postComment(postBehavior, comment);
    }
  } catch (e: any) {
    let message = 'Failed to post a comment';

    if (e instanceof Error) {
      message = `${message}: ${e.message}`;
    } else {
      message = `${message}: ${e}`;
    }

    taskLib.setResult(taskLib.TaskResult.Failed, message);
  }
}

run();
