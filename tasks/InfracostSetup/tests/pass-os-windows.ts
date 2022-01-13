import setupRunner from './mock-helper';

const apiKey = 'test-api-key';

const platform = 'win32';
const arch = 'x32';

const taskRunner = setupRunner({ apiKey, platform, arch });

taskRunner.setInput('apiKey', apiKey);

taskRunner.run();
