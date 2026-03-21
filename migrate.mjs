import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migration done");
await conn.end();
