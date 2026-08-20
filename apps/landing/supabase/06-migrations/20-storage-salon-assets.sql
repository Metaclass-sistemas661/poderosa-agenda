-- ==============================================================================
-- MIGRATION: 20-storage-salon-assets.sql
-- DESCRIPTION: Cria o bucket de Storage para assets dos salões e aplica RLS
-- ==============================================================================

-- 1. Inserir o bucket na tabela de buckets do Storage, se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon_assets', 'salon_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir acesso de leitura PÚBLICA a todos os arquivos (Para a logo carregar no site)
CREATE POLICY "Logos publicamente visiveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon_assets');

-- 3. Permitir INSERT apenas para usuários autenticados que pertencem ao salão
-- O arquivo deve ser upado na pasta com o UUID do salão: salon_id/nome_do_arquivo
CREATE POLICY "Admins do salão podem fazer upload de assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon_assets' AND
  (auth.uid() IN (
    SELECT user_id FROM public.admin_users
    WHERE salon_id::text = (string_to_array(name, '/'))[1]
    AND role IN ('superadmin', 'admin', 'manager')
  ))
);

-- 4. Permitir UPDATE nos próprios assets
CREATE POLICY "Admins do salão podem atualizar assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'salon_assets' AND
  (auth.uid() IN (
    SELECT user_id FROM public.admin_users
    WHERE salon_id::text = (string_to_array(name, '/'))[1]
    AND role IN ('superadmin', 'admin', 'manager')
  ))
);

-- 5. Permitir DELETE nos próprios assets
CREATE POLICY "Admins do salão podem deletar assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'salon_assets' AND
  (auth.uid() IN (
    SELECT user_id FROM public.admin_users
    WHERE salon_id::text = (string_to_array(name, '/'))[1]
    AND role IN ('superadmin', 'admin', 'manager')
  ))
);
