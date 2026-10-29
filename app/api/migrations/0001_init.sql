CREATE TABLE IF NOT EXISTS groups (
 id TEXT PRIMARY KEY, admin_token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 event_date TEXT, gift_amount_cents INTEGER, created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','drawn'))
);
CREATE TABLE IF NOT EXISTS participants (
 id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 name TEXT NOT NULL, name_key TEXT NOT NULL, wishlist TEXT NOT NULL DEFAULT '',
 wishlist_version INTEGER NOT NULL DEFAULT 0, first_opened_at TEXT,
 UNIQUE(group_id,name_key)
);
CREATE INDEX IF NOT EXISTS idx_participants_group ON participants(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_expiration ON groups(expires_at);
CREATE TABLE IF NOT EXISTS restrictions (
 group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 participant_a TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
 participant_b TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
 PRIMARY KEY(group_id,participant_a,participant_b),
 CHECK(participant_a < participant_b)
);
-- A tabela de resultados será adicionada com criptografia na etapa de sorteio.
