import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";
import { N8nConfig } from "../config";

interface WorkspaceResourceArgs {
  provider: gcp.Provider;
  zone: string;
  dataBucket: string;
  machineType: string;
  tailscaleAuthKey: string;
  n8n: N8nConfig;
}

export class WorkspaceResource extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: WorkspaceResourceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("project:infra:WorkspaceResource", name, {}, opts);

    // Get the directory of this file
    const currentDir = __dirname;

    // n8n
    let n8nDockerComposeFile: gcp.storage.BucketObject | undefined = undefined;
    const n8nConfig = args.n8n;
    if (n8nConfig.enable) {
      const dockerComposeTemplate = fs.readFileSync(
        path.join(currentDir, "n8n", "docker-compose.yml"),
        "utf8"
      );

      const dockerComposeContent = dockerComposeTemplate
        .replace(/{N8N_HOST}/g, n8nConfig.host!)
        .replace(/{N8N_PORT}/g, n8nConfig.port!);

      n8nDockerComposeFile = new gcp.storage.BucketObject(
        "docker-compose.yml",
        {
          name: "docker-compose.yml",
          content: dockerComposeContent,
          bucket: args.dataBucket,
        }
      );
    }

    const instanceServiceAccount = new gcp.serviceaccount.Account(
      "instance-sa",
      {
        accountId: "workspace-instance-sa",
        displayName: "Personal Workspace Instance Service Account",
      }
    );

    const bucketIamBinding = new gcp.storage.BucketIAMMember(
      "bucket-object-viewer",
      {
        bucket: args.dataBucket,
        role: "roles/storage.objectViewer",
        member: pulumi.interpolate`serviceAccount:${instanceServiceAccount.email}`,
      }
    );

    const network = new gcp.compute.Network("network", {
      autoCreateSubnetworks: true,
    });

    // Firewall rule to allow incoming traffic to n8n ports
    new gcp.compute.Firewall("ssh-firewall", {
      network: network.selfLink,
      allows: [
        {
          protocol: "tcp",
          ports: ["22"],
        },
      ],
      sourceRanges: ["35.235.240.0/20"],
      description: "Allow ssh traffic from Google Cloud Console",
    });

    const startupScript = fs.readFileSync(
      path.join(currentDir, "startup.sh"),
      "utf8"
    );

    const instance = new gcp.compute.Instance(
      "instance",
      {
        machineType: args.machineType,
        zone: args.zone,
        bootDisk: {
          initializeParams: { image: "debian-cloud/debian-13" },
        },
        networkInterfaces: [
          {
            network: network.id,
            // accessConfigs must include a single empty config to request an ephemeral IP.
            accessConfigs: [
              {}, // Assign a public IP address
            ],
          },
        ],
        serviceAccount: {
          email: instanceServiceAccount.email,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
        metadataStartupScript: startupScript,
        metadata: {
          GCS_BUCKET: pulumi.interpolate`gs://${args.dataBucket}`,
          TAILSCALE_AUTH_KEY: args.tailscaleAuthKey,
          N8N_ENABLED: n8nConfig.enable ? "true" : "false",
        },
      },
      {
        provider: args.provider,
        dependsOn: [
          bucketIamBinding,
          ...(n8nDockerComposeFile ? [n8nDockerComposeFile] : []),
        ],
      }
    );

    this.registerOutputs({
      instanceName: instance.name,
      serviceAccountEmail: instanceServiceAccount.email,
      bucketName: args.dataBucket,
    });
  }
}
