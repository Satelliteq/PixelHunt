-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS game_scores;
DROP TABLE IF EXISTS test_comments;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  score INTEGER DEFAULT 0,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_activities table
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

-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#4F46E5',
  background_color TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create images table
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
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP
);

-- Create tests table
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
  is_public BOOLEAN DEFAULT TRUE,
  approved BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  difficulty INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  thumbnail TEXT,
  settings JSONB
);

-- Create test_comments table
CREATE TABLE test_comments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create game_scores table
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  test_id INTEGER NOT NULL REFERENCES tests(id),
  completion_time INTEGER,
  attempts_count INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_images_category_id ON images(category_id);
CREATE INDEX idx_tests_category_id ON tests(category_id);
CREATE INDEX idx_tests_creator_id ON tests(creator_id);
CREATE INDEX idx_test_comments_test_id ON test_comments(test_id);
CREATE INDEX idx_test_comments_user_id ON test_comments(user_id);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_test_id ON game_scores(test_id);