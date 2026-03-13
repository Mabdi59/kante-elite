CREATE TABLE IF NOT EXISTS site_content_blocks (
    id           BIGSERIAL PRIMARY KEY,
    content_key  VARCHAR(120) NOT NULL UNIQUE,
    title        VARCHAR(255),
    subtitle     VARCHAR(512),
    body         TEXT,
    cta_label    VARCHAR(120),
    cta_url      VARCHAR(512),
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
    id            BIGSERIAL PRIMARY KEY,
    section_key   VARCHAR(120) NOT NULL,
    media_type    VARCHAR(20) NOT NULL,
    title         VARCHAR(255),
    description   TEXT,
    url           VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    display_order INT NOT NULL DEFAULT 0,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_section_active_order
    ON media_assets (section_key, active, display_order, id);

INSERT INTO site_content_blocks (content_key, title, subtitle, body, metadata_json)
VALUES
    ('nav.brand', 'Kante Elite', null, null, '{"navLinks":[{"href":"/","label":"Home"},{"href":"/programs","label":"Programs"},{"href":"/tournaments","label":"Tournaments"},{"href":"/about","label":"About"},{"href":"/contact","label":"Contact"}]}'),
    ('footer.main', 'Kante Elite Training', null, 'Premier youth soccer training in Columbus, OH.', '{"quickLinks":[{"href":"/programs","label":"Programs"},{"href":"/tournaments","label":"Tournaments"},{"href":"/about","label":"About Us"},{"href":"/contact","label":"Contact"}],"phone":"(614) 555-0100","email":"info@kanteelite.com","city":"Columbus, OH 43215"}'),
    ('home.hero', 'Train Like a Champion', 'Columbus, Ohio''s Premier Youth Soccer Academy', 'Kante Elite Training offers world-class youth soccer coaching in Columbus, OH.', '{"highlightWord":"Champion","primaryCtaLabel":"Book a Session","primaryCtaUrl":"/programs","secondaryCtaLabel":"View Programs","secondaryCtaUrl":"/programs","stats":[{"value":"500+","label":"Athletes Trained"},{"value":"10+","label":"Years Experience"},{"value":"95%","label":"Satisfaction Rate"}]}'),
    ('home.features', 'Our Training Programs', null, 'Every program is designed by professional coaches to help young athletes reach their full potential.', '{"cards":[{"icon":"target","title":"Private Training","description":"One-on-one sessions tailored to your child''s skill level.","highlights":["Custom curriculum","Flexible scheduling","Rapid skill development"],"href":"/programs"},{"icon":"users","title":"Group Sessions","description":"Train alongside peers in a competitive, fun environment.","highlights":["Small group sizes (6-10)","Team dynamics","Peer competition"],"href":"/programs"},{"icon":"zap","title":"Speed & Agility","description":"Specialized conditioning programs designed to improve speed and athleticism.","highlights":["Performance tracking","Sport-science backed","All skill levels"],"href":"/programs"}]}'),
    ('home.testimonials', 'What Parents Say', null, 'Hear from families who''ve seen real results.', '{"items":[{"name":"Marcus Johnson","role":"Parent of U12 player","avatar":"MJ","text":"Kante Elite completely transformed my son''s game.","stars":5},{"name":"Sarah Williams","role":"Parent of U10 player","avatar":"SW","text":"The group sessions are well-organized and effective.","stars":5},{"name":"David Chen","role":"Parent of U14 player","avatar":"DC","text":"The Speed & Agility program is incredible.","stars":5}]}'),
    ('home.pricing', 'Transparent Pricing', null, 'No hidden fees. Choose the plan that fits your athlete.', '{"tiers":[{"name":"Group Session","price":35,"per":"per session","description":"Train with peers in a competitive environment.","features":["Small groups","Expert coaching","Skill drills","Recap notes"],"cta":"Book Group","highlight":false},{"name":"Speed & Agility","price":45,"per":"per session","description":"Specialized conditioning to maximize athletic performance.","features":["Performance benchmarking","Training plans","Video analysis","Progress tracking"],"cta":"Book Speed","highlight":true},{"name":"Private Training","price":80,"per":"per session","description":"1-on-1 coaching tailored to development goals.","features":["Custom plan","Elite coaching","Flexible scheduling","Progress reports"],"cta":"Book Private","highlight":false}]}'),
    ('home.faq', 'Frequently Asked Questions', null, 'Everything you need to know about training with us.', '{"items":[{"q":"What age groups do you train?","a":"We train players ages 6-18, covering U8 through U18 age groups."},{"q":"How do I book a session?","a":"Create a free account and book from the Programs page."},{"q":"Where are sessions held?","a":"Sessions take place at our Columbus facility."},{"q":"What is your cancellation policy?","a":"Cancellations made 24+ hours in advance are fully refundable."}]}'),
    ('home.location', 'Find Us in Columbus, OH', null, null, '{"addressName":"Primary Training Facility","addressLine":"3500 Olentangy River Rd, Columbus, OH 43214","addressSubline":"Near Easton Town Center | Free parking","hours":["Monday - Friday: 3 PM - 8 PM","Saturday: 8 AM - 6 PM","Sunday: 10 AM - 4 PM"],"phone":"(614) 555-0100","email":"info@kanteelite.com","mapLabel":"Columbus, OH 43214","mapAddress":"3500 Olentangy River Rd","mapUrl":"https://maps.google.com/?q=3500+Olentangy+River+Rd,Columbus,OH"}'),
    ('about.page', 'About Kante Elite Training', null, 'Founded in Columbus, Ohio, Kante Elite Training is dedicated to developing the next generation of soccer champions.', '{}'),
    ('programs.page', 'Training Programs', null, 'Browse available sessions and book your spot today.', '{}'),
    ('tournaments.page', 'Tournaments', null, 'Compete in Kante Elite youth soccer tournaments across Columbus.', '{}'),
    ('contact.page', 'Contact Us', null, 'Have questions? Send us a message and we''ll get back to you.', '{}'),
    ('home.photos', 'Photo Gallery', null, 'Highlights from sessions, tournaments, and community events.', '{}'),
    ('home.videos', 'Video Highlights', null, 'Training clips, showcases, and match moments.', '{}')
ON CONFLICT (content_key) DO NOTHING;

INSERT INTO media_assets (section_key, media_type, title, description, url, display_order, active)
VALUES
    ('HOME_PHOTOS', 'PHOTO', 'Private Training Session', 'One-on-one technical development.', '/media/placeholders/photo-1.svg', 1, TRUE),
    ('HOME_PHOTOS', 'PHOTO', 'Group Session', 'Small-group finishing drills.', '/media/placeholders/photo-2.svg', 2, TRUE),
    ('HOME_PHOTOS', 'PHOTO', 'Tournament Day', 'Team line-up before kickoff.', '/media/placeholders/photo-3.svg', 3, TRUE),
    ('HOME_VIDEOS', 'VIDEO', 'Training Highlight', 'Short highlight reel from academy sessions.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, TRUE)
ON CONFLICT DO NOTHING;
