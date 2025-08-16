import * as pulimi from "@pulumi/pulumi"
import * as gcp from "@pulumi/gcp";

export type ProjectConfig = {
    gcpProjectId: string;
    gcpRegion: string;
    dataBucket: string;
    machineType: string;
    n8nHost: string;
    n8nPort: string;
    n8nBasicAuthUser: string;
    n8nBasicAuthPassword: string;
    tailscaleAuthKey: string;
    zone: string;
}

const config = new pulimi.Config();

export const projectConfig: ProjectConfig = {
    gcpProjectId: config.get("project") || gcp.config.project || "",
    gcpRegion: config.get("region") || gcp.config.region || "",
    dataBucket: config.get("dataBucket") || "",
    machineType: config.get("machineType") || "",
    n8nHost: config.get("n8nHost") || "",
    n8nPort: config.get("n8nPort") || "",
    n8nBasicAuthUser: config.get("n8nBasicAuthUser") || "",
    n8nBasicAuthPassword: config.get("n8nBasicAuthPassword") || "",
    tailscaleAuthKey: config.get("tailscaleAuthKey") || "",
    zone: config.get("zone") || ""
};
