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
      `Generating Azure Devops Pipeline job for ${examplesDir}/${dir}`
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
        if (step.task && step.task.startsWith('InfracostComment')) {
          const path = step.inputs.path;
          const goldenFilePath = `./testdata/${job.job}_comment_golden.md`;

          steps.push(
            {
              bash: `infracost output --path=${path} --format=azure-repos-comment --show-skipped --out-file=/tmp/infracost_comment.md`,
              displayName: 'Generate Infracost comment',
            },
            {
              bash: `diff ${goldenFilePath} /tmp/infracost_comment.md`,
              displayName: 'Check the comment',
            },
          );

          continue;
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
  pr: ['master'],
  variables: {
    'API_KEY': '$(apiKey)'
  },
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
