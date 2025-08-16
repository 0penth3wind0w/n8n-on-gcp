# n8n-on-gcp

Deploys an n8n instance on Google Cloud Platform (GCP) using Pulumi.

## Prerequisites

*   **Pulumi CLI:** [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
*   **GCP Account:** A Google Cloud Platform account with a configured project.
*   **gcloud CLI:** [Install and authenticate gcloud CLI](https://cloud.google.com/sdk/docs/install)
*   **Google Cloud Storage (GCS) Bucket:** Create a GCS bucket for Pulumi state storage before deployment.

## Project Structure

*   `src/infra`: GCP IaC using Pulumi.
*   `Pulumi.yaml`: Pulumi project metadata and backend configuration.
*   `Pulumi.<stack-name>.yaml`: Stack-specific configuration (e.g., GCP project ID, region, machine type).

## Configuration

0.  **Obtain TailScale Auth Key**
    Get the Key from [Tailscale setting page](https://login.tailscale.com/admin/settings/keys)

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd n8n-on-gcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Pulumi Backend (Recommended):**
    Add or verify the `backend` section in `Pulumi.yaml` to store state in GCS:

    ```yaml
    # Pulumi.yaml
    name: n8n-on-gcp
    runtime: nodejs
    description: A Pulumi project to deploy n8n on Google Cloud Platform

    backend:
      url: gs://REPLACE_WITH_YOUR_GCS_BUCKET_NAME 
    ```
    **Important:** Ensure the GCS bucket exists before deployment.

4.  **Set Project Configuration:**
    Update your stack's configuration file (e.g., `Pulumi.dev.yaml`) with correct GCP project configuration:

5.  **Review `src/infra/8nn/docker-compose.yml`:**
    Ensure these files are configured as desired. **Set strong, unique passwords for `N8N_BASIC_AUTH_PASSWORD` (if enabled).**

## Deployment

1.  **Select your stack:**
    ```bash
    pulumi stack select <stack-name> --create # Use --create if stack doesn't exist
    ```

2.  **Deploy the infrastructure:**
    ```bash
    pulumi up
    ```
    Review the preview and confirm by selecting `yes`.

3.  **Access n8n:**
    After deployment, the public IP will be displayed. Access n8n at `http://<tailscale-ip>:5678`.

## Cleanup

To destroy all Pulumi-provisioned resources:

```bash
pulumi destroy
```
Review and confirm by selecting `yes`.

## Troubleshooting

1.  **View the log file on instance:**
    The startup script logs to `/var/log/startup-script.log` on the GCE instance. If n8n isn't running, inspect this log:
    ```bash
    cat /var/log/startup-script.log
    ```