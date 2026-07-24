import * as taskLib from 'azure-pipelines-task-lib/task';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import fetch from 'node-fetch';

const pipeline = promisify(stream.pipeline);

/**
 * downloadTool downloads a tool from the provided URL into the agent temp directory.
 */
export async function downloadTool(url: string): Promise<string> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'infracost-download-'));
  const downloadPath = path.join(tempDir, 'infracost.tar.gz');

  taskLib.debug(`Downloading ${url} to ${downloadPath}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error(`Failed to download ${url}: response body was empty`);
  }

  await pipeline(res.body, fs.createWriteStream(downloadPath));

  return downloadPath;
}

/**
 * extractTar extracts a tarball into a new directory in the agent temp directory.
 */
export async function extractTar(filePath: string): Promise<string> {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'infracost-extract-'));

  taskLib.debug(`Extracting ${filePath} to ${destination}`);

  const returnCode = await taskLib.exec('tar', ['-xzf', filePath, '-C', destination]);
  if (returnCode !== 0) {
    throw new Error(`Error extracting ${filePath}: ${returnCode}`);
  }

  return destination;
}

/**
 * prependPath prepends a directory to PATH for the current and subsequent tasks.
 */
export function prependPath(toolPath: string) {
  taskLib.prependPath(toolPath);
}
