import setupRunner from './mock-helper';

const path = 'example.json'
const taskRunner = setupRunner({ path: path });

taskRunner.setInput('path', path);
taskRunner.setInput('behavior', 'new');
taskRunner.setInput('targetType', 'commit');
taskRunner.setInput('tag', 'test-tag');
taskRunner.setInput('dryRun', 'true');

taskRunner.run();
