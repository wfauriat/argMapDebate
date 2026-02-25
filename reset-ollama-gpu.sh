#!/bin/bash
# Reset Ollama to use GPU (remove CPU-only override)

rm -f /etc/systemd/system/ollama.service.d/override.conf
rmdir --ignore-fail-on-non-empty /etc/systemd/system/ollama.service.d 2>/dev/null

systemctl daemon-reload
systemctl restart ollama

echo "Ollama restarted with GPU enabled."
