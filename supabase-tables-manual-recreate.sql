-- Tabloları tamamen silme
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS test_comments CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Kullanıcılar tablosu
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  score INTEGER DEFAULT 0,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kullanıcı Aktiviteleri tablosu
CREATE TABLE user_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  user_name TEXT,
  activity_type TEXT NOT NULL,
  details TEXT,
  entity_id INTEGER,
  entity_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kategoriler tablosu
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#4F46E5',
  background_color TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Görüntüler tablosu
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_key TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  answers JSONB NOT NULL,
  hints JSONB,
  difficulty INTEGER DEFAULT 1,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP
);

-- Testler tablosu
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  image_ids JSONB NOT NULL,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  difficulty INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  thumbnail TEXT,
  settings JSONB
);

-- Test yorumları tablosu
CREATE TABLE test_comments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Oyun skorları tablosu
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  test_id INTEGER NOT NULL,
  completion_time INTEGER,
  attempts_count INTEGER NOT NULL,
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Örnek kategoriler ekleme
INSERT INTO categories (name, description, icon_name, color)
VALUES 
  ('Filmler', 'Popüler filmler ve sinema dünyası', 'Film', '#EF4444'),
  ('Müzik', 'Şarkılar, albümler ve müzisyenler', 'Music', '#10B981'),
  ('Spor', 'Sporlar ve sporcular', 'Trophy', '#F59E0B'),
  ('Türkiye', 'Türkiye ile ilgili yerler ve simgeler', 'MapPin', '#6366F1'),
  ('Tarih', 'Tarihi olaylar ve kişiler', 'Clock', '#8B5CF6');

-- Örnek kullanıcılar ekleme
INSERT INTO users (username, password, email, role)
VALUES 
  ('admin', '$2a$10$zQv5RL7oOdSO7ZRuxphwz.dCPY8lmfgwRrJQnEx9E1sClv9WNbmTe', 'admin@example.com', 'admin'),
  ('test', '$2a$10$zQv5RL7oOdSO7ZRuxphwz.dCPY8lmfgwRrJQnEx9E1sClv9WNbmTe', 'test@example.com', 'user');

-- Görüntüler için örnek veriler
INSERT INTO images (title, image_url, category_id, answers, difficulty)
VALUES 
  ('Klasik Film', 'https://example.com/images/film1.jpg', 1, '["Casablanca", "Kazablanka"]', 2),
  ('Popüler Şarkıcı', 'https://example.com/images/singer1.jpg', 2, '["Madonna"]', 1),
  ('Ünlü Futbolcu', 'https://example.com/images/football1.jpg', 3, '["Ronaldo", "Cristiano Ronaldo"]', 1),
  ('İstanbul Manzarası', 'https://example.com/images/istanbul1.jpg', 4, '["İstanbul", "Istanbul"]', 1),
  ('Tarihi Anıt', 'https://example.com/images/monument1.jpg', 5, '["Ayasofya", "Hagia Sophia"]', 2);

-- Örnek test oluşturma
INSERT INTO tests (title, description, category_id, image_ids, approved, featured)
VALUES 
  ('Klasik Filmler Testi', 'Popüler klasik filmleri tahmin edin', 1, '[1, 2]', true, true),
  ('Müzik Yıldızları', 'Ünlü müzisyenleri tanıyın', 2, '[2, 3]', true, false),
  ('Türkiye Turu', 'Türkiye''nin güzelliklerini keşfedin', 4, '[4, 5]', true, true);

-- Örnek yorumlar ekleme
INSERT INTO test_comments (test_id, user_id, comment)
VALUES 
  (1, 1, 'Harika bir test!'),
  (1, 2, 'Çok eğlendim, teşekkürler.');

-- Örnek skorlar ekleme
INSERT INTO game_scores (user_id, test_id, completion_time, attempts_count, score, completed)
VALUES 
  (1, 1, 120, 5, 850, true),
  (2, 1, 180, 8, 650, true),
  (1, 2, 90, 3, 950, true);

-- Örnek kullanıcı aktiviteleri ekleme
INSERT INTO user_activities (user_id, user_name, activity_type, details, entity_id, entity_type)
VALUES 
  (1, 'admin', 'login', 'Kullanıcı giriş yaptı', NULL, NULL),
  (1, 'admin', 'create_test', 'Yeni test oluşturuldu', 1, 'test'),
  (2, 'test', 'play_test', 'Test oynandı', 1, 'test'),
  (2, 'test', 'like_test', 'Test beğenildi', 1, 'test');