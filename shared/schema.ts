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
  iconname: text("iconname"), // Lucide ikon adı (veritabanı kolonu ile eşleşecek şekilde)
  color: text("color"), // Kategori rengi
  backgroundcolor: text("backgroundcolor"), // Arka plan rengi
  imageurl: text("imageurl"), // Resim URL'si
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
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
  uuid: text("uuid").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  creator_id: integer("creator_id").references(() => users.id),
  category_id: integer("category_id").references(() => categories.id),
  image_ids: jsonb("image_ids").notNull(),
  questions: jsonb("questions").notNull(),
  difficulty: integer("difficulty").default(2),
  play_count: integer("play_count").default(0),
  like_count: integer("like_count").default(0),
  is_public: boolean("is_public").default(true),
  is_anonymous: boolean("is_anonymous").default(false),
  approved: boolean("approved").default(true),
  featured: boolean("featured").default(false),
  thumbnail: text("thumbnail"),
  settings: jsonb("settings"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
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
  userName: true,
  activityType: true,
  details: true,
  entityId: true,
  entityType: true,
  metadata: true,
});

export const insertCategorySchema = createInsertSchema(categories);

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

export const insertTestSchema = createInsertSchema(tests);

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
