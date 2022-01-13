import setupRunner from './mock-helper';

const apiKey = 'test-api-key';
const pricingApiEndpoint = 'http://example.com';
const currency = 'EUR';
const enableDashboard = 'true';

const taskRunner = setupRunner({ apiKey, pricingApiEndpoint, currency, enableDashboard });

taskRunner.setInput('apiKey', apiKey);
taskRunner.setInput('pricingApiEndpoint', pricingApiEndpoint);
taskRunner.setInput('currency', currency);
taskRunner.setInput('enableDashboard', enableDashboard);

taskRunner.run();
