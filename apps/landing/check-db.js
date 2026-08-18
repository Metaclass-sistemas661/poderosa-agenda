const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});
fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/clients?limit=1', {
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
  }
}).then(r => r.json()).then(data => {
  if(data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log('No clients data', data);
  }
}).catch(console.error);
