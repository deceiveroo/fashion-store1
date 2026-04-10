import { pgTable, text, integer, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { users } from './schema';

// Уровни пользователя
export const userLevels = pgTable('user_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  xpToNextLevel: integer('xp_to_next_level').notNull().default(100),
  title: text('title').notNull().default('Новичок'),
  coins: integer('coins').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Достижения
export const achievements = pgTable('achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // first_purchase, fashionista, vip_member
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji или lucide icon name
  category: text('category').notNull(), // shopping, social, special
  xpReward: integer('xp_reward').notNull().default(0),
  coinsReward: integer('coins_reward').notNull().default(0),
  rarity: text('rarity').notNull().default('common'), // common, rare, epic, legendary
  requirement: jsonb('requirement').notNull(), // { type: 'purchase_count', value: 1 }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Достижения пользователей
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  seen: boolean('seen').notNull().default(false),
});

// Ежедневные квесты
export const dailyQuests = pgTable('daily_quests', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(), // daily_login, add_to_cart, leave_review
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  xpReward: integer('xp_reward').notNull().default(10),
  coinsReward: integer('coins_reward').notNull().default(5),
  requirement: jsonb('requirement').notNull(), // { type: 'login', value: 1 }
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Прогресс квестов пользователя
export const userQuestProgress = pgTable('user_quest_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questId: uuid('quest_id').notNull().references(() => dailyQuests.id, { onDelete: 'cascade' }),
  progress: integer('progress').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  date: timestamp('date').defaultNow().notNull(), // для ежедневного сброса
});

// История XP
export const xpHistory = pgTable('xp_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(), // purchase, quest, achievement
  metadata: jsonb('metadata'), // дополнительная информация
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Лидерборд
export const leaderboard = pgTable('leaderboard', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  period: text('period').notNull(), // weekly, monthly, all_time
  rank: integer('rank').notNull(),
  score: integer('score').notNull(), // XP или другая метрика
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
