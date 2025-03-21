import { pgTable, text, serial, integer, timestamp, boolean, jsonb, uuid, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(), // Supabase Auth ID
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  score: integer("score").default(0),
  avatar: text("avatar"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userName: text("user_name"), // Optional cached username for better display
  activityType: text("activity_type").notNull(),  // login, create_test, play_test, like_test, comment
  details: text("details"), // Human-readable description of the activity
  entityId: integer("entity_id"), // ID of the related entity (test, image, etc.)
  entityType: text("entity_type"), // Type of the related entity (test, image, etc.)
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  iconName: text("icon_name"), // Lucide or react-icons name
  color: text("color").default("#4F46E5"), // Varsayılan renk - indigo-600
  backgroundColor: text("background_color"), // Arka plan rengi
  order: integer("order").default(0), // Sıralama için
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  storageKey: text("storage_key"), // Supabase Storage key
  categoryId: integer("category_id").notNull().references(() => categories.id),
  answers: jsonb("answers").notNull(), // Array of acceptable answers
  hints: jsonb("hints"), // Array of hints
  difficulty: integer("difficulty").default(1),
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at"),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(), // For public sharing
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id), // null if created by system (anonymous)
  categoryId: integer("category_id").references(() => categories.id),
  imageIds: jsonb("image_ids").notNull(), // Array of image IDs
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublic: boolean("is_public").default(true),
  approved: boolean("approved").default(false), // Admin onaylı mı?
  featured: boolean("featured").default(false), // Öne çıkarıldı mı?
  difficulty: integer("difficulty").default(2), // Average difficulty
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  thumbnail: text("thumbnail"), // URL for test thumbnail
  settings: jsonb("settings"), // Test ayarları (zaman limiti, soru sayısı vb.)
});

export const testComments = pgTable("test_comments", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  testId: integer("test_id").notNull(),
  completionTime: integer("completion_time"), // in seconds
  attemptsCount: integer("attempts_count").notNull(),
  score: integer("score").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  uuid: true,
  username: true,
  password: true,
  email: true,
  avatar: true,
  role: true,
  banned: true,
  lastLoginAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick({
  userId: true,
  activityType: true,
  entityId: true,
  entityType: true,
  metadata: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  iconUrl: true,
  iconName: true,
  color: true,
  backgroundColor: true,
  order: true,
  active: true,
});

export const insertImageSchema = createInsertSchema(images).pick({
  title: true,
  imageUrl: true,
  storageKey: true,
  categoryId: true,
  answers: true,
  hints: true,
  difficulty: true,
  active: true,
  createdBy: true,
});

export const insertTestSchema = createInsertSchema(tests).pick({
  title: true,
  description: true,
  creatorId: true,
  categoryId: true,
  imageIds: true,
  isPublic: true,
  approved: true,
  featured: true,
  difficulty: true,
  thumbnail: true,
  settings: true,
});

export const insertTestCommentSchema = createInsertSchema(testComments).pick({
  testId: true,
  userId: true,
  comment: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  userId: true,
  testId: true,
  completionTime: true,
  attemptsCount: true,
  score: true,
  completed: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertTestComment = z.infer<typeof insertTestCommentSchema>;
export type TestComment = typeof testComments.$inferSelect;

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScores.$inferSelect;

export const gameModesEnum = z.enum([
  "classic",
  "speed",
  "time",
  "live",
  "test"
]);

export type GameMode = z.infer<typeof gameModesEnum>;
