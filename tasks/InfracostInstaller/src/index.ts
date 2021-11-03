import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import path = require('path');
import * as installer from './installer';

async function configureInfracost() {
    let inputVersion = tasks.getInput("infracostVersion", true);
    let infracostPath = await installer.download(inputVersion);
    let envPath = process.env['PATH'];

    // Prepend the tools path. Instructs the agent to prepend for future tasks
    if (envPath && !envPath.startsWith(path.dirname(infracostPath))) {
        tools.prependPath(path.dirname(infracostPath));
    }
}

async function verifyInfracost() {
    console.log(tasks.loc("VerifyInfracostInstallation"));
    let path = tasks.which("infracost", true);
    let infracost : ToolRunner = tasks.tool(path);
    infracost.arg("--version");
    return infracost.exec();
}

async function run() {
    tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

    try {
        await configureInfracost();
        await verifyInfracost();
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();