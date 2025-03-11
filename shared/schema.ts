import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  score: integer("score").default(0),
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

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  imageId: integer("image_id").notNull(),
  gameMode: text("game_mode").notNull(),
  attemptsCount: integer("attempts_count").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  score: integer("score").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  userId: true,
  imageId: true,
  gameMode: true,
  attemptsCount: true,
  timeSpent: true,
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
