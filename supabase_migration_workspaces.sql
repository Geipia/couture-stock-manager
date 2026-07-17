-- ================================================================
-- MIGRATION : Multi-espaces + Invitations + Admin
-- Colle ce fichier dans Supabase > SQL Editor > New Query > Run
-- ================================================================

-- 1. Table profils (admin flag + display name)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT,
  display_name TEXT,
  is_admin     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Remplir les profils manquants pour les utilisateurs existants
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Table espaces de stock (magasins)
CREATE TABLE IF NOT EXISTS workspaces (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  owner_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table membres par espace
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Table invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  invited_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ajouter workspace_id aux tables existantes
ALTER TABLE articles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE projets  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 6. Trigger : quand un workspace est créé, ajouter le propriétaire en tant que membre
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- 7. Migrer les données existantes
-- On désactive le RLS le temps de l'insertion, puis on le réactive
ALTER TABLE workspaces        DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  u RECORD;
  ws_id UUID;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM articles WHERE workspace_id IS NULL LOOP
    INSERT INTO workspaces (name, owner_id) VALUES ('Mon magasin', u.user_id) RETURNING id INTO ws_id;
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, u.user_id, 'owner') ON CONFLICT DO NOTHING;
    UPDATE articles SET workspace_id = ws_id WHERE user_id = u.user_id AND workspace_id IS NULL;
    UPDATE projets  SET workspace_id = ws_id WHERE user_id = u.user_id AND workspace_id IS NULL;
  END LOOP;
END $$;

-- ================================================================
-- 8. Row Level Security
-- ================================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- RPC function : crée un workspace pour l'utilisateur courant (contourne le RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_workspace(workspace_name TEXT)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result workspaces;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO workspaces (name, owner_id)
  VALUES (workspace_name, auth.uid())
  RETURNING * INTO result;
  RETURN row_to_json(result);
END;
$$;

-- Helper function : is user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

-- Helper function : is user member of workspace?
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid());
$$;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Workspaces
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;
CREATE POLICY "workspaces_select" ON workspaces FOR SELECT
  USING (is_admin() OR is_workspace_member(id));
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE
  USING (owner_id = auth.uid() OR is_admin());
CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE
  USING (owner_id = auth.uid() OR is_admin());

-- Workspace members
DROP POLICY IF EXISTS "members_select" ON workspace_members;
DROP POLICY IF EXISTS "members_insert" ON workspace_members;
DROP POLICY IF EXISTS "members_delete" ON workspace_members;
CREATE POLICY "members_select" ON workspace_members FOR SELECT
  USING (is_admin() OR user_id = auth.uid() OR is_workspace_member(workspace_id));
CREATE POLICY "members_insert" ON workspace_members FOR INSERT WITH CHECK (
  is_admin() OR user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);
CREATE POLICY "members_delete" ON workspace_members FOR DELETE
  USING (user_id = auth.uid() OR is_admin() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Invitations
DROP POLICY IF EXISTS "invitations_select" ON workspace_invitations;
DROP POLICY IF EXISTS "invitations_insert" ON workspace_invitations;
DROP POLICY IF EXISTS "invitations_update" ON workspace_invitations;
CREATE POLICY "invitations_select" ON workspace_invitations FOR SELECT
  USING (is_admin() OR invited_by = auth.uid() OR is_workspace_member(workspace_id) OR
    invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "invitations_insert" ON workspace_invitations FOR INSERT
  WITH CHECK (is_admin() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );
CREATE POLICY "invitations_update" ON workspace_invitations FOR UPDATE
  USING (is_admin() OR invited_by = auth.uid() OR
    invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Articles : suppression de TOUTES les policies existantes avant recréation
DROP POLICY IF EXISTS "Users see own articles"    ON articles;
DROP POLICY IF EXISTS "Users insert own articles" ON articles;
DROP POLICY IF EXISTS "Users update own articles" ON articles;
DROP POLICY IF EXISTS "Users delete own articles" ON articles;
DROP POLICY IF EXISTS "articles_select"           ON articles;
DROP POLICY IF EXISTS "articles_insert"           ON articles;
DROP POLICY IF EXISTS "articles_update"           ON articles;
DROP POLICY IF EXISTS "articles_delete"           ON articles;
CREATE POLICY "articles_select" ON articles FOR SELECT
  USING (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "articles_insert" ON articles FOR INSERT
  WITH CHECK (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "articles_update" ON articles FOR UPDATE
  USING (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "articles_delete" ON articles FOR DELETE
  USING (is_admin() OR is_workspace_member(workspace_id));

-- Projets : idem
DROP POLICY IF EXISTS "Users see own projets"    ON projets;
DROP POLICY IF EXISTS "Users insert own projets" ON projets;
DROP POLICY IF EXISTS "Users update own projets" ON projets;
DROP POLICY IF EXISTS "Users delete own projets" ON projets;
DROP POLICY IF EXISTS "projets_select"           ON projets;
DROP POLICY IF EXISTS "projets_insert"           ON projets;
DROP POLICY IF EXISTS "projets_update"           ON projets;
DROP POLICY IF EXISTS "projets_delete"           ON projets;
CREATE POLICY "projets_select" ON projets FOR SELECT
  USING (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "projets_insert" ON projets FOR INSERT
  WITH CHECK (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "projets_update" ON projets FOR UPDATE
  USING (is_admin() OR is_workspace_member(workspace_id));
CREATE POLICY "projets_delete" ON projets FOR DELETE
  USING (is_admin() OR is_workspace_member(workspace_id));

-- ================================================================
-- 9. Compte admin
-- Crée d'abord l'utilisateur dans Supabase > Authentication > Users
-- avec l'email admin@admin.com et le mot de passe de ton choix
-- puis exécute ceci :
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@admin.com';
-- ================================================================
