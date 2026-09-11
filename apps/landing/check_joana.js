const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('id, name, email, provisioned_at')
    .ilike('name', '%joana%');

  console.log('Admin users found:', adminData);

  const { data: webhooks, error: webhooksError } = await supabase
    .from('payment_webhooks')
    .select('id, event_type, status, processing_error')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('Recent webhooks:', webhooks);
}

checkDetails();
