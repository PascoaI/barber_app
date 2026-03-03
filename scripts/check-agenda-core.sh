#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[agenda] parity"
./scripts/check-parity.sh

echo "[agenda] build"
npm run build >/tmp/agenda_build.log 2>&1 || (cat /tmp/agenda_build.log && exit 1)

echo "[agenda] endpoint sanity"
node - <<'NODE'
const http = require('http');
function req(path, payload){
  return new Promise((resolve,reject)=>{
    const data = JSON.stringify(payload||{});
    const r = http.request({hostname:'127.0.0.1', port:3000, path, method:'POST', headers:{'content-type':'application/json','content-length':Buffer.byteLength(data)}}, res=>{
      let b='';res.on('data',d=>b+=d);res.on('end',()=>resolve({status:res.statusCode,body:b}));
    });
    r.on('error',reject);r.write(data);r.end();
  })
}
(async()=>{
  const a = await req('/api/appointments/validate-slot', {});
  const b = await req('/api/cron/appointments-status', {});
  if(a.status<400 || b.status<400){
    console.error('expected validation errors for empty payloads');
    process.exit(1);
  }
  console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
NODE

echo "[agenda] OK"
