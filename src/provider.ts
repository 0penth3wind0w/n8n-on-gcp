import * as gcp from "@pulumi/gcp";
import { projectConfig } from "./config";

export const gcpProvider = new gcp.Provider("gcp-provider", {
    project: projectConfig.gcpProjectId,
    region: projectConfig.gcpRegion,
});
