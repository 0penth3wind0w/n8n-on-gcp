import { projectConfig } from "./src/config"
import { gcpProvider } from "./src/provider"
import { N8nResource } from "./src/infra/n8n"

const project = projectConfig;
console.log(project)

const n8n = new N8nResource("n8n", {
    provider: gcpProvider,
    dataBucket: projectConfig.dataBucket,
    machineType: "e2-micro",
    n8nHost: projectConfig.n8nHost,
    n8nPort: projectConfig.n8nPort,
    tailscaleAuthKey: projectConfig.tailscaleAuthKey,
    zone: "us-central1-a",
});

export const n8nResource = n8n;
// console.log(`Using project: ${projectId}, region: ${region}, machine type: ${machineType}, data bucket: ${dataBucket}`);

