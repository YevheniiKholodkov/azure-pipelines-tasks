"use strict";

import taskLib = require('azure-pipelines-task-lib/task');
import toolLib = require('azure-pipelines-tool-lib/tool');
import path = require('path');
import { isLatestVersion, getLatestVersionTag, getKubeloginRelease, downloadKubeloginRelease, unzipRelease, getKubeloginPath, KubeloginRelease, Platform } from './utils';

const TOOL_NAME: string = "Kubelogin";
taskLib.setResourcePath(path.join(__dirname, 'task.json'));

async function run() {
    try {
        let kubeloginVersion: string = taskLib.getInput('kubeloginVersion') || '';

        const isLatest: boolean = isLatestVersion(kubeloginVersion);
        if (isLatest)
        {
            kubeloginVersion = await getLatestVersionTag();
        }

        let kubeloginRelease: KubeloginRelease = await getKubeloginRelease(kubeloginVersion);
        
        console.log(taskLib.loc("Info_KubeloginRelease", kubeloginRelease.name));
        console.log(taskLib.loc("Info_KubeloginPlatform", kubeloginRelease.platform));
        console.log(taskLib.loc("Info_KubeloginVersion", kubeloginRelease.version));
        console.log(taskLib.loc("Info_KubeloginReleaseURL", kubeloginRelease.releaseUrl));

        taskLib.debug('Trying to get tool from local cache first');
        let toolPath: string = toolLib.findLocalTool(TOOL_NAME, kubeloginRelease.version);

        if(toolPath){
            toolPath = path.join(toolPath, kubeloginRelease.name);
            console.log(taskLib.loc("Info_ResolvedToolFromCache", kubeloginRelease.version));
        }
        else {
            toolPath = await downloadKubeloginRelease(kubeloginRelease);
            console.log(taskLib.loc("Info_CachingTool", kubeloginRelease.version));
            toolLib.cacheFile(toolPath, kubeloginRelease.name, TOOL_NAME, kubeloginRelease.version);
        }

        var unzipPath = await unzipRelease(toolPath);
        
        const fileName = kubeloginRelease.platform == 'win-amd64' ? 'kubelogin.exe' : 'kubelogin';
        const filePath = getKubeloginPath(unzipPath, fileName);
        if(filePath == undefined) {
            taskLib.error('kubelogin was not found.')
            return;
        }
        
        toolLib.prependPath(path.dirname(filePath));
    }
    catch (err: any) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function verifyKubelogin() {
    console.log(taskLib.loc("VerifyKubeloginInstallation"));
    var kubectlToolPath = taskLib.which("kubelogin", true);
    var kubectlTool = taskLib.tool(kubectlToolPath);
    kubectlTool.arg("--help");
    return kubectlTool.exec()
}

run()
    .then(() => verifyKubelogin())
    .then(() => taskLib.setResult(taskLib.TaskResult.Succeeded, ""))
    .catch((error) => taskLib.setResult(taskLib.TaskResult.Failed, !!error.message ? error.message : error));