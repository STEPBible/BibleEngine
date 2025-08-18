import { BibleEngine, BibleEngineOptions } from '@bible-engine/core';
import { beMigrationProvider } from '@bible-engine/db-schema';
import { DB } from '@bible-engine/db-schema/generated/db';
import { Kysely, Migrator, sql } from 'kysely';
import { BibleEngineImporter } from './shared/Importer.interface';
interface Constructable<T> {
    new (...args: any): T;
}

export class BeDatabaseCreator {
    bibleEngine: BibleEngine;
    private importers: BibleEngineImporter[] = [];

    constructor(db: Kysely<DB>, options?: BibleEngineOptions) {
        this.bibleEngine = new BibleEngine(db, options);
    }

    addImporter<T extends BibleEngineImporter>(
        Importer: Constructable<T>,
        options: T['options'] = {}
    ) {
        this.importers.push(new Importer(this.bibleEngine, options));
    }

    async createDatabase() {
        const db = this.bibleEngine.db;
        const dbType = await this.bibleEngine.getDbType();

        try {
            if (dbType === 'sqlite') {
                // For SQLite, we can use PRAGMA to disable foreign keys temporarily
                await sql`PRAGMA foreign_keys = OFF`.execute(db);

                // Get all tables using SQLite's system tables
                const tables = await sql<{ name: string }>`
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    AND name NOT LIKE 'sqlite_%'
                `.execute(db);

                // Drop all tables
                for (const table of tables.rows) {
                    await db.schema.dropTable(table.name).ifExists().execute();
                }

                // Re-enable foreign keys
                await sql`PRAGMA foreign_keys = ON`.execute(db);
            } else {
                // For MySQL, disable foreign key checks
                await sql`SET FOREIGN_KEY_CHECKS = 0`.execute(db);

                // Get all tables from MySQL's information schema
                const tables = await sql<{ name: string }>`
                    SELECT table_name as name 
                    FROM information_schema.tables 
                    WHERE table_schema = DATABASE()
                `.execute(db);

                // Drop all tables
                for (const table of tables.rows) {
                    await db.schema.dropTable(table.name).ifExists().execute();
                }

                // Re-enable foreign key checks
                await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(db);
            }
        } catch (error) {
            console.warn(`Error cleaning database: ${error}`);

            // Make sure to re-enable foreign key constraints even if there was an error
            if (dbType === 'sqlite') {
                await sql`PRAGMA foreign_keys = ON`.execute(db).catch(() => {});
            } else {
                await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(db).catch(() => {});
            }
        }

        // Run migrations
        const migrator = new Migrator({
            db,
            provider: beMigrationProvider,
        });
        const { error, results } = await migrator.migrateToLatest();

        results?.forEach((it) => {
            if (it.status === 'Success') {
                console.log(`migration "${it.migrationName}" was executed successfully`);
            } else if (it.status === 'Error') {
                console.error(`failed to execute migration "${it.migrationName}"`);
            }
        });

        if (error) {
            console.error('failed to run `migrateToLatest`');
            console.error(error);
        }

        // Run importers
        for (const importer of this.importers) {
            await importer.run();
        }
    }
}
