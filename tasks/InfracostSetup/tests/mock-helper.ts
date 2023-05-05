import MockAnswer = require('azure-pipelines-task-lib/mock-answer');
import MockRun = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

interface MockHelperOptions {
  apiKey?: string,
  version?: string,
  pricingApiEndpoint?: string,
  currency?: string,
  platform?: 'darwin' | 'linux' | 'win32',
  arch?: 'x32' | 'x64' | 'arm' | 'arm64',
}

export default function setupRunner(opts: MockHelperOptions): MockRun.TaskMockRunner {
  const taskPath = path.join(__dirname, '..', 'index.js');
  const taskRunner: MockRun.TaskMockRunner = new MockRun.TaskMockRunner(taskPath);

  const osPlatform = opts.platform ?? 'linux';
  const osArch = opts.arch ?? 'x64';

  const os = require('os');
  const osClone = Object.assign({}, os);
  osClone.platform = (): string => {
    console.log(`[mock os] platform ${osPlatform}`);
    return osPlatform;
  };
  osClone.arch = (): string => {
    console.log(`[mock os] arch ${osArch}`);
    return osArch;
  },
  taskRunner.registerMock('os', osClone);

  taskRunner.registerMock('node-fetch', (url: string) => {
    console.log(`[mock node-fetch] fetch ${url}`);
    return {
      json: () => [{ name: 'v0.9.15' }, { name: 'v0.9.16' }, { name: 'v0.9.17' }],
    };
  });

  taskRunner.registerMock('azure-pipelines-tool-lib/tool', {
    downloadTool: (url: string): string => {
      console.log(`[mock tool-lib] downloadTool ${url}`);
      return 'mocked-path-to-downloaded-file';
    },
    extractTar: (filePath: string): string => {
      console.log(`[mock tool-lib] extractTar ${filePath}`);
      return 'mocked-path-to-extracted-file';
    },
    prependPath: (filePath: string) => {
      console.log(`[mock tool-lib] prependPath ${filePath}`);
    },
  });

  process.env['BUILD_REPOSITORY_URI'] = 'http://test-setup-repo-uri.com';
  const stubbedCommands: MockAnswer.TaskLibAnswers = <MockAnswer.TaskLibAnswers>{
    'which': { 'infracost': 'infracost' },
    'checkPath': { 'infracost': true },
    'exec': {
      [`infracost configure set api_key ${opts.apiKey}`]: {
        'code': 0,
        'stdout': `[mock infracost] configure set api_key ${opts.apiKey}`,
        'stderr': '',
      },
      [`infracost configure set pricing_api_endpoint ${opts.pricingApiEndpoint}`]: {
        'code': 0,
        'stdout': `[mock infracost] configure set pricing_api_endpoint ${opts.pricingApiEndpoint}`,
        'stderr': '',
      },
      [`infracost configure set currency ${opts.currency}`]: {
        'code': opts.currency === 'invalid-option' ? 1 : 0,
        'stdout': `[mock infracost] configure set currency ${opts.currency}`,
        'stderr': '',
      },
    },
  };

  taskRunner.setAnswers(stubbedCommands);

  return taskRunner;
}
