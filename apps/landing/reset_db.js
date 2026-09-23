const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

const SUPERADMIN_EMAIL = 'atendimento.z3digital@gmail.com';

async function resetDb() {
  console.log('--- STARTING RESET ---');
  
  // 1. Delete all users from auth.users EXCEPT superadmin
  console.log('Fetching auth users...');
  let { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error fetching users:', listError);
    return;
  }
  
  let superadminUser = users.users.find(u => u.email === SUPERADMIN_EMAIL);
  
  for (const user of users.users) {
    if (user.email !== SUPERADMIN_EMAIL) {
      console.log(`Deleting auth user: ${user.email} (${user.id})`);
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  // 2. Wipe public tables
  console.log('Wiping public tables...');
  
  // Delete all admin_users (even superadmin, we will recreate it cleanly)
  await supabase.from('admin_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Delete all access_requests
  await supabase.from('access_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Delete all payment_webhooks
  await supabase.from('payment_webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete all salons (must be done after admin_users due to FK)
  await supabase.from('salons').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Tables wiped.');

  // 3. Ensure superadmin exists in Auth
  if (!superadminUser) {
    console.log(`Superadmin ${SUPERADMIN_EMAIL} not found in Auth. Creating...`);
    // Create superadmin with temporary password
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: 'SuperAdmin@2026', // They can change this later
      email_confirm: true,
      user_metadata: {
        name: 'Super Admin Z3',
        role: 'superadmin'
      }
    });
    if (createError) {
      console.error('Failed to create superadmin:', createError);
      return;
    }
    superadminUser = newUser.user;
    console.log('Superadmin created in Auth:', superadminUser.id);
  } else {
    console.log(`Superadmin ${SUPERADMIN_EMAIL} already exists in Auth:`, superadminUser.id);
    
    // update metadata just in case
    await supabase.auth.admin.updateUserById(superadminUser.id, {
        user_metadata: {
          name: 'Super Admin Z3',
          role: 'superadmin'
        }
    });
  }

  // 4. Create superadmin in admin_users
  console.log('Inserting superadmin into admin_users...');
  const { error: insertError } = await supabase.from('admin_users').insert({
    user_id: superadminUser.id,
    name: 'Super Admin Z3',
    email: SUPERADMIN_EMAIL,
    role: 'superadmin',
    permissions: { 'all': true }
  });

  if (insertError) {
    console.error('Failed to insert into admin_users:', insertError);
  } else {
    console.log('Superadmin inserted successfully.');
  }

  console.log('--- RESET COMPLETE ---');
}

resetDb();
