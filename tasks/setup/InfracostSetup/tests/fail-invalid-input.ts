import setupRunner from './mock-helper';

const apiKey = 'test-api-key';
const currency = 'invalid-option';

const taskRunner = setupRunner({ apiKey, currency });

taskRunner.setInput('apiKey', apiKey);
taskRunner.setInput('currency', currency);

taskRunner.run();
