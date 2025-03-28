-- execute_sql
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$;

-- create_users_table_if_not_exists
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
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
    END IF;
END;
$$;

-- create_categories_table_if_not_exists
CREATE OR REPLACE FUNCTION create_categories_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        CREATE TABLE public.categories (
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
    END IF;
END;
$$;

-- create_images_table_if_not_exists
CREATE OR REPLACE FUNCTION create_images_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'images') THEN
        CREATE TABLE public.images (
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
    END IF;
END;
$$;

-- create_tests_table_if_not_exists
CREATE OR REPLACE FUNCTION create_tests_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tests') THEN
        CREATE TABLE public.tests (
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
    END IF;
END;
$$;

-- create_test_comments_table_if_not_exists
CREATE OR REPLACE FUNCTION create_test_comments_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_comments') THEN
        CREATE TABLE public.test_comments (
            id SERIAL PRIMARY KEY,
            test_id INTEGER REFERENCES tests(id),
            user_id INTEGER REFERENCES users(id),
            comment TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END;
$$;

-- create_game_scores_table_if_not_exists
CREATE OR REPLACE FUNCTION create_game_scores_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_scores') THEN
        CREATE TABLE public.game_scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            score INTEGER NOT NULL,
            game_mode TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END;
$$;

-- create_user_activities_table_if_not_exists
CREATE OR REPLACE FUNCTION create_user_activities_table_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activities') THEN
        CREATE TABLE public.user_activities (
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
    END IF;
END;
$$;

-- record_user_activity
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