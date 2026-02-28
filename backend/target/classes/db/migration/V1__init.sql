-- V1__init.sql: Initial schema for Kante Elite Training platform

CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255),
    email        VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role         VARCHAR(50)  NOT NULL DEFAULT 'PARENT',
    phone        VARCHAR(50),
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE players (
    id             BIGSERIAL PRIMARY KEY,
    parent_user_id BIGINT REFERENCES users(id),
    name           VARCHAR(255) NOT NULL,
    age            INT,
    position       VARCHAR(100),
    notes          TEXT
);

CREATE TABLE coaches (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    bio     TEXT
);

CREATE TABLE sessions (
    id         BIGSERIAL PRIMARY KEY,
    coach_id   BIGINT REFERENCES coaches(id),
    type       VARCHAR(100) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    location   VARCHAR(255),
    start_time TIMESTAMP,
    end_time   TIMESTAMP,
    capacity   INT,
    price_cents INT,
    status     VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE bookings (
    id                       BIGSERIAL PRIMARY KEY,
    session_id               BIGINT REFERENCES sessions(id),
    player_id                BIGINT REFERENCES players(id),
    parent_user_id           BIGINT REFERENCES users(id),
    status                   VARCHAR(50) DEFAULT 'PENDING',
    payment_status           VARCHAR(50) DEFAULT 'PENDING',
    stripe_payment_intent_id VARCHAR(255)
);

CREATE TABLE tournaments (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    location              VARCHAR(255),
    start_date            DATE,
    end_date              DATE,
    registration_fee_cents INT,
    age_groups            VARCHAR(255),
    max_teams             INT,
    status                VARCHAR(50) DEFAULT 'UPCOMING'
);

CREATE TABLE teams (
    id            BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id),
    name          VARCHAR(255) NOT NULL,
    coach_name    VARCHAR(255),
    contact_email VARCHAR(255),
    age_group     VARCHAR(100)
);

CREATE TABLE tournament_registrations (
    id                       BIGSERIAL PRIMARY KEY,
    tournament_id            BIGINT REFERENCES tournaments(id),
    team_id                  BIGINT REFERENCES teams(id),
    status                   VARCHAR(50) DEFAULT 'PENDING',
    payment_status           VARCHAR(50) DEFAULT 'PENDING',
    stripe_payment_intent_id VARCHAR(255)
);
