#!/bin/bash
node server/src/index.js &
cd client && node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5000
