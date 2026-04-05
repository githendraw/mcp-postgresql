#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
});

// Validate SQL queries to ensure they are read-only
function isReadOnlyQuery(sql) {
  const query = sql.trim().toUpperCase();

  // Block any write operations
  const writeOperations = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'TRUNCATE', 'REPLACE', 'RENAME', 'GRANT', 'REVOKE'
  ];

  for (const operation of writeOperations) {
    if (query.startsWith(operation)) {
      return false;
    }
  }

  return true;
}

// Create MCP server
const server = new Server(
  {
    name: 'mcp-postgresql',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: 'Execute a read-only SQL query against the PostgreSQL database. Only SELECT queries are allowed. Returns query results as JSON.',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'The SQL query to execute (must be a SELECT query)',
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the current database schema',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'describe_table',
        description: 'Get the structure of a specific table including columns, types, and constraints',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'The name of the table to describe',
            },
          },
          required: ['table_name'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'query') {
      const { sql } = args;

      if (!sql) {
        throw new Error('SQL query is required');
      }

      // Validate that the query is read-only
      if (!isReadOnlyQuery(sql)) {
        throw new Error('Only read-only SELECT queries are allowed. Write operations (INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, etc.) are not permitted.');
      }

      const result = await pool.query(sql);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: result.rows,
              rowCount: result.rowCount,
              fields: result.fields.map(f => ({
                name: f.name,
                dataTypeID: f.dataTypeID,
              })),
            }, null, 2),
          },
        ],
      };
    }

    if (name === 'list_tables') {
      const result = await pool.query(`
        SELECT
          table_name,
          table_schema
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name
      `);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              tables: result.rows,
              count: result.rowCount,
            }, null, 2),
          },
        ],
      };
    }

    if (name === 'describe_table') {
      const { table_name } = args;

      if (!table_name) {
        throw new Error('table_name is required');
      }

      // Get column information
      const columnsResult = await pool.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);

      // Get primary key information
      const pkResult = await pool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
      `, [table_name]);

      // Get foreign key information
      const fkResult = await pool.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      `, [table_name]);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              table_name: table_name,
              columns: columnsResult.rows,
              primary_keys: pkResult.rows.map(r => r.attname),
              foreign_keys: fkResult.rows,
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.error('PostgreSQL connection established successfully');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error.message);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP PostgreSQL server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
