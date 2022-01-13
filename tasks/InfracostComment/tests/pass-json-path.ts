import setupRunner from './mock-helper';

const path = '["example1.json", "example2.json"]'
const taskRunner = setupRunner({ path: path, pathItems: ['example1.json', 'example2.json'] });

taskRunner.setInput('path', path);
taskRunner.setInput('githubToken', 'github-token');

taskRunner.run();
