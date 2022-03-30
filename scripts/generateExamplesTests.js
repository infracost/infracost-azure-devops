const fs = require('fs');
const yaml = require('js-yaml');

const testExamplesPipelinePath = './.azure/pipelines/examples-test.yml';
const examplesDir = './examples';
const exampleRegex =
  /\[\/\/\]: <> \(BEGIN EXAMPLE\)\n```.*\n((.|\n)*?)```\n\[\/\/\]: <> \(END EXAMPLE\)/gm;

// Finds all the examples in a file
function extractExamples(file) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(exampleRegex)];
  return matches.map((match) => yaml.load(match[1]));
}

// Extracts all the examples from a directory by reading all the README files
function extractAllExamples(examplesDir) {
  const examples = [];

  for (const dir of fs.readdirSync(examplesDir)) {
    if (!fs.statSync(`${examplesDir}/${dir}`).isDirectory()) {
      continue;
    }

    console.log(
      `Generating Azure Pipelines job for ${examplesDir}/${dir}`
    );

    const filename = `${examplesDir}/${dir}/README.md`;

    try {
      if (!fs.existsSync(filename)) {
        console.error(`Skipping ${dir} since no README.md file was found`);
        continue;
      }

      examples.push(...extractExamples(filename));
    } catch (err) {
      console.error(`Error reading YAML file ${filename}: ${err}`);
    }
  }

  return examples;
}

/**
 * @typedef {Object} Step
 * @property {string} task
 * @property {Object} inputs
 *
 * @typedef {Object} Job
 * @property {Step[]} steps
 *
 * @typedef {Object} Pipeline
 * @property {Job[]} jobs
 *
 */

/**
 * fixupExamples modifies the examples by replacing the InfracostComment task
 * with a step that checks comment contents
 *
 * @param {Pipeline[]} examples
 * @returns {Pipeline[]}
 */
function fixupExamples(examples) {
  for (const example of examples) {
    for (const jobEntry of Object.entries(example.jobs)) {
      const [_, job] = jobEntry;

      const steps = [];

      for (const step of job.steps) {
        if (step.displayName && step.displayName.toLowerCase() === 'post infracost comment') {
          const goldenFilePath = `./testdata/${job.job}_comment_golden.md`;
          const commentArgs = step.bash
            .replace(/\\/g, '')
            .replace(/--pull-request \$\(System\.PullRequest\.PullRequestNumber\)/g, '--pull-request 1')
            .split('\n')
            .map(s => s.trim())
            .filter(e => !e.startsWith('#') && e !== '')

          commentArgs.push('--dry-run true', '> /tmp/infracost_comment.md')
          step.bash = commentArgs.join(' \\\n');

          steps.push(
            step,
            {
              bash: `diff -y ${goldenFilePath} /tmp/infracost_comment.md`,
              displayName: 'Check the comment',
            },
          );

          continue;
        }

        if  (step.displayName && step.displayName === 'Send cost estimate to Slack') {
          const goldenFilePath = `./testdata/${job.job}_slack_message_golden.json`;

          steps.push(
            {
              bash: `diff -y <(jq --sort-keys . ${goldenFilePath}) <(jq --sort-keys . /tmp/slack_message.json)`,
              displayName: 'Check the Slack message',
            },
          );

          continue
        }


        steps.push({
          ...step,
        })
      }

      job.steps = steps;
    }
  }

  return examples;
}

const pipelineSyntax = {
  pr: ['master', 'azure-devops-tasks'],
  name: 'Infracost.InfracostAzureDevops.Examples.Test',
  jobs: [],
};

/**
 * generatePipeline generates the pipeline YAML from the examples
 *
 * @param {Pipeline[]} examples
 * @returns {Pipeline}
 */
function generatePipeline(examples) {
  const pipeline = {...pipelineSyntax};

  for (const example of examples) {
    pipeline.jobs = [
      ...pipeline.jobs,
      ...example.jobs,
    ];
  }

  return pipeline;
}


/**
 * writePipeline writes the generated pipelineYaml to a file;
 *
 * @param {Pipeline} pipelineYaml
 * @param {string} target
 */
function writePipeline(pipelineYaml, target) {
  try {
    fs.writeFileSync(target, yaml.dump(pipelineYaml));
  } catch (err) {
    console.error(`Error writing YAML file: ${err}`);
  }
}

const examples = fixupExamples(
  extractAllExamples(examplesDir)
);

writePipeline(
  generatePipeline(examples),
  testExamplesPipelinePath
);

console.log('DONE');
