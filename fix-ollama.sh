#!/bin/bash
# Force Ollama to use CPU only (GPU VRAM too small for llama3.2)

mkdir -p /etc/systemd/system/ollama.service.d

cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="CUDA_VISIBLE_DEVICES="
EOF

systemctl daemon-reload
systemctl restart ollama

echo "Ollama restarted in CPU-only mode."
