/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
exports.up = function(knex) {
    return knex.schema.createTable('tickets', function(table) {
      table.increments('id').primary(); // ID ticket unique
      table.string('title').notNullable(); // Titre du ticket
      table.text('description').notNullable(); // Description détaillée
      table.string('status').defaultTo('open'); // Statut (open, in progress, closed)
      table.integer('userId').unsigned().notNullable().references('id').inTable('users'); // ID de l'utilisateur
      table.integer('technicianId').unsigned().references('id').inTable('users'); // ID du technicien ou NULL
      table.timestamp('createdAt').defaultTo(knex.fn.now()); // Date de création
      table.timestamp('closedAt').nullable(); // Date de fermeture ou NULL
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('tickets');
  };
  