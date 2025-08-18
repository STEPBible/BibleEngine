// This file is based on https://github.com/acro5piano/kysely-migration-cli

import * as fs from 'fs';

import { program } from 'commander';
import { Kysely, MigrationResultSet, Migrator } from 'kysely';

function showResults({ error, results }: MigrationResultSet) {
    if (error) {
        console.error(error);
        process.exit(1);
    }
    results?.forEach((it) => console.log(`> ${it.migrationName}`));
}

export function run(
    connect: (envPath: string | undefined, password: string | undefined) => [Kysely<any>, Migrator],
    path = './migrations'
) {
    let db: Kysely<any> | undefined = undefined;
    let migrator: Migrator | undefined = undefined;

    program
        .command('up')
        .description('Run a pending migration if any')
        .action(async () => {
            console.log('Running single migration');
            const results = await migrator!.migrateUp();
            showResults(results);
        });

    program
        .command('down')
        .description('Revert the latest migration with a down file')
        .action(async () => {
            console.log('Reverting migrations');
            const results = await migrator!.migrateDown();
            showResults(results);
        });

    program
        .command('to')
        .description('Migrate up or down to a specific migration')
        .action(async () => {
            if (!process.argv[3])
                showResults({ error: 'Please pass a migration name as an argument' });
            else {
                console.log('Migrate to ' + process.argv[3]);
                const results = await migrator!.migrateTo(process.argv[3]);
                showResults(results);
            }
        });

    program
        .command('redo')
        .description('Down and Up')
        .action(async () => {
            console.log('Reverting one migration');
            let results = await migrator!.migrateDown();
            showResults(results);
            console.log('Running single migration');
            results = await migrator!.migrateUp();
            showResults(results);
        });

    program
        .command('latest')
        .description('Run all pending migrations')
        .action(async () => {
            console.log('Running migrations');
            const results = await migrator!.migrateToLatest();
            showResults(results);
        });

    program
        .command('create')
        .argument('<description>')
        .description(
            'Create a new migration with the given name (convention: [ISSUE-ID]-[DESCRIPTION])'
        )
        .action(async (name) => {
            // get the last file in $path and increment the version
            const files = fs.readdirSync(path);
            const lastFile = files[files.length - 1];
            const lastVersion = lastFile?.split('-')[0] ? lastFile.split('-')[0] : '0';
            const version = parseInt(lastVersion!) + 1;
            // create a filename with the version, zero-padded to 4 digits
            const fileName = `${path}/${version.toString().padStart(4, '0')}-${name}.ts`;

            // const dateStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
            // const fileName = `${path}/${dateStr}-${name}.ts`;
            const mkdir = () => fs.mkdirSync(path);
            try {
                if (!fs.lstatSync(path).isDirectory()) {
                    mkdir();
                }
            } catch {
                fs.mkdirSync(path);
            }
            fs.writeFileSync(fileName, TEMPLATE, 'utf8');
            console.log('Created Migration:', fileName);
        });

    program
        .option('-p, --password', 'read db password from stdin')
        .option('-e, --env <path>', 'path to .env file');

    program.hook('preAction', async (thisCommand) => {
        let password: string | undefined = undefined;
        if (thisCommand.opts().password) {
            const stdin = await fs.promises.open('/dev/stdin');
            password = await fs.promises
                .readFile(stdin, 'utf8')
                .then((pw) => pw.replace(/\n$/, ''));
            await stdin.close();
        }
        [db, migrator] = connect(thisCommand.opts().env, password);
    });

    program.parseAsync().then(() => db!.destroy());
}

const TEMPLATE = `import { Kysely } from 'kysely'
export async function up(db: Kysely<any>): Promise<void> {
}
export async function down(db: Kysely<any>): Promise<void> {
}
`;
