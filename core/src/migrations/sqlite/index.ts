import { InitialMigration1577688064632 } from './1577688064632-InitialMigration'
import { VersionType1601037334269 } from './1601037334269-VersionType'
import { VersionAbbreviation1602683683972 } from './1602683683972-VersionAbbreviation'
export default {
  name: 'sqlite',
  migrations: [InitialMigration1577688064632, VersionType1601037334269, VersionAbbreviation1602683683972],
}
