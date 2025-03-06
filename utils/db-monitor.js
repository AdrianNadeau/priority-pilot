const dbConfig = require("./config/db.config.js");
const { Client } = require("pg");
require("dotenv").config();

// PostgreSQL connection configuration
const config = {
  host: process.env.DB_HOST_NAME,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

async function monitorConnections() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    const query = `
      SELECT pid, usename, application_name, client_addr, state, query, now() - query_start AS duration
      FROM pg_stat_activity
      WHERE state <> 'idle'
      ORDER BY duration DESC;
    `;

    const res = await client.query(query);
    console.table(res.rows);
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await client.end();
  }
}

// Monitor connections every 10 seconds
setInterval(monitorConnections, 10000);
