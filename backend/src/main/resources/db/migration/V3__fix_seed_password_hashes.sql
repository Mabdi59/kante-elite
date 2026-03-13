-- Fix seed credentials in V2 where both admin/coach were assigned the same hash.
-- Apply only when the legacy hash is still present, so custom password changes are not overwritten.

UPDATE users
SET password_hash = '$2a$12$TSfCbvuw3ePYr.bnVGB//..laRrhvoM7YqaNWdOFFoDqRZEkct.fa'
WHERE email = 'admin@kanteelite.com'
  AND password_hash = '$2a$12$7ZqFWFq1VJg9JE9LpMv2N.x2bNP0VHgijyiHJnbS9F6p4JsF1AQHG';

UPDATE users
SET password_hash = '$2a$12$fEiNBFD88JIGQHPKR/4R9OvlHxsbGStGJfzK6oqChr9Vs7k4ESn0W'
WHERE email = 'coach@kanteelite.com'
  AND password_hash = '$2a$12$7ZqFWFq1VJg9JE9LpMv2N.x2bNP0VHgijyiHJnbS9F6p4JsF1AQHG';
