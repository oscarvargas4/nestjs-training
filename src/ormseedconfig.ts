import ormconfig from '@app/ormconfig';

const ormseedcongfig = {
  ...ormconfig,
  migrations: [__dirname + '/seeds/*.ts'],
  cli: {
    migrationsDir: 'src/seeds',
  }
};

export default ormseedcongfig;