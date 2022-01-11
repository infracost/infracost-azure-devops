import setupRunner from './mock-helper';

const path = 'invalid';
const taskRunner = setupRunner({ path: path });

taskRunner.setInput('path', path);
taskRunner.run();
