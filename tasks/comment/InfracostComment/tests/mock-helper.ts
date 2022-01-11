import MockAnswer = require('azure-pipelines-task-lib/mock-answer');
import MockRun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

interface MockHelperOptions {
  path?: string,
  pathItems?: string[],
}

export default function setupRunner(opts: MockHelperOptions): MockRun.TaskMockRunner {
  const taskPath = path.join(__dirname, '..', 'index.js');
  const taskRunner: MockRun.TaskMockRunner = new MockRun.TaskMockRunner(taskPath);

  const inputPath: string = opts.path ?? '';
  const pathItems: string[] = opts.pathItems || [inputPath];

  taskRunner.registerMock('@infracost/compost', {
    autodetect: (opts?: any) => {
      console.log(`[mock compost] autodetect tag ${opts.tag}`)
      console.log(`[mock compost] autodetect targetType ${opts.targetType}`)
      console.log(`[mock compost] autodetect dryRun ${opts.dryRun}`)

      return {
        postComment: (behavior: any, comment: string) => {
          console.log(`[mock compost] postComment behavior ${behavior}`);
          console.log(`[mock compost] postComment body ${comment}`);
        },
      }
    },
  });

  taskRunner.registerMock('fs', {
    promises: {
      readFile: (filePath: string) => {
        console.log(`[mock fs] readFile path=${filePath}`);
        return { toString: () => `mocked-file:${filePath}` };
    }},
  });

  const paths = pathItems.map((p) => `--path ${p}`).join(' ');

  const stubbedCommands: MockAnswer.TaskLibAnswers = <MockAnswer.TaskLibAnswers>{
    "which": { "infracost": "infracost" },
    "checkPath": { "infracost": true },
    "exec": {
      [`infracost output ${paths} --format github-comment --out-file infracost-comment.md --show-skipped`]: {
        "code": 0,
        "stdout": "[mock infracost] output github-comment",
        "stderr": "",
      },
      [`infracost output ${paths} --format azure-repos-comment --out-file infracost-comment.md --show-skipped`]: {
        "code": 0,
        "stdout": "[mock infracost] output azure-devops-comment",
        "stderr": "",
      },
      [`infracost output --path invalid --format github-comment --out-file infracost-comment.md --show-skipped`]: {
        "code": 42,
        "stdout": "[mock infracost] output error",
        "stderr": "",
      },
    },
  };

  taskRunner.setAnswers(stubbedCommands);

  return taskRunner;
}
