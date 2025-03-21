-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    uuid TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT,
    email TEXT,
    score INTEGER DEFAULT 0,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    banned BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    icon_name TEXT,
    color TEXT,
    background_color TEXT,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    storage_key TEXT,
    category_id INTEGER REFERENCES categories(id),
    answers TEXT[] NOT NULL,
    hints TEXT[],
    difficulty INTEGER DEFAULT 1,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create tests table
CREATE TABLE IF NOT EXISTS public.tests (
    id SERIAL PRIMARY KEY,
    uuid TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    creator_id INTEGER,
    category_id INTEGER REFERENCES categories(id),
    image_ids INTEGER[],
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    difficulty INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    thumbnail TEXT,
    settings JSONB
);

-- Create test_comments table
CREATE TABLE IF NOT EXISTS public.test_comments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id),
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create game_scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL,
    game_mode TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_name TEXT,
    activity_type TEXT NOT NULL,
    details TEXT,
    entity_id INTEGER,
    entity_type TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a function to record user activities
CREATE OR REPLACE FUNCTION record_user_activity(
    p_user_id INTEGER,
    p_user_name TEXT,
    p_activity_type TEXT,
    p_details TEXT DEFAULT NULL,
    p_entity_id INTEGER DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activities (
        user_id, user_name, activity_type, details, entity_id, entity_type, metadata
    ) VALUES (
        p_user_id, p_user_name, p_activity_type, p_details, p_entity_id, p_entity_type, p_metadata
    );
END;
$$;