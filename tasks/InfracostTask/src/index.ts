import tasks = require("azure-pipelines-task-lib/task");
import { IExecOptions, ToolRunner } from "azure-pipelines-task-lib/toolrunner";
import * as VSS from "azure-devops-node-api";
import { JSDOM } from "jsdom";

import fs = require("fs");
import path = require("path");
import stream = require("stream");
import he = require("he");

async function run() {
  tasks.setResourcePath(path.join(__dirname, "..", "task.json"));

  try {
    let infracostPath;
    try {
      infracostPath = tasks.which("infracost", true);
    } catch (err) {
      throw new Error(tasks.loc("InfracostToolNotFound"));
    }

    let infrcostToolRunner: ToolRunner = tasks.tool(infracostPath);
    let command = tasks.getInput("command", true);
    infrcostToolRunner.arg(command);

    let opts = tasks.getInput("commandOptions", false);
    if (opts) {
      infrcostToolRunner.line(opts);
    }

    let file = tasks.getInput("outputFile", false);
    let outputFs: stream.Writable = null;
    if (file && command === "output") {
      outputFs = fs.createWriteStream(file);
    }

    let returnCode = await infrcostToolRunner.exec(<IExecOptions>{
      cwd: tasks.getInput("workingDirectory", true),
      outStream: outputFs,
    });

    if (command === "output") {
      var html = fs.readFileSync(file).toString();
      const pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
      const array_matches = pattern.exec(html);

      await saveOutput(
        tasks.getVariable("System.TeamFoundationCollectionUri"),
        tasks.getVariable("System.AccessToken"),
        tasks.getVariable("Build.SourceVersion"),
        {
          id: tasks.getVariable("Build.SourceVersion"),
          report: he.encode(array_matches[0]),
        }
      );
    }

    if (returnCode > 0) {
      tasks.setResult(
        tasks.TaskResult.Failed,
        tasks.loc("InfracostToolNonZeroExit")
      );
    }
    tasks.setResult(tasks.TaskResult.Succeeded, "");
  } catch (error) {
    tasks.setResult(tasks.TaskResult.Failed, error);
  }
}

const saveOutput = async (
  organization: string,
  token: string,
  id: string,
  document: any
): Promise<void> => {
  const api = VSS.WebApi.createWithBearerToken(organization, token);
  const data = await api.getExtensionManagementApi();
  var doc = await data.getDocumentByName(
    "infracost",
    "infracost-devops-extension",
    "Default",
    "Current",
    "PR",
    id
  );
  if (!doc) {
    doc = await data.createDocumentByName(
      document,
      "infracost",
      "infracost-devops-extension",
      "Default",
      "Current",
      "PR"
    );
  } else {
    const update = {
      ...document,
      __etag: doc["__etag"],
    };
    doc = await data.updateDocumentByName(
      update,
      "infracost",
      "infracost-devops-extension",
      "Default",
      "Current",
      "PR"
    );
  }

  if (doc) {
    console.log("Doc id: " + doc.id);
  }
};

run();
