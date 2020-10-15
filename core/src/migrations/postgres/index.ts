import { InitialMigration1581232232432 } from './1581232232432-InitialMigration';
import { VersionType1601036751250 } from './1601036751250-VersionType';
import { VersionAbbreviation1602683683972 } from './1602683683972-VersionAbbreviation';
export default {
    name: 'postgres',
    migrations: [InitialMigration1581232232432, VersionType1601036751250, VersionAbbreviation1602683683972]
};
