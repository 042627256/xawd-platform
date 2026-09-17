#!/data/data/com.termux/files/usr/bin/bash
set -e

# 1. Update src/main.tsx agar selalu fetch ke https://api.xawd.my.id dengan credentials
sed -i 's|fetch("/api/|fetch("https://api.xawd.my.id/api/|g' src/main.tsx
sed -i 's|headers: { "Content-Type": "application/json" }|headers: { "Content-Type": "application/json" }, credentials: "include"|g' src/main.tsx

# 2. Update CORS worker di src/worker.ts agar menerima origin dan credentials
node -e '
const fs = require("fs");
let w = fs.readFileSync("src/worker.ts", "utf8");
w = w.replace(/\"Access-Control-Allow-Origin\": \"\*\"/g, "\"Access-Control-Allow-Origin\": request.headers.get(\"Origin\") || \"*\", \"Access-Control-Allow-Credentials\": \"true\"");
fs.writeFileSync("src/worker.ts", w);
'

# 3. Rebuild dan Push
npm run build
git add -f dist/
git add src/worker.ts src/main.tsx
git commit -m "fix: route api requests to api.xawd.my.id with credentials"
git push origin main
echo "Selesai di-deploy!"
