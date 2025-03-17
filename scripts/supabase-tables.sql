-- Tablolar henüz mevcut değilse oluşturun
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT
);

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  uuid TEXT NOT NULL UNIQUE,
  category_id INTEGER,
  creator_id INTEGER,
  image_ids JSONB NOT NULL DEFAULT '[]',
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT true,
  anonymous_creator BOOLEAN DEFAULT false,
  thumbnail TEXT,
  approved BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  difficulty INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.images (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  answers JSONB NOT NULL,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  test_id INTEGER,
  score INTEGER NOT NULL,
  attempts_count INTEGER DEFAULT 1,
  completion_time INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.test_comments (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek kategoriler ekleyin
INSERT INTO public.categories (name, description, icon_url)
VALUES 
  ('Otomobiller', 'Araçlar ve otomobillerle ilgili testler', 'https://api.iconify.design/mdi:car.svg'),
  ('Coğrafya', 'Haritalar, şehirler ve coğrafi konuları içeren testler', 'https://api.iconify.design/mdi:earth.svg'),
  ('Film ve TV', 'Filmler, diziler ve TV programları hakkında testler', 'https://api.iconify.design/mdi:movie.svg'),
  ('Sanat', 'Tüm sanat dalları ve ilgili testler', 'https://api.iconify.design/mdi:palette.svg')
ON CONFLICT (name) DO NOTHING;

-- Görünümler oluşturun
CREATE OR REPLACE VIEW public.popular_tests AS
SELECT * FROM public.tests 
WHERE published = true AND approved = true
ORDER BY play_count DESC, like_count DESC;

CREATE OR REPLACE VIEW public.newest_tests AS
SELECT * FROM public.tests 
WHERE published = true AND approved = true
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.featured_tests AS
SELECT * FROM public.tests 
WHERE published = true AND approved = true
ORDER BY play_count DESC, like_count DESC;

-- Stored prosedürler oluşturun
CREATE OR REPLACE FUNCTION public.get_popular_tests(limit_param INTEGER)
RETURNS SETOF public.tests AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.tests
  WHERE published = true AND approved = true
  ORDER BY play_count DESC, like_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_newest_tests(limit_param INTEGER)
RETURNS SETOF public.tests AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.tests
  WHERE published = true AND approved = true
  ORDER BY created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_test_play_count(test_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.tests
  SET play_count = play_count + 1
  WHERE id = test_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_test_like_count(test_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.tests
  SET like_count = like_count + 1
  WHERE id = test_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Politikaları
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes testleri görebilir" ON public.tests;
CREATE POLICY "Herkes testleri görebilir" ON public.tests
FOR SELECT USING (published = true AND approved = true);

-- Kategori tablosu için Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes kategorileri görebilir" ON public.categories;
CREATE POLICY "Herkes kategorileri görebilir" ON public.categories
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Yöneticiler kategorileri düzenleyebilir" ON public.categories;
CREATE POLICY "Yöneticiler kategorileri düzenleyebilir" ON public.categories
FOR ALL USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
);