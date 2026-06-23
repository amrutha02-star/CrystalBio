#!/usr/bin/env bash
set -euo pipefail
cd /root/workspace/CrystalBio
node scripts/update-live-monitor-page.mjs
cp public/periwinkle-live-monitor-a93f27.html /var/www/crystalbio/periwinkle-live-monitor-a93f27.html
chmod 0644 /var/www/crystalbio/periwinkle-live-monitor-a93f27.html
