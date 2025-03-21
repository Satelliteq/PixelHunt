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