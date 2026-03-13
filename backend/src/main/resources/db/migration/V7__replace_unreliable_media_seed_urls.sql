UPDATE media_assets
SET url = CASE display_order
    WHEN 1 THEN '/media/placeholders/photo-1.svg'
    WHEN 2 THEN '/media/placeholders/photo-2.svg'
    WHEN 3 THEN '/media/placeholders/photo-3.svg'
    ELSE '/media/placeholders/photo-1.svg'
END
WHERE section_key = 'HOME_PHOTOS'
  AND url LIKE 'https://via.placeholder.com/%';
