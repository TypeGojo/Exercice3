/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const bcrypt = require('bcrypt');

exports.up = async function(knex) {
  await knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('role').notNullable();
  });

  // Ajout de l'administrateur après la création de la table
  const hashedPassword = await bcrypt.hash('adminpassword', 10);
  await knex('users').insert({
    name: 'Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
