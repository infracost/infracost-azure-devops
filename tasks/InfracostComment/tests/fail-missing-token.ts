import setupRunner from './mock-helper';

const path = 'example-path.json'

const taskRunner = setupRunner({ path: path });

taskRunner.setInput('path', path);
// not setting tokens

taskRunner.run();
