import { IStorage } from './storage';
import { Pool } from 'pg';
import {
  User, InsertUser,
  Category, InsertCategory,
  Image, InsertImage,
  Test, InsertTest,
  TestComment, InsertTestComment,
  GameScore, InsertGameScore,
  UserActivity, InsertUserActivity
} from './supabase-storage';
import { createId } from '@paralleldrive/cuid2';

// PostgreSQL havuzu oluştur
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class PostgresStorage implements IStorage {
  constructor() {
    console.log('PostgreSQL storage initialized');
  }

  // Kullanıcı işlemleri
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] as User || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] as User || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await pool.query(
        `INSERT INTO users (
          username, email, password_hash, role, score, profile_image_url, banned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          user.username,
          user.email,
          user.password_hash,
          user.role || 'user',
          user.score || 0,
          user.profile_image_url,
          user.banned || false
        ]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`User creation failed: ${error}`);
    }
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    try {
      const user = await this.getUser(id);
      if (!user) return undefined;

      const newScore = (user.score || 0) + scoreToAdd;
      const result = await pool.query(
        'UPDATE users SET score = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newScore, id]
      );
      
      // Kullanıcı aktivitesi kaydı (optional)
      if (scoreToAdd > 0) {
        await pool.query(
          `INSERT INTO user_activities (
            user_id, user_name, activity_type, details, metadata
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            user.username,
            'score_update',
            `Skor güncellendi: +${scoreToAdd} puan`,
            JSON.stringify({ scoreAdded: scoreToAdd })
          ]
        );
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error updating user score:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      return result.rows as User[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [role, id]
      );
      return result.rows[0] as User || undefined;
    } catch (error) {
      console.error('Error updating user role:', error);
      return undefined;
    }
  }

  async updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined> {
    try {
      const result = await pool.query(
        'UPDATE users SET banned = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [banned, id]
      );
      return result.rows[0] as User || undefined;
    } catch (error) {
      console.error('Error updating user ban status:', error);
      return undefined;
    }
  }

  // Kategori işlemleri
  async getAllCategories(): Promise<Category[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM categories WHERE active = true ORDER BY name ASC'
      );
      return result.rows as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM categories WHERE id = $1',
        [id]
      );
      return result.rows[0] as Category || undefined;
    } catch (error) {
      console.error('Error fetching category:', error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const result = await pool.query(
        `INSERT INTO categories (
          name, description, icon_name, color, background_color, image_url, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          category.name,
          category.description,
          category.icon_name,
          category.color,
          category.background_color,
          category.image_url,
          category.active !== undefined ? category.active : true
        ]
      );
      return result.rows[0] as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error(`Category creation failed: ${error}`);
    }
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    try {
      const updates = [];
      const values = [];
      let counter = 1;

      if (category.name !== undefined) {
        updates.push(`name = $${counter++}`);
        values.push(category.name);
      }
      if (category.description !== undefined) {
        updates.push(`description = $${counter++}`);
        values.push(category.description);
      }
      if (category.icon_name !== undefined) {
        updates.push(`icon_name = $${counter++}`);
        values.push(category.icon_name);
      }
      if (category.color !== undefined) {
        updates.push(`color = $${counter++}`);
        values.push(category.color);
      }
      if (category.background_color !== undefined) {
        updates.push(`background_color = $${counter++}`);
        values.push(category.background_color);
      }
      if (category.image_url !== undefined) {
        updates.push(`image_url = $${counter++}`);
        values.push(category.image_url);
      }
      if (category.active !== undefined) {
        updates.push(`active = $${counter++}`);
        values.push(category.active);
      }

      // updated_at timestamp de güncelleyelim
      updates.push(`updated_at = NOW()`);

      // ID'yi parametre olarak ekleyelim
      values.push(id);

      const query = `
        UPDATE categories 
        SET ${updates.join(', ')} 
        WHERE id = $${counter} 
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] as Category || undefined;
    } catch (error) {
      console.error('Error updating category:', error);
      return undefined;
    }
  }

  // Resim işlemleri
  async getAllImages(): Promise<Image[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM images WHERE active = true ORDER BY created_at DESC'
      );
      return result.rows as Image[];
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
    }
  }

  async getImage(id: number): Promise<Image | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM images WHERE id = $1',
        [id]
      );
      return result.rows[0] as Image || undefined;
    } catch (error) {
      console.error('Error fetching image:', error);
      return undefined;
    }
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM images WHERE category_id = $1 AND active = true ORDER BY created_at DESC',
        [categoryId]
      );
      return result.rows as Image[];
    } catch (error) {
      console.error('Error fetching images by category:', error);
      return [];
    }
  }

  async createImage(image: InsertImage): Promise<Image> {
    try {
      const result = await pool.query(
        `INSERT INTO images (
          title, image_url, storage_key, category_id, answers, hints, 
          difficulty, play_count, like_count, active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          image.title,
          image.image_url,
          image.storage_key,
          image.category_id,
          image.answers,
          image.hints,
          image.difficulty,
          image.play_count || 0,
          image.like_count || 0,
          image.active !== undefined ? image.active : true,
          image.created_by
        ]
      );
      
      // Kullanıcı aktivitesi (optional)
      if (image.created_by) {
        await pool.query(
          `INSERT INTO user_activities (
            user_id, activity_type, details, entity_id, entity_type
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            image.created_by,
            'create_image',
            `Yeni resim oluşturuldu: ${image.title}`,
            result.rows[0].id,
            'image'
          ]
        );
      }
      
      return result.rows[0] as Image;
    } catch (error) {
      console.error('Error creating image:', error);
      throw new Error(`Image creation failed: ${error}`);
    }
  }

  async incrementPlayCount(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE images SET play_count = play_count + 1 WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  async incrementLikeCount(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE images SET like_count = like_count + 1 WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error incrementing like count:', error);
    }
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM images WHERE active = true ORDER BY play_count DESC LIMIT $1',
        [limit]
      );
      return result.rows as Image[];
    } catch (error) {
      console.error('Error fetching top played images:', error);
      return [];
    }
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM images WHERE active = true ORDER BY like_count DESC LIMIT $1',
        [limit]
      );
      return result.rows as Image[];
    } catch (error) {
      console.error('Error fetching top liked images:', error);
      return [];
    }
  }

  // Test işlemleri
  async getAllTests(): Promise<Test[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE is_public = true ORDER BY created_at DESC'
      );
      return result.rows as Test[];
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    }
  }

  async getTest(id: number): Promise<Test | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE id = $1',
        [id]
      );
      return result.rows[0] as Test || undefined;
    } catch (error) {
      console.error('Error fetching test:', error);
      return undefined;
    }
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE uuid = $1',
        [uuid]
      );
      return result.rows[0] as Test || undefined;
    } catch (error) {
      console.error('Error fetching test by uuid:', error);
      return undefined;
    }
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE category_id = $1 AND is_public = true ORDER BY created_at DESC',
        [categoryId]
      );
      return result.rows as Test[];
    } catch (error) {
      console.error('Error fetching tests by category:', error);
      return [];
    }
  }

  async createTest(test: InsertTest): Promise<Test> {
    try {
      const uuid = createId();
      const result = await pool.query(
        `INSERT INTO tests (
          uuid, title, description, category_id, creator_id, 
          difficulty, duration, image_url, questions,
          play_count, like_count, approved, is_public, featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`,
        [
          uuid,
          test.title,
          test.description,
          test.category_id,
          test.creator_id,
          test.difficulty,
          test.duration,
          test.image_url,
          JSON.stringify(test.questions),
          test.play_count || 0,
          test.like_count || 0,
          test.approved !== undefined ? test.approved : false,
          test.is_public !== undefined ? test.is_public : false,
          test.featured !== undefined ? test.featured : false
        ]
      );
      
      // Kullanıcı aktivitesi (optional)
      if (test.creator_id) {
        await pool.query(
          `INSERT INTO user_activities (
            user_id, activity_type, details, entity_id, entity_type
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            test.creator_id,
            'create_test',
            `Yeni test oluşturuldu: ${test.title}`,
            result.rows[0].id,
            'test'
          ]
        );
      }
      
      return result.rows[0] as Test;
    } catch (error) {
      console.error('Error creating test:', error);
      throw new Error(`Test creation failed: ${error}`);
    }
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    try {
      const updates = [];
      const values = [];
      let counter = 1;

      if (test.title !== undefined) {
        updates.push(`title = $${counter++}`);
        values.push(test.title);
      }
      if (test.description !== undefined) {
        updates.push(`description = $${counter++}`);
        values.push(test.description);
      }
      if (test.category_id !== undefined) {
        updates.push(`category_id = $${counter++}`);
        values.push(test.category_id);
      }
      if (test.difficulty !== undefined) {
        updates.push(`difficulty = $${counter++}`);
        values.push(test.difficulty);
      }
      if (test.duration !== undefined) {
        updates.push(`duration = $${counter++}`);
        values.push(test.duration);
      }
      if (test.image_url !== undefined) {
        updates.push(`image_url = $${counter++}`);
        values.push(test.image_url);
      }
      if (test.questions !== undefined) {
        updates.push(`questions = $${counter++}`);
        values.push(JSON.stringify(test.questions));
      }
      if (test.play_count !== undefined) {
        updates.push(`play_count = $${counter++}`);
        values.push(test.play_count);
      }
      if (test.like_count !== undefined) {
        updates.push(`like_count = $${counter++}`);
        values.push(test.like_count);
      }
      if (test.approved !== undefined) {
        updates.push(`approved = $${counter++}`);
        values.push(test.approved);
      }
      if (test.is_public !== undefined) {
        updates.push(`is_public = $${counter++}`);
        values.push(test.is_public);
      }
      if (test.featured !== undefined) {
        updates.push(`featured = $${counter++}`);
        values.push(test.featured);
      }

      // updated_at timestamp güncelle
      updates.push(`updated_at = NOW()`);

      // ID parametre olarak ekle
      values.push(id);

      const query = `
        UPDATE tests 
        SET ${updates.join(', ')} 
        WHERE id = $${counter} 
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] as Test || undefined;
    } catch (error) {
      console.error('Error updating test:', error);
      return undefined;
    }
  }

  async deleteTest(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM tests WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting test:', error);
      return false;
    }
  }

  async incrementTestPlayCount(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE tests SET play_count = play_count + 1 WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error incrementing test play count:', error);
    }
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE tests SET like_count = like_count + 1 WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error incrementing test like count:', error);
    }
  }

  async updateTestApproval(id: number, approved: boolean): Promise<Test | undefined> {
    try {
      const result = await pool.query(
        'UPDATE tests SET approved = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [approved, id]
      );
      return result.rows[0] as Test || undefined;
    } catch (error) {
      console.error('Error updating test approval status:', error);
      return undefined;
    }
  }

  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    try {
      const result = await pool.query(
        'UPDATE tests SET is_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [published, id]
      );
      return result.rows[0] as Test || undefined;
    } catch (error) {
      console.error('Error updating test published status:', error);
      return undefined;
    }
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE is_public = true AND approved = true ORDER BY play_count DESC LIMIT $1',
        [limit]
      );
      return result.rows as Test[];
    } catch (error) {
      console.error('Error fetching popular tests:', error);
      return [];
    }
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE is_public = true AND approved = true ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows as Test[];
    } catch (error) {
      console.error('Error fetching newest tests:', error);
      return [];
    }
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM tests WHERE is_public = true AND approved = true AND featured = true ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows as Test[];
    } catch (error) {
      console.error('Error fetching featured tests:', error);
      return [];
    }
  }

  // Test yorumları
  async getTestComments(testId: number): Promise<TestComment[]> {
    try {
      const result = await pool.query(
        `SELECT tc.*, u.username, u.profile_image_url 
         FROM test_comments tc
         LEFT JOIN users u ON tc.user_id = u.id
         WHERE tc.test_id = $1
         ORDER BY tc.created_at DESC`,
        [testId]
      );
      
      // Mapping for user nesting
      return result.rows.map(row => ({
        ...row,
        user: row.username ? {
          id: row.user_id,
          username: row.username,
          profile_image_url: row.profile_image_url
        } : undefined
      })) as TestComment[];
    } catch (error) {
      console.error('Error fetching test comments:', error);
      return [];
    }
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    try {
      const result = await pool.query(
        `INSERT INTO test_comments (
          test_id, user_id, content
        ) VALUES ($1, $2, $3) 
        RETURNING *`,
        [
          comment.test_id,
          comment.user_id,
          comment.content
        ]
      );
      
      // Kullanıcı bilgilerini de al
      const user = await pool.query(
        'SELECT id, username, profile_image_url FROM users WHERE id = $1',
        [comment.user_id]
      );
      
      // Test bilgilerini al (aktivite için)
      const test = await pool.query(
        'SELECT title FROM tests WHERE id = $1',
        [comment.test_id]
      );
      
      // Kullanıcı aktivitesi kaydet
      await pool.query(
        `INSERT INTO user_activities (
          user_id, user_name, activity_type, details, entity_id, entity_type
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          comment.user_id,
          user.rows[0]?.username,
          'comment_test',
          `Teste yorum yapıldı: ${test.rows[0]?.title || `Test #${comment.test_id}`}`,
          comment.test_id,
          'test'
        ]
      );
      
      // Yorum ve kullanıcı bilgilerini birleştir
      const commentWithUser = {
        ...result.rows[0],
        user: user.rows[0] ? {
          id: user.rows[0].id,
          username: user.rows[0].username,
          profile_image_url: user.rows[0].profile_image_url
        } : undefined
      };
      
      return commentWithUser as TestComment;
    } catch (error) {
      console.error('Error creating test comment:', error);
      throw new Error(`Test comment creation failed: ${error}`);
    }
  }

  // Oyun puanları
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    try {
      const result = await pool.query(
        `INSERT INTO game_scores (
          user_id, game_mode, score, details
        ) VALUES ($1, $2, $3, $4) 
        RETURNING *`,
        [
          score.user_id,
          score.game_mode,
          score.score,
          score.details ? JSON.stringify(score.details) : null
        ]
      );
      
      // Kullanıcı puanını da güncelle
      if (score.user_id) {
        await this.updateUserScore(score.user_id, score.score);
        
        // Kullanıcı aktivitesi
        await pool.query(
          `INSERT INTO user_activities (
            user_id, activity_type, details, entity_type
          ) VALUES ($1, $2, $3, $4)`,
          [
            score.user_id,
            'game_score',
            `Oyun skoru: ${score.score} puan, mod: ${score.game_mode}`,
            'game'
          ]
        );
      }
      
      return result.rows[0] as GameScore;
    } catch (error) {
      console.error('Error saving game score:', error);
      throw new Error(`Game score creation failed: ${error}`);
    }
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM game_scores WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows as GameScore[];
    } catch (error) {
      console.error('Error fetching user scores:', error);
      return [];
    }
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    try {
      let query = `
        SELECT gs.*, u.username, u.profile_image_url
        FROM game_scores gs
        LEFT JOIN users u ON gs.user_id = u.id
      `;
      
      const params = [];
      if (gameMode) {
        query += ' WHERE gs.game_mode = $1';
        params.push(gameMode);
      }
      
      query += ' ORDER BY gs.score DESC';
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }
      
      const result = await pool.query(query, params);
      
      // Map results to include user data
      return result.rows.map(row => ({
        ...row,
        user: row.username ? {
          id: row.user_id,
          username: row.username,
          profile_image_url: row.profile_image_url
        } : undefined
      })) as GameScore[];
    } catch (error) {
      console.error('Error fetching top scores:', error);
      return [];
    }
  }

  // Kullanıcı aktiviteleri
  async getUserActivities(userId: number, limit: number = 50): Promise<UserActivity[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );
      return result.rows as UserActivity[];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  async getLatestActivities(limit: number = 50): Promise<UserActivity[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM user_activities ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows as UserActivity[];
    } catch (error) {
      console.error('Error fetching latest activities:', error);
      return [];
    }
  }
}

export const pgStorage = new PostgresStorage();