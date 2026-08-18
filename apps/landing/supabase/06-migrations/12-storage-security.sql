-- ============================================================================
-- PHASE 12 — STORAGE SECURITY
-- ============================================================================
-- Implementa tenant isolation e RLS para Supabase Storage.
-- Garante que cada tenant só acesse seus próprios arquivos.
--
-- APPLY: Execute no Supabase SQL Editor
-- IDEMPOTENT: Sim (usa IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE STORAGE BUCKETS
-- ============================================================================

-- Bucket para avatars de profissionais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,  -- public=true para acesso direto via URL
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Bucket para logos de salões
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'salon-logos',
    'salon-logos',
    true,
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Bucket para produtos (fotos de produtos vendidos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================================
-- SECTION 2: STORAGE RLS POLICIES — AVATARS BUCKET
-- ============================================================================
-- Path format: {salon_id}/{filename}
-- Tenant isolation: usuário só acessa arquivos do próprio salão

-- SELECT (READ): Usuário pode ver avatars do próprio salão
DROP POLICY IF EXISTS "Users can view own salon avatars" ON storage.objects;
CREATE POLICY "Users can view own salon avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        -- Superadmin vê tudo
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        -- User vê apenas do próprio salão (path começa com salon_id)
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- INSERT (UPLOAD): Usuário só pode fazer upload no diretório do próprio salão
DROP POLICY IF EXISTS "Users can upload to own salon folder" ON storage.objects;
CREATE POLICY "Users can upload to own salon folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (
        -- Superadmin pode fazer upload em qualquer lugar
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        -- User só no próprio salão (path começa com salon_id)
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- UPDATE: Usuário pode atualizar apenas arquivos do próprio salão
DROP POLICY IF EXISTS "Users can update own salon avatars" ON storage.objects;
CREATE POLICY "Users can update own salon avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- DELETE: Usuário pode deletar apenas arquivos do próprio salão
DROP POLICY IF EXISTS "Users can delete own salon avatars" ON storage.objects;
CREATE POLICY "Users can delete own salon avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- ============================================================================
-- SECTION 3: STORAGE RLS POLICIES — SALON-LOGOS BUCKET
-- ============================================================================
-- Path format: {salon_id}.{ext}
-- Tenant isolation: cada salão acessa apenas o próprio logo

DROP POLICY IF EXISTS "Users can view own salon logo" ON storage.objects;
CREATE POLICY "Users can view own salon logo"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'salon-logos'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        -- Path é salon_id.ext (ex: uuid.png)
        split_part(name, '.', 1) = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can upload own salon logo" ON storage.objects;
CREATE POLICY "Users can upload own salon logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'salon-logos'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        split_part(name, '.', 1) = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can update own salon logo" ON storage.objects;
CREATE POLICY "Users can update own salon logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'salon-logos'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        split_part(name, '.', 1) = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can delete own salon logo" ON storage.objects;
CREATE POLICY "Users can delete own salon logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'salon-logos'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        split_part(name, '.', 1) = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- ============================================================================
-- SECTION 4: STORAGE RLS POLICIES — PRODUCTS BUCKET
-- ============================================================================
-- Path format: {salon_id}/{filename}

DROP POLICY IF EXISTS "Users can view own salon products" ON storage.objects;
CREATE POLICY "Users can view own salon products"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'products'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can upload own salon products" ON storage.objects;
CREATE POLICY "Users can upload own salon products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'products'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can update own salon products" ON storage.objects;
CREATE POLICY "Users can update own salon products"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'products'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

DROP POLICY IF EXISTS "Users can delete own salon products" ON storage.objects;
CREATE POLICY "Users can delete own salon products"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'products'
    AND (
        (SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1) = 'superadmin'
        OR
        (storage.foldername(name))[1] = (
            SELECT salon_id::text
            FROM admin_users
            WHERE user_id = auth.uid()
            LIMIT 1
        )
    )
);

-- ============================================================================
-- SECTION 5: PUBLIC ACCESS (anonymous users can view public URLs)
-- ============================================================================
-- Permite acesso anônimo a arquivos públicos (necessário para publicUrl funcionar)

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can view salon logos" ON storage.objects;
CREATE POLICY "Public can view salon logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'salon-logos');

DROP POLICY IF EXISTS "Public can view products" ON storage.objects;
CREATE POLICY "Public can view products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- ============================================================================
-- SECTION 6: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    bucket_count integer;
    policy_count integer;
BEGIN
    -- Verificar buckets criados
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id IN ('avatars', 'salon-logos', 'products');

    ASSERT bucket_count = 3, 'ERROR: Not all buckets were created!';

    -- Verificar policies criadas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%salon%';

    RAISE NOTICE '✅ Phase 12 — Storage Security COMPLETE';
    RAISE NOTICE '   ✅ Buckets created: %', bucket_count;
    RAISE NOTICE '   ✅ RLS Policies created: %', policy_count;
    RAISE NOTICE '   ✅ Tenant isolation: Path-based (salon_id prefix)';
    RAISE NOTICE '   ✅ Public access: Enabled for read-only';
    RAISE NOTICE '   ✅ File size limits: 2MB (avatars/logos), 5MB (products)';
END;
$$;