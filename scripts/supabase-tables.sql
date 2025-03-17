-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  answers JSONB NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  creator_id INTEGER REFERENCES users(id),
  image_ids JSONB NOT NULL,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  anonymous_creator BOOLEAN DEFAULT false,
  thumbnail TEXT,
  approved BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test comments table
CREATE TABLE IF NOT EXISTS test_comments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  completion_time INTEGER,
  attempts_count INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Views for optimization (optional)
CREATE OR REPLACE VIEW popular_tests AS
SELECT * FROM tests 
WHERE published = true AND approved = true
ORDER BY play_count DESC;

CREATE OR REPLACE VIEW newest_tests AS
SELECT * FROM tests 
WHERE published = true AND approved = true
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW featured_tests AS
SELECT * FROM tests 
WHERE published = true AND approved = true
ORDER BY play_count DESC, like_count DESC;

-- Stored functions for complex operations
CREATE OR REPLACE FUNCTION get_popular_tests(limit_param INTEGER)
RETURNS SETOF tests AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM tests 
  WHERE published = true AND approved = true
  ORDER BY play_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_newest_tests(limit_param INTEGER)
RETURNS SETOF tests AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM tests 
  WHERE published = true AND approved = true
  ORDER BY created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Helper function to execute SQL (needs to be created on Supabase admin panel)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;