import setupRunner from './mock-helper';

const taskRunner = setupRunner({});

// path input is not set
taskRunner.run();
