-- Insert admin user
INSERT INTO users (username, password, email, role)
VALUES ('admin', 'admin123', 'admin@example.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, active)
VALUES 
  ('Sanat', 'Tablolar, heykeller ve diğer sanat eserleriyle ilgili testler', true),
  ('Tarih', 'Tarihi olaylar, kişiler ve yerlerle ilgili testler', true),
  ('Film ve TV', 'Popüler filmler ve TV şovlarından sahneler', true),
  ('Coğrafya', 'Dünya haritaları, ülkeler ve yerler', true),
  ('Müzik', 'Müzisyenler, şarkılar ve albümler', true),
  ('Spor', 'Spor yıldızları ve unutulmaz anlar', true),
  ('Bilim', 'Bilimsel keşifler ve ilginç bilgiler', true),
  ('Mimari', 'Ünlü yapılar ve mimari harikalar', true)
ON CONFLICT DO NOTHING;

-- Get admin user ID
DO $$
DECLARE
  admin_id INTEGER;
  cat_art_id INTEGER;
  cat_history_id INTEGER;
  cat_film_id INTEGER;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM users WHERE username = 'admin';
  
  -- Get category IDs
  SELECT id INTO cat_art_id FROM categories WHERE name = 'Sanat';
  SELECT id INTO cat_history_id FROM categories WHERE name = 'Tarih';
  SELECT id INTO cat_film_id FROM categories WHERE name = 'Film ve TV';
  
  -- Insert sample tests
  -- Test 1: Ünlü Tablolar
  INSERT INTO tests (
    title, 
    description, 
    creator_id, 
    category_id, 
    image_ids, 
    is_public, 
    approved, 
    featured, 
    difficulty,
    thumbnail
  )
  VALUES (
    'Ünlü Tablolar Testi',
    'Dünya tarihindeki en ünlü tabloları tanıyabilecek misiniz?',
    admin_id,
    cat_art_id,
    '[1, 2, 3]'::jsonb,
    true,
    true,
    true,
    3,
    'https://picsum.photos/seed/test1/300/200'
  )
  ON CONFLICT DO NOTHING;
  
  -- Test 2: Tarihi Fotoğraflar
  INSERT INTO tests (
    title, 
    description, 
    creator_id, 
    category_id, 
    image_ids, 
    is_public, 
    approved, 
    featured, 
    difficulty,
    thumbnail
  )
  VALUES (
    'Tarihi Fotoğraflar Testi',
    'Geçmişteki önemli olayların fotoğraflarını tanıyabilecek misiniz?',
    admin_id,
    cat_history_id,
    '[4, 5, 6]'::jsonb,
    true,
    true,
    false,
    4,
    'https://picsum.photos/seed/test2/300/200'
  )
  ON CONFLICT DO NOTHING;
  
  -- Test 3: Film Sahneleri
  INSERT INTO tests (
    title, 
    description, 
    creator_id, 
    category_id, 
    image_ids, 
    is_public, 
    approved, 
    featured, 
    difficulty,
    thumbnail
  )
  VALUES (
    'Klasik Filmler Testi',
    'Sinema tarihinin en sevilen klasik filmlerinden sahneleri tanıyabilecek misiniz?',
    admin_id,
    cat_film_id,
    '[7, 8, 9]'::jsonb,
    true,
    true,
    true,
    2,
    'https://picsum.photos/seed/test3/300/200'
  )
  ON CONFLICT DO NOTHING;
END $$;