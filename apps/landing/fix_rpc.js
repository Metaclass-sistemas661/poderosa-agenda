const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hqupygvkaafylnabvdte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdXB5Z3ZrYWFmeWxuYWJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUyNDI5OSwiZXhwIjoyMTAxMTAwMjk5fQ.2lFU5NNRT_3B09drChNMb1fcvaDn298RfF_Y0anS4UI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRpc() {
  const sql = `
  CREATE OR REPLACE FUNCTION public.provision_tenant(
      p_request_id UUID,
      p_auth_user_id UUID,
      p_actor_id UUID
  )
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
      v_request RECORD;
      v_salon_id UUID;
      v_admin_id UUID;
  BEGIN
      -- 1. Get Request Details
      SELECT * INTO v_request
      FROM public.access_requests
      WHERE id = p_request_id;

      IF NOT FOUND THEN
          RAISE EXCEPTION 'Request % not found', p_request_id;
      END IF;

      -- 2. Idempotency Guard
      IF v_request.status NOT IN ('pending', 'awaiting_payment') THEN
          RAISE EXCEPTION 'Request already processed (status: %)', v_request.status;
      END IF;

      -- 3. Create Tenant (Salon)
      INSERT INTO public.salons (
          name, 
          owner_name, 
          email, 
          phone, 
          city, 
          state, 
          professionals_count,
          plan,
          status
      ) VALUES (
          v_request.salon_name,
          v_request.owner_name,
          v_request.email,
          v_request.phone,
          v_request.city,
          v_request.state,
          v_request.professionals,
          'basic',
          'active'
      ) RETURNING id INTO v_salon_id;

      -- 4. Create Admin User linked to Auth
      INSERT INTO public.admin_users (
          user_id,
          salon_id,
          email,
          name,
          role,
          status
      ) VALUES (
          p_auth_user_id,
          v_salon_id,
          v_request.email,
          v_request.owner_name,
          'superadmin',
          'active'
      ) RETURNING id INTO v_admin_id;

      -- 5. Update Request Status
      UPDATE public.access_requests
      SET 
          status = 'approved',
          updated_at = NOW()
      WHERE id = p_request_id;

      -- 6. Audit Log
      INSERT INTO public.audit_logs (
          operation,
          user_id,
          target_table,
          target_id,
          status
      ) VALUES (
          'TENANT_PROVISIONED',
          p_actor_id,
          'salons',
          v_salon_id::text,
          'SUCCESS'
      );

      RETURN jsonb_build_object(
          'success', true,
          'salon_id', v_salon_id,
          'admin_user_id', v_admin_id
      );

  EXCEPTION WHEN OTHERS THEN
      -- Log failure and re-throw
      INSERT INTO public.audit_logs (
          operation,
          user_id,
          target_table,
          target_id,
          status,
          details
      ) VALUES (
          'TENANT_PROVISIONING_FAILED',
          p_actor_id,
          'access_requests',
          p_request_id::text,
          'FAILED',
          jsonb_build_object('error', SQLERRM)
      );
      RAISE;
  END;
  $$;
  `;

  // Wait, Supabase js doesn't have a direct way to run raw SQL unless using rpc.
  // We can't run raw SQL from client.
  console.log('SQL generated. Needs to be run via psql or Supabase dashboard.');
}

fixRpc();
