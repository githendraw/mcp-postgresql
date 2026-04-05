# PostgreSQL MCP Server for Claude Code

This MCP (Model Context Protocol) server provides PostgreSQL database integration for Claude Code, allowing you to query and interact with your PostgreSQL databases directly from Claude.

## Quick Start (Recommended)

Add this MCP server to Claude Code with environment variables:

```bash
claude mcp add postgresql "node /Users/hendraw/Hendraw/FR8LAB/mcp-postgresql/index.js" \
  --env PGHOST=localhost \
  --env PGPORT=5432 \
  --env PGDATABASE=your_database_name \
  --env PGUSER=your_username \
  --env PGPASSWORD=your_password
```

Replace the environment variable values with your actual PostgreSQL connection details.

## Alternative Installation Method

If you prefer to set environment variables separately, you can add the server first:

```bash
claude mcp add postgresql "node /Users/hendraw/Hendraw/FR8LAB/mcp-postgresql/index.js"
```

Then configure the environment variables in your Claude Code settings or system environment.

## Manual Configuration

For more control, you can manually edit the MCP configuration file:

1. **Locate your MCP configuration file** (usually in `~/.config/claude/mcp.json` or similar)
2. **Add the server configuration**:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "node",
      "args": ["/Users/hendraw/Hendraw/FR8LAB/mcp-postgresql/index.js"],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGDATABASE": "your_database_name",
        "PGUSER": "your_username",
        "PGPASSWORD": "your_password"
      }
    }
  }
}
```

## Database Configuration

Replace the environment variables with your PostgreSQL connection details:
- `PGHOST` - Your database host (e.g., localhost, or remote host)
- `PGPORT` - Database port (default: 5432)
- `PGDATABASE` - Your database name
- `PGUSER` - Your database username
- `PGPASSWORD` - Your database password

## Usage

Once configured, you can use the PostgreSQL tools in Claude Code:
- `list_tables` - List all tables in your database
- `describe_table` - Get table structure and schema information
- `query` - Execute SELECT queries and retrieve data
- `execute` - Run SQL statements (INSERT, UPDATE, DELETE, etc.)

## Troubleshooting

1. **Connection Issues**: Ensure your PostgreSQL server is running and accessible
2. **Authentication**: Verify your database credentials are correct
3. **Permissions**: Make sure the database user has the necessary permissions
4. **Environment Variables**: Double-check that all required environment variables are set

## Security Notes

- Store database credentials securely
- Consider using environment variables instead of hardcoding passwords
- Use least-privilege database users when possible
- Be cautious with sensitive data when using query tools

## Adding to Kilo Code

To add this PostgreSQL MCP server to Kilo Code:

1. **Locate Kilo Code's MCP configuration file**
   - Usually found in your Kilo Code settings or configuration directory
   - Look for a file like `mcp-settings.json` or similar

2. **Add the server configuration**

   Add the following to your Kilo Code MCP configuration:

   ```json
   {
     "mcpServers": {
       "postgresql": {
         "command": "node",
         "args": ["/Users/hendraw/Hendraw/FR8LAB/mcp-postgresql/index.js"],
         "env": {
           "PGHOST": "localhost",
           "PGPORT": "5432",
           "PGDATABASE": "your_database_name",
           "PGUSER": "your_username",
           "PGPASSWORD": "your_password"
         }
       }
     }
   }
   ```

3. **Configure your database credentials**

   Replace the environment variables with your PostgreSQL connection details:
   - `PGHOST` - Your database host (e.g., localhost, or remote host)
   - `PGPORT` - Database port (default: 5432)
   - `PGDATABASE` - Your database name
   - `PGUSER` - Your database username
   - `PGPASSWORD` - Your database password

4. **Restart Kilo Code**

   After saving the configuration, restart Kilo Code for the changes to take effect.

5. **Verify the connection**

   Once configured, you should be able to use the PostgreSQL tools in Kilo Code:
   - `list_tables` - List all tables in your database
   - `describe_table` - Get table structure
   - `query` - Execute SELECT queries