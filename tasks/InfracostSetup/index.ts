import * as taskLib from 'azure-pipelines-task-lib/task';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as path from 'path';
import * as os from 'os';
import * as semver from 'semver';
import fetch from 'node-fetch';

/**
 * archMappings defines how different https://nodejs.org/api/os.html#os_os_arch
 * should be represented in terms of the Infracost CLI assets.
 */
const archMappings: { [s: string]: string } = {
  x64: 'amd64',
};

/**
 * mapArch() returns a string of the correct binary arch to use in the pipeline.
 *
 * @param arch - the os architecture, arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
 */
function mapArch(arch: string): string {
  return archMappings[arch] || arch;
}

/**
 * osMappings() defines how different https://nodejs.org/api/os.html#os_os_platform
 * should be represented in terms of the Infracost CLI assets.
 */
const osMappings: { [s: string]: string } = {
  win32: 'windows',
};

/**
 * mapOS() returns a string of the correct binary os to use in the pipeline.
 *
 * @param os
 */
function mapOS(os: string): string {
  return osMappings[os] || os;
}

/**
 * DownloadObject holds information about the url to download an Infracost binary from and which binaryName to use.
 */
interface DownloadObject {
  url: string;
  binaryName: string;
}

/**
 * getDownloadObject() returns a Download object with the correct download url and name set.
 *
 * @param version - the semantic version of Infracost CLI to use
 */
function getDownloadObject(version: string): DownloadObject {
  let path = `releases/download/v${version}`;
  if (version === 'latest') {
    path = `releases/latest/download`;
  }

  const platform = os.platform();
  const filename = `infracost-${mapOS(platform)}-${mapArch(os.arch())}`;
  const binaryName = platform === 'win32' ? 'infracost.exe' : filename;
  const url = `https://github.com/infracost/infracost/${path}/${filename}.tar.gz`;

  return {
    url,
    binaryName,
  };
}

/**
 * addBinaryToPath adds the cli into the pipeline tool path. This enables it for use in subsequent steps.
 * If the binary is windows specific, it will rename infracost-<platform>-<arch> to infracost.
 *
 * @param pathToCLI - the full path to the cli executable
 * @param binaryName - the binary name to use in the subsequent pipeline steps
 */
function addBinaryToPath(pathToCLI: string, binaryName: string) {
  if (!binaryName.endsWith('.exe')) {
    const source = path.join(pathToCLI, binaryName);
    const target = path.join(pathToCLI, 'infracost');
    taskLib.debug(`Moving ${source} to ${target}.`)

    try {
      taskLib.mv(source, target)
    } catch (e) {
      taskLib.error(`Unable to move ${source} to ${target}.`);
      throw e;
    }
  }

  toolLib.prependPath(pathToCLI);
}

/**
 * getVersion() returns a valid version from the task input version. If the input version is invalid it will attempt
 * to find the closest valid version to the input version.
 */
async function getVersion(): Promise<string> {
  const version = taskLib.getInput('version') ?? '';
  if (semver.valid(version)) {
    return semver.clean(version) || version;
  }

  if (!semver.validRange(version)) {
    taskLib.warning(`${version} is not a valid version or range.`);
    return version;
  }

  const max = semver.maxSatisfying(await getAllVersions(), version);
  if (max) {
    return semver.clean(max) || version;
  }

  taskLib.warning(`${version} did not match any release version.`);
  return version;
}

/**
 * ConfigOption is an interface defining an input option that the InfracostSetup task can take.
 */
interface ConfigOption {
  inputName: string
  configName: string
  required: boolean
  type: string
}

/**
 * options defines a list of defined InfracostSetup task options. Defining how they correspond to CLI configurations.
 */
