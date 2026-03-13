UPDATE site_content_blocks
SET metadata_json = '{"missionTitle":"Our Mission","missionBody":"To provide every young athlete in Columbus with access to world-class soccer training regardless of skill level.","valuesHeading":"Our Values","coachesHeading":"Meet Our Coaches","statsHeading":"By the Numbers"}'
WHERE content_key = 'about.page'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');

UPDATE site_content_blocks
SET metadata_json = '{"overviewCards":[{"type":"PRIVATE","icon":"target","price":"$80/session","desc":"One-on-one elite coaching"},{"type":"GROUP","icon":"users","price":"$35/session","desc":"Small groups of 6-10 players"},{"type":"SPEED","icon":"zap","price":"$45/session","desc":"Speed & agility conditioning"}],"availableHeading":"Available Sessions","searchPlaceholder":"Search title, description, or location","onlyOpenLabel":"Show only sessions with open spots","noSessionsMessage":"No sessions available right now. Check back soon!","noMatchesMessage":"No sessions match your current filters."}'
WHERE content_key = 'programs.page'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');

UPDATE site_content_blocks
SET metadata_json = '{"availableHeading":"Available Tournaments","searchPlaceholder":"Search name, description, or location","onlyOpenLabel":"Show only tournaments with open slots","noTournamentsMessage":"No tournaments scheduled yet. Check back soon!","noMatchesMessage":"No tournaments match your current filters.","completedCtaLabel":"Completed","fullCtaLabel":"Full","viewCtaLabel":"View & Register"}'
WHERE content_key = 'tournaments.page'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');

UPDATE site_content_blocks
SET metadata_json = '{"getInTouchHeading":"Get in Touch","addressLabel":"Address","phoneLabel":"Phone","emailLabel":"Email","hoursLabel":"Hours","messageSentTitle":"Message Sent!","messageSentBody":"Thanks for reaching out. We will be in touch within 24 hours.","sendAnotherLabel":"Send Another Message","sendLabel":"Send Message","sendingLabel":"Sending..."}'
WHERE content_key = 'contact.page'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');

UPDATE site_content_blocks
SET metadata_json = '{"emptyMessage":"No photos added yet."}'
WHERE content_key = 'home.photos'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');

UPDATE site_content_blocks
SET metadata_json = '{"emptyMessage":"No videos added yet."}'
WHERE content_key = 'home.videos'
  AND (metadata_json IS NULL OR metadata_json = '{}' OR metadata_json = 'null');
