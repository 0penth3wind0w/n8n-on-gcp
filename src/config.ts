import * as pulumi from "@pulumi/pulumi"
import * as gcp from "@pulumi/gcp";

export type ProjectConfig = {
    gcpProjectId: string;
    gcpRegion: string;
    dataBucket: string;
    machineType: string;
    tailscaleAuthKey: string;
    zone: string;
}

export type N8nConfig = {
    enable: boolean;
    host?: string;
    port?: string;
}

const config = new pulumi.Config();

export const projectConfig: ProjectConfig = {
    gcpProjectId: config.get("project") || gcp.config.project || "",
    gcpRegion: config.get("region") || gcp.config.region || "",
    dataBucket: config.get("dataBucket") || "",
    machineType: config.get("machineType") || "",
    tailscaleAuthKey: config.get("tailscaleAuthKey") || "",
    zone: config.get("zone") || ""
};

export const n8nConfig = config.getObject<N8nConfig>("n8n") || {
    enable: false,
};
