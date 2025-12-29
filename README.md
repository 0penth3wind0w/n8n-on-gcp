# n8n-on-gcp

Deploys an n8n instance on Google Cloud Platform (GCP) using Pulumi.

## Prerequisites

- **Pulumi CLI:** [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
- **GCP Account:** A Google Cloud Platform account with a configured project.
- **gcloud CLI:** [Install and authenticate gcloud CLI](https://cloud.google.com/sdk/docs/install)
- **Google Cloud Project** Create Project on GCP
- **Google Cloud Storage (GCS) Bucket:** Create a GCS bucket for Pulumi state storage before deployment.
- **Enable API:** Enable the following API on GCP to deploy the infra
    - Compute Engine API
- **Tailscale Account:** Tailscale account for accessing n8n web console

## Configuration

1. **Obtain TailScale Auth Key**

    Get the Key from [Tailscale setting page](https://login.tailscale.com/admin/settings/keys)

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Configure Pulumi Backend (Recommended):**

    Add or verify the `backend` section in `Pulumi.yaml` to store state in GCS:

    **Important:** Ensure the GCS bucket exists.

    ```yaml
    # Pulumi.yaml
    name: n8n-on-gcp
    runtime: nodejs
    description: A Pulumi project to deploy n8n on Google Cloud Platform

    backend:
      url: gs://REPLACE_WITH_YOUR_GCS_BUCKET_NAME 
    ```

4. **Set Project Configuration:**

    Use `pulumi stack init <stackName>` to create one

    Update the stack configuration file with correct GCP project configuration (refer to `Pulumi.<stackName>.yaml` for required configuration)

## Deployment

1. **Select your stack:**
    ```bash
    pulumi stack select <stack-name>
    ```

2. **Deploy the infrastructure:**
    ```bash
    pulumi up
    ```
    Review the preview and confirm by selecting `yes`.

## Services

1. **n8n:**
    After deployment, the public IP will be displayed. Access n8n at `http://<tailscale-ip>:5678`.

## Cleanup

To destroy all Pulumi-provisioned resources:

```bash
pulumi destroy
```
Review and confirm by selecting `yes`.

## Note

The instance will advertise itself as tailscale exit node.
You have to approve the exit node in the Tailscale Admin Console to use this function.

- Go to Machines → select the instance → Options → Edit route settings → enable "Use as exit node".


## Troubleshooting

1.  **View the log file on instance:**
    The startup script logs to `/var/log/startup-script.log` on the GCE instance. If n8n isn't running, inspect this log:
    ```bash
    cat /var/log/syslog.log | grep startup
    ```
