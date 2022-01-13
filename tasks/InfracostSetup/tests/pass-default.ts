import setupRunner from './mock-helper';

const apiKey = 'test-api-key';

const taskRunner = setupRunner({ apiKey });

taskRunner.setInput('apiKey', apiKey);

taskRunner.run();
