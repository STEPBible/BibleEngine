import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { DB } from 'generated/db';
import { FileMigrationProvider, Kysely, Migrator, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import * as path from 'path';
import { run } from './run.js';

function connect(
    envPath: string | undefined,
    password: string | undefined
): [Kysely<any>, Migrator] {
    const { parsed: DOTENV } = dotenv.config({
        path: envPath || path.resolve(__dirname, '../.env'),
    });

    const db = new Kysely<DB>({
        dialect: new MysqlDialect({
            pool: createPool({
                database: DOTENV?.DB_NAME,
                user: DOTENV?.DB_USER,
                password: password || DOTENV?.DB_PASS,
                host: DOTENV?.DB_SERVER || undefined,
                port: DOTENV?.DB_PORT ? Number(DOTENV?.DB_PORT) : undefined,
                socketPath: DOTENV?.DB_SOCKET || undefined,
            }),
        }),
    });

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.resolve(__dirname, './migrations'),
        }),
    });

    return [db, migrator];
}

run(connect, path.resolve(__dirname, './migrations'));
