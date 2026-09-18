#!/bin/bash
mkdir -p db
npx prisma db push --accept-data-loss
node scripts/auto-seed.js
exec node .next/standalone/server.js
