-- ============================================================================
-- MIGRATION: 11-trigger-finance-v2.sql
-- DESCRIÇÃO: Reescreve a trigger de finanças para suportar o fluxo de 
--            Checkout Inteligente (Serviços + Produtos + Comissões + CMV).
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_appointment_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_rate DECIMAL(5,2) := 0;
    v_commission_amount DECIMAL(10,2) := 0;
    v_product_sales DECIMAL(10,2) := 0;
    v_product_costs DECIMAL(10,2) := 0;
    v_prod RECORD;
BEGIN
    -- CASO 1: Agendamento Concluído (Gera Receitas, Despesas e Baixa Estoque)
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- 1. Calcular a comissão do profissional (se aplicável)
        IF NEW.professional_id IS NOT NULL THEN
            SELECT COALESCE(commission_rate, 0) INTO v_commission_rate
            FROM professionals
            WHERE id = NEW.professional_id;
            
            IF v_commission_rate > 0 THEN
                v_commission_amount := (COALESCE(NEW.service_price, 0) * (v_commission_rate / 100.0));
            END IF;
        END IF;

        -- 2. Transação 1: Receita do Serviço
        IF COALESCE(NEW.service_price, 0) > 0 THEN
            INSERT INTO transactions (
                salon_id, appointment_id, professional_id, client_id,
                type, category, amount, description, date, is_confirmed, payment_method
            ) VALUES (
                NEW.salon_id, NEW.id, NEW.professional_id, NEW.client_id,
                'income', 'servicos', NEW.service_price, 
                'Serviço: ' || COALESCE(NEW.service_name, 'Serviço'), 
                NEW.scheduled_date, true, NEW.payment_method
            );
        END IF;

        -- 3. Transação 2: Despesa de Comissão
        IF v_commission_amount > 0 THEN
            INSERT INTO transactions (
                salon_id, appointment_id, professional_id, client_id,
                type, category, amount, description, date, is_confirmed
            ) VALUES (
                NEW.salon_id, NEW.id, NEW.professional_id, NEW.client_id,
                'expense', 'comissoes', v_commission_amount, 
                'Comissão: ' || COALESCE(NEW.service_name, 'Serviço'), 
                NEW.scheduled_date, true
            );
        END IF;

        -- 4. Processar Produtos Consumidos (appointment_products deve ser preenchido antes do update de status)
        FOR v_prod IN 
            SELECT ap.product_id, ap.quantity, ap.unit_sale_price, ap.unit_cost_price, p.name
            FROM appointment_products ap
            JOIN products p ON p.id = ap.product_id
            WHERE ap.appointment_id = NEW.id
        LOOP
            v_product_sales := v_product_sales + (v_prod.quantity * v_prod.unit_sale_price);
            v_product_costs := v_product_costs + (v_prod.quantity * v_prod.unit_cost_price);
            
            -- Dar baixa no estoque
            UPDATE products 
            SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_prod.quantity)
            WHERE id = v_prod.product_id;
        END LOOP;

        -- 5. Transação 3: Receita de Venda de Produtos
        IF v_product_sales > 0 THEN
            INSERT INTO transactions (
                salon_id, appointment_id, professional_id, client_id,
                type, category, amount, description, date, is_confirmed
            ) VALUES (
                NEW.salon_id, NEW.id, NEW.professional_id, NEW.client_id,
                'income', 'produtos', v_product_sales, 
                'Venda de Produtos (Ref: Agendamento)', 
                NEW.scheduled_date, true
            );
        END IF;

        -- 6. Transação 4: Despesa de CMV (Custo da Mercadoria Vendida)
        IF v_product_costs > 0 THEN
            INSERT INTO transactions (
                salon_id, appointment_id, professional_id, client_id,
                type, category, amount, description, date, is_confirmed
            ) VALUES (
                NEW.salon_id, NEW.id, NEW.professional_id, NEW.client_id,
                'expense', 'custo_produtos', v_product_costs, 
                'CMV (Custo de Produtos Vendidos)', 
                NEW.scheduled_date, true
            );
        END IF;

    -- CASO 2: Agendamento revertido de 'completed' para outro status (Ex: Cancelado/Remarcado)
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        
        -- 1. Deletar TODAS as transações financeiras geradas por este agendamento
        DELETE FROM transactions WHERE appointment_id = NEW.id;

        -- 2. Devolver os produtos consumidos para o estoque
        FOR v_prod IN 
            SELECT ap.product_id, ap.quantity
            FROM appointment_products ap
            WHERE ap.appointment_id = NEW.id
        LOOP
            UPDATE products 
            SET stock_quantity = COALESCE(stock_quantity, 0) + v_prod.quantity
            WHERE id = v_prod.product_id;
        END LOOP;

        -- 3. Limpar a tabela de relacionamento (opcional, mas recomendado para evitar duplicação futura)
        DELETE FROM appointment_products WHERE appointment_id = NEW.id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a trigger está aplicada
DROP TRIGGER IF EXISTS trg_appointment_completion ON appointments;
CREATE TRIGGER trg_appointment_completion
AFTER UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_appointment_completion();
