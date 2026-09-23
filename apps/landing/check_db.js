const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const userId = '26df0aad-2810-4b3d-8e2f-70af396e06e4'; // alndiversos@gmail.com
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching admin_users for user:', error.message);
  } else {
    console.log('Admin user found:', data);
  }

  const { data: allAdmins, error: allAdminsErr } = await supabase
    .from('admin_users')
    .select('*')
    .limit(5);
  
  if (allAdminsErr) {
    console.error('Error fetching all admin_users:', allAdminsErr.message);
  } else {
    console.log('Some users in admin_users table:', allAdmins);
  }
}

checkUser();
