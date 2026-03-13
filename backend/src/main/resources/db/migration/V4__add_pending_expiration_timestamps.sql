ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE tournament_registrations
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at
    ON bookings (status, created_at);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status_created_at
    ON tournament_registrations (status, created_at);
