import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    schema: './db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        user: 'postgres',
        password: 'test123',
        ssl: false,
    }
});