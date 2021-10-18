import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const infracostToolName = "infracost";
const extension = (platform: string) => platform === "windows" ? ".exe" : "";

const cleanVersion = (inputVersion: string) :string => {
    let version = tools.cleanVersion(inputVersion);
    if (!version) {
        throw new Error(tasks.loc("InputVersionNotValidSemanticVersion", inputVersion));
    }

    return version;
}

const getPlatform = (): string => {
    switch(os.type()) {
        case "Darwin":
            return "darwin";
        case "Linux":
            return "linux";
        case "Windows_NT":
            return "windows";
        default:
            throw new Error(tasks.loc("OperatingSystemNotSupported", os.type()));
    }
}

const getArchitecture = (): string => {
    switch(os.arch()) {
        case "x64":
            return "amd64";
        default:
            throw new Error(tasks.loc("ArchitectureNotSupported", os.arch()));
    }
}

const checkCache = async (platform: string, architecture: string, version: string): Promise<string> => {
    let localPath = tools.findLocalTool(infracostToolName, version);
    if (!localPath) {
        let url = `https://github.com/infracost/infracost/releases/download/v${version}/infracost-${platform}-${architecture}.tar.gz`;
        let fileName = `${infracostToolName}-${version}-${uuidV4()}.tar.gz`;
        let downloadPath;

        try {
            downloadPath = await tools.downloadTool(url, fileName);
        } catch (exception) {
            throw new Error(tasks.loc("InfracostDownloadFailed", url, exception));
        }

        let unzippedPath = await tools.extractTar(downloadPath);
        if (platform !== "windows") {
            fs.renameSync(path.join(unzippedPath,`infracost-${platform}-${architecture}`), path.join(unzippedPath, infracostToolName));
        }
        
        localPath = await tools.cacheDir(unzippedPath, infracostToolName, version);
    }

    return localPath;
}

const getExecutable = (platform: string, rootFolder: string): string => {
    let terraformPath = path.join(rootFolder, infracostToolName + extension(platform));
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, terraformPath, rootFolder);
    return matchingResultFiles[0];
}

export const download = async (inputVersion: string): Promise<string> => {
    
    let platform = getPlatform();
    let architecture = getArchitecture();
    let version = cleanVersion(inputVersion);

    
    let cachedPath = await checkCache(platform, architecture, version);
    let path = getExecutable(platform, cachedPath);
    if (!path) {
        throw new Error(tasks.loc("InfracostNotFoundInFolder", cachedPath));
    }

    if (platform !== "windows") {
        fs.chmodSync(path, "777");
    }

    tasks.setVariable('InfracostLocation', path);

    return path;
}


