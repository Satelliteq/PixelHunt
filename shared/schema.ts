import { pgTable, text, serial, integer, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User tablosu (Supabase Auth ile entegre çalışacak şekilde tasarlandı)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: text("auth_id").unique(), // Supabase Auth ID
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  score: integer("score").default(0),
  avatar: text("avatar"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Kategori tablosu
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Görsel tablosu
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  answers: jsonb("answers").notNull(), // Kabul edilebilir cevaplar dizisi
  difficulty: integer("difficulty").default(1), // 1:Kolay, 2:Orta, 3:Zor, 4:Çok Zor, 5:Uzman
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test tablosu
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").notNull().unique().defaultRandom(), // Rastgele UUID
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id"), // Sistemin oluşturduğu testler için null
  categoryId: integer("category_id"),
  imageIds: jsonb("image_ids").notNull(), // Görsel ID'leri dizisi
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublic: boolean("is_public").default(true),
  anonymousCreator: boolean("anonymous_creator").default(false), // Kullanıcının anonim olarak paylaşıp paylaşmadığı
  difficulty: integer("difficulty").default(1), // 1:Kolay, 2:Orta, 3:Zor, 4:Çok Zor, 5:Uzman
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  thumbnail: text("thumbnail"), // Test kapak görseli URL'i
  approved: boolean("approved").default(true), // Admin onayı gerektiğinde kullanılacak
  published: boolean("published").default(true), // Yayından kaldırma durumu için
});

// Test yorumları tablosu
export const testComments = pgTable("test_comments", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Oyun skorları tablosu
export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  testId: integer("test_id").notNull(),
  gameMode: text("game_mode").notNull(), // Oyun modu: classic, speed, time, live, test
  completionTime: integer("completion_time"), // Tamamlama süresi (saniye)
  attemptsCount: integer("attempts_count").notNull(), // Deneme sayısı 
  score: integer("score").notNull(), // Puan
  completed: boolean("completed").default(false), // Tamamlandı mı?
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  authId: true,
  username: true,
  email: true,
  password: true,
  avatar: true,
  role: true,
  banned: true,
  score: true,
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
  anonymousCreator: true,
  difficulty: true,
  thumbnail: true,
  approved: true,
  published: true,
});

export const insertTestCommentSchema = createInsertSchema(testComments).pick({
  testId: true,
  userId: true,
  comment: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  userId: true,
  testId: true,
  gameMode: true,
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
