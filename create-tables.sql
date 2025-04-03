-- Mevcut tabloları temizle (ihtiyaç duyarsanız)
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
  uuid TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password TEXT,
  email TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  score INTEGER DEFAULT 0,
  banned BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı Aktiviteleri tablosu
CREATE TABLE user_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_name TEXT,
  activity_type TEXT NOT NULL,
  details TEXT,
  entity_id INTEGER,
  entity_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kategoriler tablosu (basitleştirilmiş)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Görsel/Resimler tablosu
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Testler tablosu
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  image_url TEXT,
  questions JSONB NOT NULL,
  duration INTEGER,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  difficulty INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Test Yorumları tablosu
CREATE TABLE test_comments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oyun Skorları tablosu
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  test_id INTEGER NOT NULL REFERENCES tests(id),
  completion_time INTEGER,
  attempts_count INTEGER NOT NULL,
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Örnek bir kullanıcı ekleyelim (admin)
INSERT INTO users (uuid, username, password, email, role, avatar)
VALUES ('sample-uuid-admin', 'admin', 'hashed_password', 'admin@example.com', 'admin', NULL);

-- Örnek kategoriler
INSERT INTO categories (name, description) VALUES 
  ('Sanat', 'Sanat ve sanatçılar hakkında sorular'),
  ('Bilim', 'Bilim ve teknoloji hakkında sorular'),
  ('Tarih', 'Tarihi olaylar ve karakterler hakkında sorular'),
  ('Filmler', 'Popüler filmler ve sinemayla ilgili sorular'),
  ('Müzik', 'Müzik sanatçıları ve müzik bilgisi soruları');

-- Şimdi de örnek birkaç test oluşturalım
INSERT INTO tests (uuid, title, description, creator_id, category_id, difficulty, duration, questions, is_public, approved, featured)
VALUES 
  (
    'test-uuid-1', 
    'Sanat Testi', 
    'Sanat hakkında bilgilerinizi test edin', 
    1, 
    1, 
    2, 
    300, 
    '[
      {
        "id": "1",
        "question": "Mona Lisa tablosunu kim yapmıştır?",
        "options": [
          {"id": "a", "text": "Leonardo da Vinci"},
          {"id": "b", "text": "Michelangelo"},
          {"id": "c", "text": "Pablo Picasso"},
          {"id": "d", "text": "Vincent van Gogh"}
        ],
        "correctAnswer": "a",
        "explanation": "Mona Lisa, Leonardo da Vinci tarafından yapılmış ünlü bir tablodur."
      },
      {
        "id": "2",
        "question": "Guernica tablosu hangi savaş sırasında yaşanan bombardımanı anlatır?",
        "options": [
          {"id": "a", "text": "I. Dünya Savaşı"},
          {"id": "b", "text": "II. Dünya Savaşı"},
          {"id": "c", "text": "İspanya İç Savaşı"},
          {"id": "d", "text": "Vietnam Savaşı"}
        ],
        "correctAnswer": "c",
        "explanation": "Guernica, İspanya İç Savaşı sırasında Guernica kasabasının bombalanmasını konu alan, Pablo Picasso tarafından yapılmış ünlü bir tablodur."
      }
    ]'::jsonb, 
    true, 
    true, 
    true
  ),
  (
    'test-uuid-2', 
    'Bilim Testi - Zorlayıcı', 
    'Bilim konusunda kendinizi zorlayın', 
    1, 
    2, 
    4, 
    600, 
    '[
      {
        "id": "1",
        "question": "Hangi element periyodik tabloda Ag sembolü ile gösterilir?",
        "options": [
          {"id": "a", "text": "Altın"},
          {"id": "b", "text": "Gümüş"},
          {"id": "c", "text": "Aluminyum"},
          {"id": "d", "text": "Argon"}
        ],
        "correctAnswer": "b",
        "explanation": "Ag (Argentum) sembolü Gümüş elementini temsil eder."
      },
      {
        "id": "2",
        "question": "DNA'nın çift sarmal yapısını keşfeden bilim insanları kimlerdir?",
        "options": [
          {"id": "a", "text": "Watson ve Crick"},
          {"id": "b", "text": "Einstein ve Bohr"},
          {"id": "c", "text": "Curie ve Pasteur"},
          {"id": "d", "text": "Darwin ve Mendel"}
        ],
        "correctAnswer": "a",
        "explanation": "DNA'nın çift sarmal yapısı 1953 yılında James Watson ve Francis Crick tarafından keşfedilmiştir."
      }
    ]'::jsonb, 
    true, 
    true, 
    false
  ),
  (
    'test-uuid-3', 
    'Filmler Başlangıç Testi', 
    'Filmler hakkında temel bilgileri test edin', 
    1, 
    4, 
    1, 
    180, 
    '[
      {
        "id": "1",
        "question": "Star Wars serisinin ilk filmi hangisidir?",
        "options": [
          {"id": "a", "text": "Yeni Umut"},
          {"id": "b", "text": "İmparatorun Dönüşü"},
          {"id": "c", "text": "Klonların Saldırısı"},
          {"id": "d", "text": "Gizli Tehlike"}
        ],
        "correctAnswer": "a",
        "explanation": "Star Wars serisinin ilk filmi 1977 tarihli Yeni Umut (A New Hope) filmidir."
      },
      {
        "id": "2",
        "question": "The Matrix filmindeki baş karakterin adı nedir?",
        "options": [
          {"id": "a", "text": "Morpheus"},
          {"id": "b", "text": "Trinity"},
          {"id": "c", "text": "Neo"},
          {"id": "d", "text": "Agent Smith"}
        ],
        "correctAnswer": "c",
        "explanation": "The Matrix filmindeki baş karakter, Keanu Reeves tarafından canlandırılan Neo'dur."
      }
    ]'::jsonb, 
    true, 
    false, 
    false
  );