import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import * as taskLib from 'azure-pipelines-task-lib/task';

import {
  initTaskTests,
  setAnswears,
  registerMockedArtifactEngine,
  registerMockedOctokitRest,
  registerMockedToolRunner,
  registerMockedToolLibTools
} from './TestHelper';

const taskPath = path.join(__dirname, '..', 'kubelogin.js');
const tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

initTaskTests(taskLib);
setAnswears(tr);
registerMockedToolRunner(tr);
registerMockedOctokitRest(tr);
registerMockedToolLibTools(tr);

tr.setInput('kubeloginVersion', 'latest');

tr.run();
