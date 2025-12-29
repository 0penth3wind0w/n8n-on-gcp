#!/bin/bash
set -euo pipefail

# Read env-specific values from instance metadata
GCS_BUCKET="$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/GCS_BUCKET)"
TAILSCALE_AUTH_KEY="$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/TAILSCALE_AUTH_KEY)"
N8N_ENABLED="$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/N8N_ENABLED)"

apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Docker
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
systemctl start docker
systemctl enable docker

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

echo 'net.ipv4.ip_forward = 1' | tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | tee -a /etc/sysctl.d/99-tailscale.conf
sysctl -p /etc/sysctl.d/99-tailscale.conf
tailscale up --auth-key=${TAILSCALE_AUTH_KEY} --advertise-exit-node --accept-routes --hostname=gcp-$(hostname)

# n8n setup
if [ "${N8N_ENABLED}" == "true" ]; then
    ORIGINAL_DIR=$(pwd)
    mkdir -p /opt/n8n
    mkdir -p /opt/n8n/n8n_data
    chmod 755 /opt/n8n/n8n_data
    chown 1000:1000 /opt/n8n/n8n_data
    gsutil cp ${GCS_BUCKET}/docker-compose.yml /opt/n8n/docker-compose.yml
    docker pull docker.n8n.io/n8nio/n8n
    cd /opt/n8n
    docker-compose up -d
    cd "${ORIGINAL_DIR}"
fi
