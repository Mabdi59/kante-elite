-- V2__seed.sql: Seed data for Kante Elite Training platform

-- Admin user (password: Admin1234!)
INSERT INTO users (name, email, password_hash, role, phone)
VALUES ('Admin', 'admin@kanteelite.com',
        '$2a$12$7ZqFWFq1VJg9JE9LpMv2N.x2bNP0VHgijyiHJnbS9F6p4JsF1AQHG',
        'ADMIN', '555-000-0001');

-- Coach user (password: Coach1234!)
INSERT INTO users (name, email, password_hash, role, phone)
VALUES ('Marcus Kante', 'coach@kanteelite.com',
        '$2a$12$7ZqFWFq1VJg9JE9LpMv2N.x2bNP0VHgijyiHJnbS9F6p4JsF1AQHG',
        'COACH', '555-000-0002');

-- Coach record linked to coach user
INSERT INTO coaches (user_id, bio)
VALUES (
    (SELECT id FROM users WHERE email = 'coach@kanteelite.com'),
    'Former professional midfielder with 15 years of youth coaching experience. UEFA B licensed.'
);

-- 3 sample sessions
INSERT INTO sessions (coach_id, type, title, location, start_time, end_time, capacity, price_cents, status)
VALUES
    (
        (SELECT id FROM coaches WHERE user_id = (SELECT id FROM users WHERE email = 'coach@kanteelite.com')),
        'PRIVATE',
        '1-on-1 Technical Skills',
        'Kante Elite Field A',
        NOW() + INTERVAL '3 days',
        NOW() + INTERVAL '3 days' + INTERVAL '1 hour',
        1,
        10000,
        'ACTIVE'
    ),
    (
        (SELECT id FROM coaches WHERE user_id = (SELECT id FROM users WHERE email = 'coach@kanteelite.com')),
        'GROUP',
        'Group Finishing Drills',
        'Kante Elite Field B',
        NOW() + INTERVAL '5 days',
        NOW() + INTERVAL '5 days' + INTERVAL '2 hours',
        12,
        5000,
        'ACTIVE'
    ),
    (
        (SELECT id FROM coaches WHERE user_id = (SELECT id FROM users WHERE email = 'coach@kanteelite.com')),
        'SPEED_AND_AGILITY',
        'Speed & Agility Bootcamp',
        'Kante Elite Track',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '7 days' + INTERVAL '90 minutes',
        8,
        7500,
        'ACTIVE'
    );

-- 1 sample tournament
INSERT INTO tournaments (name, location, start_date, end_date, registration_fee_cents, age_groups, max_teams, status)
VALUES (
    'Kante Elite Summer Cup 2025',
    'Metro Sports Complex, Atlanta GA',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '62 days',
    25000,
    'U10, U12, U14, U16',
    32,
    'UPCOMING'
);
