#!/usr/bin/env bash
set -euo pipefail
cd /root/workspace/CrystalBio
CRYSTALBIO_MONITOR_OUTPUT=/var/www/crystalbio/periwinkle-live-monitor-a93f27.html node scripts/update-live-monitor-page.mjs
chmod 0644 /var/www/crystalbio/periwinkle-live-monitor-a93f27.html
