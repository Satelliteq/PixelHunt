// Direct database access using postgres.js
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';

// Initialize Postgres client with our DATABASE_URL
const connectionString = process.env.DATABASE_URL || '';
const sql = postgres(connectionString, { max: 1 });

// Interface for test data
export interface TestData {
  id: number;
  title: string;
  description: string | null;
  uuid: string;
  categoryId: number | null;
  creatorId: number | null;
  imageIds: any;
  playCount: number;
  likeCount: number;
  createdAt: Date;
  isPublic: boolean;
  anonymousCreator: boolean;
  thumbnail: string | null;
  approved: boolean;
  published: boolean;
  difficulty: number;
}

// Ensure tables exist
export async function initTables() {
  try {
    // Check if tests table exists
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tests'
      );
    `;
    
    if (!tablesExist[0].exists) {
      // Create tests table
      await sql`
        CREATE TABLE tests (
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
          published BOOLEAN DEFAULT false,
          difficulty INTEGER DEFAULT 1
        );
      `;
      console.log('Tests table created');
      
      // Insert sample test
      await sql`
        INSERT INTO tests (
          title, description, uuid, image_ids, 
          play_count, like_count, is_public, 
          anonymous_creator, approved, published, difficulty
        ) VALUES (
          'Sample Test', 
          'This is a sample test for testing the API', 
          '11111111-1111-1111-1111-111111111111', 
          '[]'::jsonb, 
          0, 0, true, true, true, true, 1
        );
      `;
      console.log('Sample test created');
    } else {
      console.log('Tests table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing tables:', error);
    return false;
  }
}

// Get all tests
export async function getAllTests(): Promise<TestData[]> {
  try {
    const tests = await sql`SELECT * FROM tests;`;
    
    return tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    }));
  } catch (error) {
    console.error('Error getting all tests:', error);
    return [];
  }
}

// Get popular tests
export async function getPopularTests(limit: number): Promise<TestData[]> {
  try {
    const tests = await sql`
      SELECT * FROM tests 
      WHERE published = true AND approved = true 
      ORDER BY play_count DESC 
      LIMIT ${limit};
    `;
    
    return tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    }));
  } catch (error) {
    console.error('Error getting popular tests:', error);
    return [];
  }
}

// Get newest tests
export async function getNewestTests(limit: number): Promise<TestData[]> {
  try {
    const tests = await sql`
      SELECT * FROM tests 
      WHERE published = true AND approved = true 
      ORDER BY created_at DESC 
      LIMIT ${limit};
    `;
    
    return tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    }));
  } catch (error) {
    console.error('Error getting newest tests:', error);
    return [];
  }
}

// Get featured tests
export async function getFeaturedTests(limit: number): Promise<TestData[]> {
  try {
    const tests = await sql`
      SELECT * FROM tests 
      WHERE published = true AND approved = true 
      ORDER BY play_count DESC, like_count DESC 
      LIMIT ${limit};
    `;
    
    return tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    }));
  } catch (error) {
    console.error('Error getting featured tests:', error);
    return [];
  }
}

// Get test by ID
export async function getTestById(id: number): Promise<TestData | null> {
  try {
    const tests = await sql`
      SELECT * FROM tests 
      WHERE id = ${id} 
      LIMIT 1;
    `;
    
    if (tests.length === 0) {
      return null;
    }
    
    const test = tests[0];
    return {
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    };
  } catch (error) {
    console.error('Error getting test by ID:', error);
    return null;
  }
}

// Create a new test
export async function createTest(testData: {
  title: string;
  description?: string | null;
  categoryId?: number | null;
  creatorId?: number | null;
  imageIds?: any;
  isPublic?: boolean;
  anonymousCreator?: boolean;
  thumbnail?: string | null;
  approved?: boolean;
  published?: boolean;
  difficulty?: number;
}): Promise<TestData | null> {
  try {
    // Generate UUID for the test
    const uuid = uuidv4();
    
    const result = await sql`
      INSERT INTO tests (
        title, description, uuid, category_id, creator_id, 
        image_ids, is_public, anonymous_creator, 
        thumbnail, approved, published, difficulty
      ) VALUES (
        ${testData.title}, 
        ${testData.description || null}, 
        ${uuid}, 
        ${testData.categoryId || null}, 
        ${testData.creatorId || null}, 
        ${testData.imageIds || '[]'}, 
        ${testData.isPublic !== undefined ? testData.isPublic : true}, 
        ${testData.anonymousCreator !== undefined ? testData.anonymousCreator : false}, 
        ${testData.thumbnail || null}, 
        ${testData.approved !== undefined ? testData.approved : false}, 
        ${testData.published !== undefined ? testData.published : false}, 
        ${testData.difficulty || 1}
      ) RETURNING *;
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const test = result[0];
    return {
      id: test.id,
      title: test.title,
      description: test.description,
      uuid: test.uuid,
      categoryId: test.category_id,
      creatorId: test.creator_id,
      imageIds: test.image_ids,
      playCount: test.play_count,
      likeCount: test.like_count,
      createdAt: test.created_at,
      isPublic: test.is_public,
      anonymousCreator: test.anonymous_creator,
      thumbnail: test.thumbnail,
      approved: test.approved,
      published: test.published,
      difficulty: test.difficulty
    };
  } catch (error) {
    console.error('Error creating test:', error);
    return null;
  }
}

// Increment test play count
export async function incrementTestPlayCount(id: number): Promise<boolean> {
  try {
    await sql`
      UPDATE tests 
      SET play_count = play_count + 1 
      WHERE id = ${id};
    `;
    return true;
  } catch (error) {
    console.error('Error incrementing test play count:', error);
    return false;
  }
}

// Increment test like count
export async function incrementTestLikeCount(id: number): Promise<boolean> {
  try {
    await sql`
      UPDATE tests 
      SET like_count = like_count + 1 
      WHERE id = ${id};
    `;
    return true;
  } catch (error) {
    console.error('Error incrementing test like count:', error);
    return false;
  }
}

// Initialize the database on import
initTables().then(success => {
  if (success) {
    console.log('Database initialized successfully.');
  } else {
    console.error('Database initialization failed.');
  }
});