import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";

interface N8nResourceArgs {
    provider: gcp.Provider;
    dataBucket: string;
    machineType: string;
    n8nHost: string;
    n8nPort: string;
    n8nBasicAuthUser: string;
    n8nBasicAuthPassword: string;
    tailscaleAuthKey: string;
    zone: string;
}

export class N8nResource extends pulumi.ComponentResource {
    constructor(name: string, args: N8nResourceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("n8n:infra:N8nResource", name, {}, opts);

        // Validate required string arguments
        const requiredStringArgs = [
            { name: 'dataBucket', value: args.dataBucket },
            { name: 'machineType', value: args.machineType },
            { name: 'n8nHost', value: args.n8nHost },
            { name: 'n8nPort', value: args.n8nPort },
            { name: 'n8nBasicAuthUser', value: args.n8nBasicAuthUser },
            { name: 'n8nBasicAuthPassword', value: args.n8nBasicAuthPassword },
            { name: 'tailscaleAuthKey', value: args.tailscaleAuthKey },
            { name: 'zone', value: args.zone }
        ];

        for (const arg of requiredStringArgs) {
            if (!arg.value || arg.value.trim() === '') {
                throw new Error(`${arg.name} cannot be empty or undefined`);
            }
        }
        
        // Get the directory of this file
        const currentDir = __dirname;

        // docker-compose.yml
        const dockerComposeTemplate = fs.readFileSync(path.join(currentDir, "docker-compose.yml"), "utf8");
        const dockerComposeContent = dockerComposeTemplate
            .replace(/{N8N_HOST}/g, args.n8nHost)
            .replace(/{N8N_PORT}/g, args.n8nPort)
            .replace(/{N8N_BASIC_AUTH_USER}/g, `"${args.n8nBasicAuthUser}"`)
            .replace(/{N8N_BASIC_AUTH_PASSWORD}/g, `"${args.n8nBasicAuthPassword}"`);
        const dockerComposeFile = new gcp.storage.BucketObject("docker-compose.yml", {
            name: "docker-compose.yml",
            content: dockerComposeContent,
            bucket: args.dataBucket,
        });

        const instanceServiceAccount = new gcp.serviceaccount.Account("instance-sa", {
            accountId: "n8n-instance-sa",
            displayName: "n8n Instance Service Account",
        });

        const bucketIamBinding = new gcp.storage.BucketIAMMember("bucket-object-viewer", {
            bucket: args.dataBucket,
            role: "roles/storage.objectViewer",
            member: pulumi.interpolate`serviceAccount:${instanceServiceAccount.email}`,
        });

        const network = new gcp.compute.Network("network", {
            autoCreateSubnetworks: true,
        });

        // Firewall rule to allow incoming traffic to n8n ports
        new gcp.compute.Firewall("ssh-firewall", {
            network: network.selfLink,
            allows: [{
                protocol: "tcp",
                ports: ["22"],
            }],
            sourceRanges: ["35.235.240.0/20"],
            description: "Allow ssh traffic from Google Cloud Console",
        });

        const startupScript = fs.readFileSync(path.join(currentDir, "startup.sh"), "utf8");

        const instance = new gcp.compute.Instance("instance", {
            machineType: args.machineType,
            zone: args.zone,
            bootDisk: {
                initializeParams: {
                    image: "debian-cloud/debian-12",
                },
            },
            networkInterfaces: [{
                network: network.id,
                // accessConfigs must include a single empty config to request an ephemeral IP.
                accessConfigs: [
                    {} // Assign a public IP address
                ], 
            }],
            serviceAccount: {
                email: instanceServiceAccount.email,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"],
            },
            metadataStartupScript: startupScript,
            metadata: {
                GCS_BUCKET: pulumi.interpolate`gs://${args.dataBucket}`,
                TAILSCALE_AUTH_KEY: args.tailscaleAuthKey,
            },
        }, {
            provider: args.provider,
            dependsOn: [bucketIamBinding, dockerComposeFile],
        });

        this.registerOutputs({
            instanceName: instance.name,
            serviceAccountEmail: instanceServiceAccount.email,
            bucketName: args.dataBucket,
        });
    }
};
