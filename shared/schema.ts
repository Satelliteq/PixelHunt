import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  score: integer("score").default(0),
  avatar: text("avatar"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  answers: jsonb("answers").notNull(), // Array of acceptable answers
  difficulty: integer("difficulty").default(1),
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id"), // null if created by system (anonymous)
  categoryId: integer("category_id"),
  imageIds: jsonb("image_ids").notNull(), // Array of image IDs
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  thumbnail: text("thumbnail"), // URL for test thumbnail
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
  username: true,
  password: true,
  avatar: true,
  role: true,
  banned: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  iconUrl: true,
});

export const insertImageSchema = createInsertSchema(images).pick({
  title: true,
  imageUrl: true,
  categoryId: true,
  answers: true,
  difficulty: true,
});

export const insertTestSchema = createInsertSchema(tests).pick({
  title: true,
  description: true,
  creatorId: true,
  categoryId: true,
  imageIds: true,
  isPublic: true,
  thumbnail: true,
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
