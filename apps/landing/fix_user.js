const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'lavidnerd16@gmail.com');
  
  if (user) {
    console.log('Deleting user:', user.id);
    await supabase.auth.admin.deleteUser(user.id);
  }
}

fixUser();
