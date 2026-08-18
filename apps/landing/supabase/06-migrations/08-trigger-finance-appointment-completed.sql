-- ============================================================================
-- MIGRATION: 08-trigger-finance-appointment-completed.sql
-- DESCRIÇÃO: Cria trigger para gerar transação automaticamente ao concluir
--            um agendamento, garantindo consistência financeira.
-- ============================================================================

-- 0. Garantir que as colunas necessárias existam na tabela transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_professional_id ON transactions(professional_id);

-- 1. Função do Trigger
CREATE OR REPLACE FUNCTION handle_appointment_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso 1: Status mudou para 'completed' (Gera Receita)
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO transactions (
            salon_id,
            appointment_id,
            professional_id,
            client_id,
            type,
            category,
            amount,
            description,
            payment_method,
            date,
            is_confirmed
        ) VALUES (
            NEW.salon_id,
            NEW.id,
            NEW.professional_id,
            NEW.client_id,
            'income',
            'servicos',
            NEW.total_price,
            'Serviço: ' || NEW.service_name || ' - ' || NEW.client_name,
            NEW.payment_method,
            NEW.scheduled_date,
            true
        );

    -- Caso 2: Status mudou DE 'completed' para outro status (Ex: Cancelado/Revertido)
    -- Devemos estornar/remover a transação gerada
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        DELETE FROM transactions 
        WHERE appointment_id = NEW.id AND type = 'income' AND category = 'servicos';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger
DROP TRIGGER IF EXISTS trg_appointment_completion ON appointments;
CREATE TRIGGER trg_appointment_completion
AFTER UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_appointment_completion();
