import setupRunner from './mock-helper';

const path = 'example-path.json'

const taskRunner = setupRunner({ path: path });

taskRunner.setInput('path', path);

if (process.env['BUILD_REPOSITORY_PROVIDER'] === 'GitHub') {
  taskRunner.setInput('githubToken', 'github-token');
} else {
  taskRunner.setInput('azureReposToken', 'azure-repos-token');
}

taskRunner.run();
