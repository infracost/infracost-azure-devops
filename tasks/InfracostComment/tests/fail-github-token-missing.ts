import setupRunner from './mock-helper';

process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub';

const path = 'example-path.json'

const taskRunner = setupRunner({ path: path });

taskRunner.setInput('path', path);
// not setting 'githubToken'

taskRunner.run();