const options: ConfigOption[] = [
  {
    inputName: 'apiKey',
    configName: 'api_key',
    required: true,
    type: 'string'
  },
  {
    inputName: 'currency',
    configName: 'currency',
    required: false,
    type: 'string'
  },
  {
    inputName: 'pricingApiEndpoint',
    configName: 'pricing_api_endpoint',
    required: false,
    type: 'string'
  },
  {
    inputName: 'enableDashboard',
    configName: 'enable_dashboard',
    required: false,
    type: 'boolean'
  }
];

/**
 * configureInfracost sets the OPTIONS on the Infracost CLI
 */
async function configureInfracost() {
  for (const opt of options) {
    let value: any;

    if (opt.type == 'boolean') {
      value = taskLib.getBoolInput(opt.inputName, opt.required);
    } else {
      value = taskLib.getInput(opt.inputName, opt.required);
    }

    if (value) {
      await setConfig(opt.configName, value);
    }
  }
}

/**
 * setConfig() configures the Infracost executable with provided values. If the CLI returns a non-zero exit code this
 * function throws an Error.
 *
 * @param opt - the config option to set
 * @param value - the value of the option to set
 */
async function setConfig(opt: string, value: any) {
  const returnCode = await taskLib.exec('infracost', [
    'configure',
    'set',
    opt,
    value
  ]);

  if (returnCode !== 0) {
    throw new Error(
      `Error running infracost configure set ${opt}: ${returnCode}`
    );
  }
}

/**
 * getAllVersions returns a list of valid versions as a strings.
 */
async function getAllVersions(): Promise<string[]> {
  const releases = await getReleases('infracost', 'infracost')

  return releases.filter((value: Release): boolean => {
    return value.name != '';
  }).map((value: Release): string => {
    return value.name;
  });
}

/**
 * Release defines the JSON response from get repo releases Github API call.
 */
interface Release {
  name: string;
}

/**
 * getReleases() returns a list of valid Releases for the provided.
 *
 * @param user - the Github user who owns the repo, can be an org
 * @param name - the name of the repo
 */
async function getReleases(user: string, name: string): Promise<Release[]> {
  const url = `https://api.github.com/repos/${user}/${name}/releases`;

  const res = await fetch(url);
  const resJson = await res.json()

  return <Release[]>resJson;
}

/**
 * downloadTool() downloads the CLI asset at the given version. It then extracts the tar and prepends
 * the CLI to the pipeline tool path. This allows the `infracost` executable to be present for all subsequent
 * steps in the pipeline.
 *
 * @param version - a valid semantic version string of the Infracost CLI
 */
async function downloadTool(version: string) {
  const download = getDownloadObject(version);

  const pathToTarball: string = await toolLib.downloadTool(download.url);
  const pathToCLI: string = await toolLib.extractTar(pathToTarball);

  addBinaryToPath(pathToCLI, download.binaryName);
}

/**
 * exportEnvVars() sets Infracost specific env vars which are available to other pipeline steps/tasks.
 */
function exportEnvVars() {
  taskLib.setVariable('INFRACOST_AZURE_DEVOPS_PIPELINE', 'true')
  taskLib.setVariable('INFRACOST_SKIP_UPDATE_CHECK', 'true');

  const repoUrl = taskLib.getVariable('Build.Repository.Uri');
  if (repoUrl) {
    taskLib.setVariable('INFRACOST_VCS_REPOSITORY_URL', repoUrl);
  }
  
  const logLevel = taskLib.getVariable('System.Debug') === 'true' ? 'debug' : 'info';
  taskLib.setVariable('INFRACOST_LOG_LEVEL', logLevel)
}

/**
 * run() is the main entrypoint of the InfracostSetup task.
 * It installs the Infracost CLI as a tool to the pipeline.
 */
async function run() {
  try {
    exportEnvVars();

    const version = await getVersion();
    await downloadTool(version);

    await configureInfracost();
  } catch (e) {
    let message = 'could not setup infracost';
    if (e instanceof Error) {
      message = e.message;
    }

    taskLib.setResult(taskLib.TaskResult.Failed, message);
  }
}

run();
