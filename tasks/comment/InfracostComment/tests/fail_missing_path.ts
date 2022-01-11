import MockAnswer = require('azure-pipelines-task-lib/mock-answer');
import MockRun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let taskRunner: MockRun.TaskMockRunner = new MockRun.TaskMockRunner(taskPath);

taskRunner.registerMock('@infracost/compost', {
  autodetect: (_opts?: any) => {
    return {
      postComment: (behavior: any, comment: string) => {
        console.log(`postComment-${behavior}`);
        console.log(`postComment-${comment}`);
      },
    }
  },
});

taskRunner.registerMock('fs', {
  promises: { readFile: (_: any) => { return { toString: () => "foobar"} }},
});

const stubbedCommands: MockAnswer.TaskLibAnswers = <MockAnswer.TaskLibAnswers>{
  "which": { "infracost": "infracost" },
  "checkPath": { "infracost": true },
  "exec": {
    "infracost output --path example-path.json --format github-comment --out-file /tmp/infracost-comment.md --show-skipped": {
      "code": 0,
      "stdout": "successful-infracost-output-github-comment",
      "stderr": "",
    },
    "infracost output --path example-path.json --format azure-devops-comment --out-file /tmp/infracost-comment.md --show-skipped": {
      "code": 0,
      "stdout": "successful-infracost-output-azure-devops-comment",
      "stderr": "",
    },
  },
};

taskRunner.setAnswers(stubbedCommands);

taskRunner.run();
