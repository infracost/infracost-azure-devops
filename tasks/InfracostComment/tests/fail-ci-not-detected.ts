import setupRunner from './mock-helper';

const path = 'example.json';
const taskRunner = setupRunner({ path: path });

taskRunner.registerMock('@infracost/compost', {
  autodetect: (opts?: any) => {
    console.log(`autodetect-opts:${JSON.stringify(opts)}`)

    throw('Unable to detect current environment');
  },
});

taskRunner.setInput('path', path);
taskRunner.run();
