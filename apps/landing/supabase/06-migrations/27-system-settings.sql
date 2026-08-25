-- Criar tabela de system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_mode boolean NOT NULL DEFAULT false,
  require_manual_approval boolean NOT NULL DEFAULT false,
  enable_system_emails boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Qualquer um pode ler (ou pode ser restrito apenas ao frontend com permissões)
-- Para que a plataforma saiba se está em manutenção na tela de login, o acesso de leitura precisa ser público
CREATE POLICY "Permitir leitura pública das configurações de sistema" 
  ON public.system_settings 
  FOR SELECT 
  USING (true);

-- Política de escrita: Apenas superadmins podem atualizar
CREATE POLICY "Permitir atualização apenas para superadmins" 
  ON public.system_settings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'superadmin'
    )
  );

-- Inserir o registro padrão (se não existir)
INSERT INTO public.system_settings (maintenance_mode, require_manual_approval, enable_system_emails)
SELECT false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- Trigger para atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.handle_system_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_system_settings_updated_at();

-- Comentários da tabela para documentação
COMMENT ON TABLE public.system_settings IS 'Armazena configurações globais da plataforma gerenciadas pelo SuperAdmin.';
COMMENT ON COLUMN public.system_settings.maintenance_mode IS 'Se true, bloqueia novos logins (exceto superadmins).';
COMMENT ON COLUMN public.system_settings.require_manual_approval IS 'Se true, novos salões aguardam aprovação após o pagamento.';
COMMENT ON COLUMN public.system_settings.enable_system_emails IS 'Se false, interrompe o envio de emails da plataforma (kill-switch).';
