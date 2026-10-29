CREATE TABLE IF NOT EXISTS draw_guards (
 group_id TEXT PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assignments (
 group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 giver_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
 recipient_ciphertext TEXT NOT NULL,
 recipient_iv TEXT NOT NULL,
 PRIMARY KEY (group_id, giver_id)
);
