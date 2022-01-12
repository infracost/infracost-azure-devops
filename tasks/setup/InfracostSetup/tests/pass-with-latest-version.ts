import setupRunner from './mock-helper';

const apiKey = 'test-api-key';
const version = 'latest';

const taskRunner = setupRunner({ apiKey, version });

taskRunner.setInput('apiKey', apiKey);
taskRunner.setInput('version', version);

taskRunner.run();
