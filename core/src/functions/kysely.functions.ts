import { DB, beMigrationProvider } from '@bible-engine/db-schema';
import { Kysely, KyselyConfig, Migrator, sql } from 'kysely';

// Typescript example in /dbSchema/migrations/0001-initial.ts
export async function isSqlite(db: Kysely<DB>): Promise<boolean> {
    try {
        // This query will only succeed for SQLite
        await sql`SELECT sqlite_version()`.execute(db);
        return true;
    } catch {
        return false;
    }
}

export function createKyselyDb(config: KyselyConfig) {
    return new Kysely<DB>(config);
}

export async function prepareKyselyDb(config: KyselyConfig) {
    const db = createKyselyDb(config);
    const migrator = new Migrator({
        db,
        provider: beMigrationProvider,
    });
    await migrator.migrateToLatest();
    return db;
}
