-- ==============================================================================
-- MIGRATION: 27-fix-provision-tenant-payment-flow.sql
-- DESCRIPTION: Corrige provision_tenant para o fluxo com pagamento.
--   BUG: a guarda exigia status = 'pending', mas após aprovação do superadmin a
--   solicitação fica 'awaiting_payment' -> RPC sempre falhava no webhook.
--   - Aceita 'pending' | 'awaiting_payment' | 'payment_confirmed' | 'provisioning' | 'failed'
--   - Idempotente: se já 'approved' com salão provisionado, retorna o existente
--   - Grava dados do pagamento na mesma transação
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.provision_tenant(
    p_request_id   UUID,
    p_auth_user_id UUID,
    p_actor_id     UUID,
    p_payment      JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request  RECORD;
    v_salon_id UUID;
    v_admin_id UUID;
BEGIN
    SELECT * INTO v_request FROM public.access_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found: %', p_request_id;
    END IF;

    -- Idempotência: já provisionado -> retorna o existente
    IF v_request.status = 'approved' AND v_request.provisioned_salon_id IS NOT NULL THEN
        SELECT id INTO v_admin_id FROM public.admin_users
         WHERE salon_id = v_request.provisioned_salon_id AND user_id = v_request.provisioned_user_id LIMIT 1;
        RETURN jsonb_build_object('success', true, 'already_provisioned', true,
                                  'salon_id', v_request.provisioned_salon_id, 'admin_user_id', v_admin_id);
    END IF;

    IF v_request.status NOT IN ('pending', 'awaiting_payment', 'payment_confirmed', 'provisioning', 'failed') THEN
        RAISE EXCEPTION 'Request in invalid state for provisioning (status: %)', v_request.status;
    END IF;

    INSERT INTO public.salons (name, owner_name, email, phone, city, state, professionals_count, plan, status)
    VALUES (v_request.salon_name, v_request.owner_name, v_request.email, v_request.phone,
            v_request.city, v_request.state, v_request.professionals, 'basic', 'active')
    RETURNING id INTO v_salon_id;

    INSERT INTO public.admin_users (user_id, salon_id, name, email, role, permissions,
                                    must_change_password, provisioned_at, provisioned_by_request_id)
    VALUES (p_auth_user_id, v_salon_id, v_request.owner_name, v_request.email, 'admin',
            '{"owner": true}'::jsonb, TRUE, NOW(), p_request_id)
    RETURNING id INTO v_admin_id;

    UPDATE public.access_requests SET
        status               = 'approved',
        provisioned_salon_id = v_salon_id,
        provisioned_user_id  = p_auth_user_id,
        provisioning_error   = NULL,
        provisioning_attempts = COALESCE(provisioning_attempts, 0) + 1,
        payment_id      = COALESCE(p_payment->>'id', payment_id),
        payment_status  = CASE WHEN p_payment IS NOT NULL THEN 'approved' ELSE payment_status END,
        payment_method  = COALESCE(p_payment->>'billingType', payment_method),
        payment_amount  = COALESCE((p_payment->>'value')::numeric, payment_amount),
        paid_at         = CASE WHEN p_payment IS NOT NULL THEN NOW() ELSE paid_at END,
        payment_raw_data = COALESCE(p_payment, payment_raw_data),
        updated_at      = NOW()
    WHERE id = p_request_id;

    BEGIN
        INSERT INTO audit_logs (operation, user_id, salon_id, target_table, target_id, status, metadata, created_at)
        VALUES ('TENANT_PROVISIONED', p_actor_id, v_salon_id, 'access_requests', p_request_id, 'SUCCESS',
                jsonb_build_object('auth_user_id', p_auth_user_id, 'admin_id', v_admin_id,
                                   'payment_id', p_payment->>'id'), NOW());
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    RETURN jsonb_build_object('success', true, 'salon_id', v_salon_id, 'admin_user_id', v_admin_id);
END;
$$;

-- Remove a assinatura antiga (3 args) para evitar ambiguidade no PostgREST
DROP FUNCTION IF EXISTS public.provision_tenant(UUID, UUID, UUID);

REVOKE ALL ON FUNCTION public.provision_tenant(UUID, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_tenant(UUID, UUID, UUID, JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';
