ALTER TABLE players
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(120);

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS age_group VARCHAR(64),
    ADD COLUMN IF NOT EXISTS skill_level VARCHAR(32),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS min_age INT,
    ADD COLUMN IF NOT EXISTS max_age INT,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS session_waitlist_entries (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    parent_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_name      VARCHAR(255) NOT NULL,
    player_nickname  VARCHAR(120),
    player_age       INT,
    notes            TEXT,
    status           VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_published_start
    ON sessions (status, published, start_time);

CREATE INDEX IF NOT EXISTS idx_sessions_type
    ON sessions (type);

CREATE INDEX IF NOT EXISTS idx_sessions_skill_level
    ON sessions (skill_level);

CREATE INDEX IF NOT EXISTS idx_sessions_age_group
    ON sessions (age_group);

CREATE INDEX IF NOT EXISTS idx_sessions_location
    ON sessions (location);

CREATE INDEX IF NOT EXISTS idx_session_waitlist_entries_session_status
    ON session_waitlist_entries (session_id, status, created_at);

UPDATE sessions
SET skill_level = COALESCE(skill_level, 'ALL_LEVELS'),
    waitlist_enabled = COALESCE(waitlist_enabled, TRUE),
    published = COALESCE(published, TRUE),
    description = COALESCE(description, 'Elite youth soccer development session')
WHERE status = 'ACTIVE';
