import setupRunner from './mock-helper';

const path = 'example.json';
const taskRunner = setupRunner({ path: path });

taskRunner.registerMock('@infracost/compost', {
  autodetect: (opts?: any) => {
    console.log(`[mock compost] autodetect tag ${opts.tag}`)
    console.log(`[mock compost] autodetect targetType ${opts.targetType}`)
    console.log(`[mock compost] autodetect dryRun ${opts.dryRun}`)

    throw('Unable to detect current environment');
  },
});

taskRunner.setInput('path', path);
taskRunner.setInput('githubToken', 'github-token');

taskRunner.run();
