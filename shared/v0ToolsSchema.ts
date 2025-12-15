import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// V0 Projects - Projects for AI app generation
export const v0Projects = pgTable('v0_projects', {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional project metadata
});

export const insertV0ProjectSchema = createInsertSchema(v0Projects).omit({
  id: true,
});

// V0 Chats - Chat conversations within projects
export const v0Chats = pgTable('v0_chats', {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  v0ChatId: text("v0_chat_id"), // ID from v0 platform API
  chatType: text("chat_type").notNull().default('app'), // 'app' or 'continuation'
  parentChatId: integer("parent_chat_id"), // For forked chats
  status: text("status").notNull().default('active'), // active, archived, deleted
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Chat metadata including preview URLs, attachments
});

export const insertV0ChatSchema = createInsertSchema(v0Chats).omit({
  id: true,
});

// V0 Chat Messages - Individual messages in chats
export const v0ChatMessages = pgTable('v0_chat_messages', {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  v0MessageId: text("v0_message_id"), // ID from v0 platform API
  orderIndex: integer("order_index").notNull(), // Position in conversation
  attachments: jsonb("attachments"), // File attachments
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Message metadata
});

export const insertV0ChatMessageSchema = createInsertSchema(v0ChatMessages).omit({
  id: true,
});

// V0 Deployments - Deployment records for generated apps
export const v0Deployments = pgTable('v0_deployments', {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull().default('vercel'), // vercel, netlify, etc.
  deploymentUrl: text("deployment_url"), // URL where app is deployed
  deploymentId: text("deployment_id"), // ID from deployment platform
  status: text("status").notNull().default('pending'), // pending, in_progress, success, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  logs: jsonb("logs"), // Deployment logs
  error: text("error"), // Error message if deployment failed
  metadata: jsonb("metadata"), // Additional deployment metadata
});

export const insertV0DeploymentSchema = createInsertSchema(v0Deployments).omit({
  id: true,
});

// Rate Limit Records - Track API usage for rate limiting
export const rateLimitRecords = pgTable('rate_limit_records', {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(), // IP address or user ID
  action: text("action").notNull().default('generation'), // Type of action being rate limited
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional context
});

export const insertRateLimitRecordSchema = createInsertSchema(rateLimitRecords).omit({
  id: true,
});

// Export types
export type V0Project = typeof v0Projects.$inferSelect;
export type InsertV0Project = z.infer<typeof insertV0ProjectSchema>;

export type V0Chat = typeof v0Chats.$inferSelect;
export type InsertV0Chat = z.infer<typeof insertV0ChatSchema>;

export type V0ChatMessage = typeof v0ChatMessages.$inferSelect;
export type InsertV0ChatMessage = z.infer<typeof insertV0ChatMessageSchema>;

export type V0Deployment = typeof v0Deployments.$inferSelect;
export type InsertV0Deployment = z.infer<typeof insertV0DeploymentSchema>;

export type RateLimitRecord = typeof rateLimitRecords.$inferSelect;
export type InsertRateLimitRecord = z.infer<typeof insertRateLimitRecordSchema>;

// Enums for reference
export enum V0ChatType {
  APP = 'app',
  CONTINUATION = 'continuation',
}

export enum V0ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum V0DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum V0DeploymentPlatform {
  VERCEL = 'vercel',
  NETLIFY = 'netlify',
  GITHUB_PAGES = 'github_pages',
}
