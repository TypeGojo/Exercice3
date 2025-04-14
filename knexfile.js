module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3', // Fichier SQLite
    },
    migrations: {
      directory: './migrations',
    },
    useNullAsDefault: true,
  },
};
