import { MigrationProvider } from 'kysely';
import _1 from './migrations/0001-initial.js';

export const beMigrationProvider: MigrationProvider = {
    getMigrations: async () => ({
        '0001-initial': _1,
    }),
};

export type { DB } from './generated/db';
