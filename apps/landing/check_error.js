const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
  const { data, error } = await supabase.rpc('provision_tenant', { p_request_id: '00000000-0000-0000-0000-000000000000', p_auth_user_id: '00000000-0000-0000-0000-000000000000', p_actor_id: '00000000-0000-0000-0000-000000000000' });
  console.log('Error:', error);
}

checkDetails();
