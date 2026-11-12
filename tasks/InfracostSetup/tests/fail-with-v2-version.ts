import setupRunner from './mock-helper';

const apiKey = 'test-api-key';
const version = '2.19.1';

const taskRunner = setupRunner({ apiKey, version });

taskRunner.setInput('apiKey', apiKey);
taskRunner.setInput('version', version);

taskRunner.run();
