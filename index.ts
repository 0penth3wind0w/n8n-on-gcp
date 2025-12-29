import { projectConfig, n8nConfig } from "./src/config"
import { gcpProvider } from "./src/provider"
import { WorkspaceResource } from "./src/infra"

const workspace = new WorkspaceResource("workspace", {
    provider: gcpProvider,
    zone: "us-central1-a",
    dataBucket: projectConfig.dataBucket,
    machineType: "e2-micro",
    tailscaleAuthKey: projectConfig.tailscaleAuthKey,
    n8n: n8nConfig,
});

export const workspaceResource = workspace;
// console.log(`Using project: ${projectId}, region: ${region}, machine type: ${machineType}, data bucket: ${dataBucket}`);
