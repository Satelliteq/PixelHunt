-- 1. Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "email" TEXT,
  "role" TEXT DEFAULT 'user',
  "score" INTEGER DEFAULT 0,
  "uuid" UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  "avatar" TEXT,
  "banned" BOOLEAN DEFAULT FALSE,
  "last_login_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 2. Kategoriler tablosu
CREATE TABLE IF NOT EXISTS "public"."categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT DEFAULT '#4F46E5',
  "background_color" TEXT,
  "icon_url" TEXT,
  "icon_name" TEXT,
  "order" INTEGER DEFAULT 0,
  "active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 3. Resimler tablosu
CREATE TABLE IF NOT EXISTS "public"."images" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "storage_key" TEXT,
  "category_id" INTEGER REFERENCES categories(id),
  "answers" JSONB NOT NULL,
  "hints" JSONB,
  "difficulty" INTEGER DEFAULT 1,
  "play_count" INTEGER DEFAULT 0,
  "like_count" INTEGER DEFAULT 0,
  "active" BOOLEAN DEFAULT TRUE,
  "created_by" INTEGER REFERENCES users(id),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- 4. Testler tablosu
CREATE TABLE IF NOT EXISTS "public"."tests" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "uuid" TEXT DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  "thumbnail" TEXT,
  "category_id" INTEGER REFERENCES categories(id),
  "image_ids" JSONB,
  "difficulty" INTEGER DEFAULT 1,
  "creator_id" INTEGER REFERENCES users(id),
  "play_count" INTEGER DEFAULT 0,
  "like_count" INTEGER DEFAULT 0,
  "is_public" BOOLEAN DEFAULT TRUE,
  "approved" BOOLEAN DEFAULT FALSE,
  "published" BOOLEAN DEFAULT TRUE,
  "featured" BOOLEAN DEFAULT FALSE,
  "settings" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- 5. Test yorumları tablosu
CREATE TABLE IF NOT EXISTS "public"."test_comments" (
  "id" SERIAL PRIMARY KEY,
  "test_id" INTEGER REFERENCES tests(id) NOT NULL,
  "user_id" INTEGER REFERENCES users(id),
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 6. Oyun skorları tablosu
CREATE TABLE IF NOT EXISTS "public"."game_scores" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES users(id),
  "test_id" INTEGER REFERENCES tests(id) NOT NULL,
  "score" INTEGER NOT NULL,
  "completion_time" INTEGER,
  "attempts_count" INTEGER DEFAULT 1,
  "completed" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 7. Kullanıcı aktiviteleri tablosu
CREATE TABLE IF NOT EXISTS "public"."user_activities" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES users(id),
  "activity_type" TEXT NOT NULL,
  "activity_data" JSONB,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Çok oyunculu oyun odaları tablosu
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
    current_question_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    has_password BOOLEAN DEFAULT FALSE,
    password TEXT
);

-- Oda oyuncuları tablosu
CREATE TABLE IF NOT EXISTS room_players (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- Oda mesajları tablosu
CREATE TABLE IF NOT EXISTS room_messages (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct_guess BOOLEAN DEFAULT FALSE,
    is_close_guess BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Oda oyun sonuçları tablosu
CREATE TABLE IF NOT EXISTS room_results (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    final_score INTEGER NOT NULL,
    correct_guesses INTEGER DEFAULT 0,
    close_guesses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tablolara RLS (Row Level Security) ekleyin
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."game_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_activities" ENABLE ROW LEVEL SECURITY;

-- Herkes için SELECT erişimi sağlayan politikalar oluşturun
CREATE POLICY "Allow SELECT for all" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."categories" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."images" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."tests" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."test_comments" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."game_scores" FOR SELECT USING (true);
CREATE POLICY "Allow SELECT for all" ON "public"."user_activities" FOR SELECT USING (true);

-- Sadece hizmet rolü için INSERT/UPDATE/DELETE erişimi sağlayan politikalar oluşturun
CREATE POLICY "Allow all for service role" ON "public"."users" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."categories" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."images" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."tests" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."test_comments" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."game_scores" FOR ALL USING (auth.jwt() ? 'service_role');
CREATE POLICY "Allow all for service role" ON "public"."user_activities" FOR ALL USING (auth.jwt() ? 'service_role');

-- Admin kullanıcıları için ek politikalar
CREATE POLICY "Allow all for admins" ON "public"."categories" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow all for admins" ON "public"."images" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow all for admins" ON "public"."tests" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Allow all for admins" ON "public"."test_comments" FOR ALL USING (auth.role() = 'admin');

-- RLS politikaları
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_results ENABLE ROW LEVEL SECURITY;

-- Odalar için politikalar
CREATE POLICY "Herkes odaları görebilir" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "Yetkilendirilmiş kullanıcılar oda oluşturabilir" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Oda sahibi odayı güncelleyebilir" ON rooms
    FOR UPDATE USING (auth.uid() = host_id);

-- Oda oyuncuları için politikalar
CREATE POLICY "Herkes oda oyuncularını görebilir" ON room_players
    FOR SELECT USING (true);

CREATE POLICY "Yetkilendirilmiş kullanıcılar odaya katılabilir" ON room_players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Oyuncular kendi skorlarını güncelleyebilir" ON room_players
    FOR UPDATE USING (auth.uid() = user_id);

-- Oda mesajları için politikalar
CREATE POLICY "Herkes oda mesajlarını görebilir" ON room_messages
    FOR SELECT USING (true);

CREATE POLICY "Yetkilendirilmiş kullanıcılar mesaj gönderebilir" ON room_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Oda sonuçları için politikalar
CREATE POLICY "Herkes oda sonuçlarını görebilir" ON room_results
    FOR SELECT USING (true);

CREATE POLICY "Yetkilendirilmiş kullanıcılar sonuç ekleyebilir" ON room_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);