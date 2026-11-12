import setupRunner from './mock-helper';

const apiKey = 'test-api-key';
const version = '>=0.9';

const taskRunner = setupRunner({ apiKey, version, releases: ['v0.9.17', 'v0.10.47', 'v2.18.3'] });

taskRunner.setInput('apiKey', apiKey);
taskRunner.setInput('version', version);

taskRunner.run();
