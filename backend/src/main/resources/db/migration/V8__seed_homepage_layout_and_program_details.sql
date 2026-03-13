INSERT INTO site_content_blocks (content_key, title, subtitle, body, metadata_json)
VALUES
  (
    'home.layout',
    NULL,
    NULL,
    NULL,
    '{"sections":[{"id":"hero","enabled":true,"order":1},{"id":"features","enabled":true,"order":2},{"id":"testimonials","enabled":true,"order":3},{"id":"media","enabled":true,"order":4},{"id":"pricing","enabled":true,"order":5},{"id":"faq","enabled":true,"order":6},{"id":"location","enabled":true,"order":7}],"showScrollProgress":true,"showMobileStickyCta":true,"mobileStickyCtaLabel":"Book Free Trial","mobileStickyCtaUrl":"/programs"}'
  ),
  (
    'programs.details',
    'Program Details',
    NULL,
    NULL,
    '{"items":[{"slug":"private","title":"Private Training","summary":"One-on-one elite coaching built around your athlete''s goals and current development needs.","startingAt":"$80/session","ageGroups":"U8 - U18","schedule":["Mon-Fri: 3:00 PM - 8:00 PM","Sat: 8:00 AM - 2:00 PM"],"whatToBring":["Soccer cleats","Water bottle","Shin guards","Positive mindset"],"ctaLabel":"Book Private Session","ctaUrl":"/programs?type=PRIVATE&book=true"},{"slug":"group","title":"Group Sessions","summary":"High-energy small group training focused on tactical IQ, teamwork, and technical consistency.","startingAt":"$35/session","ageGroups":"U8 - U16","schedule":["Tue/Thu: 5:00 PM - 7:00 PM","Sat: 9:00 AM - 12:00 PM"],"whatToBring":["Soccer cleats","Water bottle","Practice jersey","Shin guards"],"ctaLabel":"Book Group Session","ctaUrl":"/programs?type=GROUP&book=true"},{"slug":"speed","title":"Speed & Agility","summary":"Performance-focused conditioning program to improve acceleration, balance, and change of direction.","startingAt":"$45/session","ageGroups":"U10 - U18","schedule":["Mon/Wed: 6:00 PM - 7:30 PM","Sun: 10:00 AM - 11:30 AM"],"whatToBring":["Running shoes or cleats","Water bottle","Light resistance band"],"ctaLabel":"Book Speed Session","ctaUrl":"/programs?type=SPEED&book=true"}]}'
  )
ON CONFLICT (content_key) DO UPDATE
SET title = COALESCE(site_content_blocks.title, EXCLUDED.title),
    subtitle = COALESCE(site_content_blocks.subtitle, EXCLUDED.subtitle),
    body = COALESCE(site_content_blocks.body, EXCLUDED.body),
    metadata_json = (
      EXCLUDED.metadata_json::jsonb
      || COALESCE(NULLIF(site_content_blocks.metadata_json, '')::jsonb, '{}'::jsonb)
    )::text;

UPDATE site_content_blocks
SET metadata_json = (
  '{"badgeText":"Columbus, Ohio''s Premier Youth Soccer Academy","backgroundImageUrl":"https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1800&q=80","overlayOpacity":0.7,"trustItems":[{"value":"4.9","label":"Parent Rating","icon":"star"},{"value":"500+","label":"Athletes Trained","icon":"users"},{"label":"Licensed & Background Checked Coaches","icon":"shield"}]}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'home.hero';

UPDATE site_content_blocks
SET metadata_json = (
  '{"cards":[{"icon":"target","startingAt":"$80/session","href":"/programs/private"},{"icon":"users","startingAt":"$35/session","href":"/programs/group"},{"icon":"zap","startingAt":"$45/session","href":"/programs/speed"}]}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'home.features';

UPDATE site_content_blocks
SET metadata_json = (
  '{"packageSessions":8,"packageDiscountPercent":15,"packageLabel":"8-Session Package","singleLabel":"Single Session","packageSuffix":"package total"}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'home.pricing';

UPDATE site_content_blocks
SET metadata_json = (
  '{"featuredVideoIndex":0}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'home.videos';

UPDATE site_content_blocks
SET metadata_json = (
  '{"amenities":["Free Parking","Indoor Facility During Winter"],"mapEmbedUrl":"https://www.google.com/maps?q=3500+Olentangy+River+Rd,+Columbus,+OH&output=embed","directionsLabel":"Get Directions"}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'home.location';

UPDATE site_content_blocks
SET metadata_json = (
  '{"legalLinks":[{"href":"/privacy","label":"Privacy Policy"},{"href":"/terms","label":"Terms"},{"href":"/refund-policy","label":"Refund Policy"}],"socialLinks":[{"platform":"instagram","href":"https://instagram.com/"},{"platform":"facebook","href":"https://facebook.com/"}],"newsletterTitle":"Join the Parent Newsletter","newsletterBody":"Get training updates, tournament announcements, and seasonal registration alerts.","newsletterButtonLabel":"Subscribe"}'::jsonb
  || COALESCE(NULLIF(metadata_json, '')::jsonb, '{}'::jsonb)
)::text
WHERE content_key = 'footer.main';
