-- ============================================================================
-- PHASE 14 — EXTENDED AUDIT LOGGING
-- ============================================================================
-- Sistema enterprise de audit logging para compliance e forensics.
-- Captura automaticamente operações sensíveis via triggers.
--
-- APPLY: Execute no Supabase SQL Editor
-- IDEMPOTENT: Sim
-- ============================================================================

-- ============================================================================
-- SECTION 1: AUDIT FUNCTIONS
-- ============================================================================

-- Função genérica para log de auditoria
CREATE OR REPLACE FUNCTION log_audit_event(
    p_operation TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_salon_id UUID;
BEGIN
    -- Obter user_id e salon_id do contexto
    v_user_id := auth.uid();
    
    SELECT salon_id INTO v_salon_id
    FROM admin_users
    WHERE user_id = v_user_id
    LIMIT 1;
    
    -- Inserir log
    INSERT INTO audit_logs (
        operation,
        user_id,
        salon_id,
        target_table,
        target_id,
        status,
        metadata,
        created_at
    ) VALUES (
        p_operation,
        v_user_id,
        v_salon_id,
        p_table_name,
        p_record_id,
        'SUCCESS',
        jsonb_build_object(
            'old_data', p_old_data,
            'new_data', p_new_data,
            'additional', p_metadata
        ),
        NOW()
    );
END;
$$;

-- ============================================================================
-- SECTION 2: ROLE CHANGE AUDIT TRIGGER
-- ============================================================================
-- Captura mudanças de role em admin_users

CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log apenas se role foi alterado
    IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
        PERFORM log_audit_event(
            'ROLE_CHANGE',
            'admin_users',
            NEW.id,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role),
            jsonb_build_object(
                'user_email', NEW.email,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_changes ON admin_users;
CREATE TRIGGER trg_audit_role_changes
    AFTER UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION audit_role_changes();

-- ============================================================================
-- SECTION 3: SALON ASSIGNMENT AUDIT TRIGGER
-- ============================================================================
-- Captura mudanças de salon_id (deve falhar via prevent_admin_user_salon_id_change, mas logamos tentativas)

CREATE OR REPLACE FUNCTION audit_salon_reassignment_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log tentativa (mesmo que falhe depois pelo trigger de prevenção)
    IF (TG_OP = 'UPDATE' AND OLD.salon_id IS DISTINCT FROM NEW.salon_id) THEN
        -- Inserir diretamente (não usar log_audit_event pois pode falhar no trigger seguinte)
        INSERT INTO audit_logs (
            operation,
            user_id,
            salon_id,
            target_table,
            target_id,
            status,
            metadata,
            created_at
        ) VALUES (
            'SALON_REASSIGNMENT_ATTEMPT',
            auth.uid(),
            OLD.salon_id,
            'admin_users',
            NEW.id,
            'FORBIDDEN',
            jsonb_build_object(
                'old_salon_id', OLD.salon_id,
                'new_salon_id', NEW.salon_id,
                'user_email', NEW.email,
                'attempted_by', auth.uid()
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_salon_reassignment ON admin_users;
CREATE TRIGGER trg_audit_salon_reassignment
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION audit_salon_reassignment_attempts();

-- ============================================================================
-- SECTION 4: SALON CONFIG CHANGES AUDIT
-- ============================================================================
-- Captura mudanças em salon_settings

CREATE OR REPLACE FUNCTION audit_salon_config_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_changes JSONB := '{}'::jsonb;
    v_field TEXT;
    v_fields TEXT[] := ARRAY['business_hours', 'notification_settings', 'booking_settings', 'payment_settings'];
BEGIN
    -- Comparar campos importantes
    FOREACH v_field IN ARRAY v_fields
    LOOP
        IF (TG_OP = 'UPDATE') THEN
            -- Usar row_to_json para acessar dinamicamente os campos
            IF to_jsonb(OLD) -> v_field IS DISTINCT FROM to_jsonb(NEW) -> v_field THEN
                v_changes := v_changes || jsonb_build_object(
                    v_field,
                    jsonb_build_object(
                        'old', to_jsonb(OLD) -> v_field,
                        'new', to_jsonb(NEW) -> v_field
                    )
                );
            END IF;
        END IF;
    END LOOP;
    
    -- Se houve mudanças, logar
    IF v_changes != '{}'::jsonb THEN
        PERFORM log_audit_event(
            'SALON_CONFIG_CHANGE',
            'salon_settings',
            NEW.id,
            v_changes -> 'old',
            v_changes -> 'new',
            jsonb_build_object(
                'salon_id', NEW.salon_id,
                'changed_by', auth.uid(),
                'fields_changed', jsonb_object_keys(v_changes)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_salon_config ON salon_settings;
CREATE TRIGGER trg_audit_salon_config
    AFTER UPDATE ON salon_settings
    FOR EACH ROW
    EXECUTE FUNCTION audit_salon_config_changes();

-- ============================================================================
-- SECTION 5: SUPERADMIN OPERATIONS AUDIT
-- ============================================================================
-- Captura operações críticas executadas por superadmins

CREATE OR REPLACE FUNCTION audit_superadmin_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_superadmin BOOLEAN;
BEGIN
    -- Verificar se operação foi feita por superadmin
    SELECT role = 'superadmin' INTO v_is_superadmin
    FROM admin_users
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF v_is_superadmin THEN
        -- Log operação de superadmin
        PERFORM log_audit_event(
            CONCAT('SUPERADMIN_', TG_OP, '_', TG_TABLE_NAME),
            TG_TABLE_NAME::TEXT,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
            jsonb_build_object(
                'operation_type', TG_OP,
                'table', TG_TABLE_NAME,
                'superadmin_id', auth.uid()
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em tabelas críticas
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['salons', 'admin_users', 'salon_settings']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_superadmin_%I ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE TRIGGER trg_audit_superadmin_%I
             AFTER INSERT OR UPDATE OR DELETE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION audit_superadmin_operations()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================================
-- SECTION 6: FAILED OPERATION LOGGING
-- ============================================================================
-- Função para log de operações que falharam

CREATE OR REPLACE FUNCTION log_failed_operation(
    p_operation TEXT,
    p_table_name TEXT,
    p_error_code TEXT,
    p_error_message TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_salon_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    SELECT salon_id INTO v_salon_id
    FROM admin_users
    WHERE user_id = v_user_id
    LIMIT 1;
    
    INSERT INTO audit_logs (
        operation,
        user_id,
        salon_id,
        target_table,
        status,
        error_code,
        metadata,
        created_at
    ) VALUES (
        p_operation,
        v_user_id,
        v_salon_id,
        p_table_name,
        'FAILED',
        p_error_code,
        jsonb_build_object(
            'error_message', p_error_message,
            'additional', p_metadata
        ),
        NOW()
    );
END;
$$;

-- ============================================================================
-- SECTION 7: AUDIT LOG ANALYSIS VIEWS
-- ============================================================================
-- Views para análise de logs

-- View: Role changes por usuário
CREATE OR REPLACE VIEW audit_role_changes_summary AS
SELECT 
    al.user_id,
    au.email,
    al.metadata->>'user_email' as target_email,
    al.metadata->'old_data'->>'role' as old_role,
    al.metadata->'new_data'->>'role' as new_role,
    al.created_at,
    al.salon_id
FROM audit_logs al
LEFT JOIN admin_users au ON au.user_id = al.user_id
WHERE al.operation = 'ROLE_CHANGE'
ORDER BY al.created_at DESC;

-- View: Tentativas de reassignment de salon
CREATE OR REPLACE VIEW audit_salon_reassignment_attempts AS
SELECT 
    al.user_id,
    au.email as attempted_by_email,
    al.metadata->>'user_email' as target_email,
    al.metadata->>'old_salon_id' as old_salon_id,
    al.metadata->>'new_salon_id' as new_salon_id,
    al.created_at
FROM audit_logs al
LEFT JOIN admin_users au ON au.user_id = al.user_id
WHERE al.operation = 'SALON_REASSIGNMENT_ATTEMPT'
ORDER BY al.created_at DESC;

-- View: Operações de superadmin
CREATE OR REPLACE VIEW audit_superadmin_activity AS
SELECT 
    al.user_id,
    au.email as superadmin_email,
    al.operation,
    al.target_table,
    al.target_id,
    al.metadata->>'operation_type' as operation_type,
    al.created_at,
    al.salon_id
FROM audit_logs al
LEFT JOIN admin_users au ON au.user_id = al.user_id
WHERE al.operation LIKE 'SUPERADMIN_%'
ORDER BY al.created_at DESC;

-- View: Config changes por salon
CREATE OR REPLACE VIEW audit_config_changes_by_salon AS
SELECT 
    al.salon_id,
    s.name as salon_name,
    al.user_id,
    au.email as changed_by_email,
    al.metadata->>'fields_changed' as fields_changed,
    al.created_at
FROM audit_logs al
LEFT JOIN salons s ON s.id = al.salon_id
LEFT JOIN admin_users au ON au.user_id = al.user_id
WHERE al.operation = 'SALON_CONFIG_CHANGE'
ORDER BY al.created_at DESC;

-- View: Failed operations
CREATE OR REPLACE VIEW audit_failed_operations AS
SELECT 
    al.user_id,
    au.email,
    al.operation,
    al.target_table,
    al.error_code,
    al.metadata->>'error_message' as error_message,
    al.created_at,
    al.salon_id
FROM audit_logs al
LEFT JOIN admin_users au ON au.user_id = al.user_id
WHERE al.status = 'FAILED'
ORDER BY al.created_at DESC;

-- ============================================================================
-- SECTION 8: RETENTION POLICY
-- ============================================================================
-- Função para limpar logs antigos (manter 365 dias)

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_retention_days INTEGER := 365;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * v_retention_days
    AND operation NOT IN ('ROLE_CHANGE', 'SALON_REASSIGNMENT_ATTEMPT')  -- Manter logs críticos
    RETURNING * INTO v_deleted_count;
    
    RAISE NOTICE 'Deleted % old audit logs (retention: % days)', v_deleted_count, v_retention_days;
END;
$$;

-- ============================================================================
-- SECTION 9: AUDIT REPORTING FUNCTIONS
-- ============================================================================

-- Função: Relatório de atividade por usuário
CREATE OR REPLACE FUNCTION audit_report_user_activity(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    operation TEXT,
    target_table TEXT,
    target_id UUID,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.operation,
        al.target_table,
        al.target_id,
        al.status,
        al.created_at
    FROM audit_logs al
    WHERE al.user_id = p_user_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC;
END;
$$;

-- Função: Relatório de atividade por salon
CREATE OR REPLACE FUNCTION audit_report_salon_activity(
    p_salon_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    user_email TEXT,
    operation TEXT,
    target_table TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.email,
        al.operation,
        al.target_table,
        al.status,
        al.created_at
    FROM audit_logs al
    LEFT JOIN admin_users au ON au.user_id = al.user_id
    WHERE al.salon_id = p_salon_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC;
END;
$$;

-- ============================================================================
-- SECTION 10: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    trigger_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Contar triggers de auditoria
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trg_audit_%';
    
    -- Contar views de análise
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name LIKE 'audit_%';
    
    -- Contar funções de auditoria
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname LIKE '%audit%'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE '✅ Phase 14 — Extended Audit Logging COMPLETE';
    RAISE NOTICE '   ✅ Audit triggers created: %', trigger_count;
    RAISE NOTICE '   ✅ Analysis views created: %', view_count;
    RAISE NOTICE '   ✅ Audit functions created: %', function_count;
    RAISE NOTICE '   ✅ Retention policy: 365 days';
    RAISE NOTICE '   ✅ Logging coverage:';
    RAISE NOTICE '      - Role changes';
    RAISE NOTICE '      - Salon reassignment attempts';
    RAISE NOTICE '      - Config changes';
    RAISE NOTICE '      - Superadmin operations';
    RAISE NOTICE '      - Failed operations';
END;
$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
/*
-- Ver mudanças de role nos últimos 30 dias
SELECT * FROM audit_role_changes_summary WHERE created_at >= NOW() - INTERVAL '30 days';

-- Ver tentativas de reassignment
SELECT * FROM audit_salon_reassignment_attempts;

-- Ver operações de superadmin
SELECT * FROM audit_superadmin_activity WHERE created_at >= NOW() - INTERVAL '7 days';

-- Ver mudanças de config por salon
SELECT * FROM audit_config_changes_by_salon WHERE salon_id = 'uuid-here';

-- Ver operações que falharam
SELECT * FROM audit_failed_operations WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Relatório de atividade de um usuário
SELECT * FROM audit_report_user_activity('user-uuid', NOW() - INTERVAL '30 days', NOW());

-- Relatório de atividade de um salon
SELECT * FROM audit_report_salon_activity('salon-uuid', NOW() - INTERVAL '7 days', NOW());

-- Limpar logs antigos (executar via cron job)
SELECT cleanup_old_audit_logs();
*/