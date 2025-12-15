#!/usr/bin/env node

/**
 * Database migration script for v0 tools tables
 * 
 * This script creates the necessary tables for v0-like AI app generation features.
 * Run this after setting up your PostgreSQL database.
 */

const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = ws;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const migrations = [
  {
    name: 'Create v0_projects table',
    sql: `
      CREATE TABLE IF NOT EXISTS v0_projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
      
      CREATE INDEX IF NOT EXISTS idx_v0_projects_user_id ON v0_projects(user_id);
    `
  },
  {
    name: 'Create v0_chats table',
    sql: `
      CREATE TABLE IF NOT EXISTS v0_chats (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        v0_chat_id TEXT,
        chat_type TEXT NOT NULL DEFAULT 'app',
        parent_chat_id INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        CONSTRAINT fk_v0_chats_project FOREIGN KEY (project_id) REFERENCES v0_projects(id) ON DELETE CASCADE,
        -- Self-referencing foreign key for chat forking: parent_chat_id references the original chat
        CONSTRAINT fk_v0_chats_parent FOREIGN KEY (parent_chat_id) REFERENCES v0_chats(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_v0_chats_project_id ON v0_chats(project_id);
      CREATE INDEX IF NOT EXISTS idx_v0_chats_user_id ON v0_chats(user_id);
      CREATE INDEX IF NOT EXISTS idx_v0_chats_status ON v0_chats(status);
    `
  },
  {
    name: 'Create v0_chat_messages table',
    sql: `
      CREATE TABLE IF NOT EXISTS v0_chat_messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        v0_message_id TEXT,
        order_index INTEGER NOT NULL,
        attachments JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        CONSTRAINT fk_v0_chat_messages_chat FOREIGN KEY (chat_id) REFERENCES v0_chats(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_v0_chat_messages_chat_id ON v0_chat_messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_v0_chat_messages_order ON v0_chat_messages(chat_id, order_index);
    `
  },
  {
    name: 'Create v0_deployments table',
    sql: `
      CREATE TABLE IF NOT EXISTS v0_deployments (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        platform TEXT NOT NULL DEFAULT 'vercel',
        deployment_url TEXT,
        deployment_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        logs JSONB,
        error TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        CONSTRAINT fk_v0_deployments_chat FOREIGN KEY (chat_id) REFERENCES v0_chats(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_v0_deployments_chat_id ON v0_deployments(chat_id);
      CREATE INDEX IF NOT EXISTS idx_v0_deployments_user_id ON v0_deployments(user_id);
      CREATE INDEX IF NOT EXISTS idx_v0_deployments_status ON v0_deployments(status);
    `
  },
  {
    name: 'Create rate_limit_records table',
    sql: `
      CREATE TABLE IF NOT EXISTS rate_limit_records (
        id SERIAL PRIMARY KEY,
        identifier TEXT NOT NULL,
        action TEXT NOT NULL DEFAULT 'generation',
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
      
      CREATE INDEX IF NOT EXISTS idx_rate_limit_records_identifier ON rate_limit_records(identifier, action, timestamp);
    `
  }
];

async function runMigrations() {
  console.log('🚀 Starting v0 tools database migration...\n');
  
  const client = await pool.connect();
  
  try {
    for (const migration of migrations) {
      console.log(`📝 Running: ${migration.name}...`);
      await client.query(migration.sql);
      console.log(`✅ Completed: ${migration.name}\n`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - v0_projects: Store AI app generation projects');
    console.log('  - v0_chats: Store chat conversations');
    console.log('  - v0_chat_messages: Store individual messages');
    console.log('  - v0_deployments: Track app deployments');
    console.log('  - rate_limit_records: Rate limiting for API calls');
    console.log('\n✨ You can now use the V0 Tools features!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
