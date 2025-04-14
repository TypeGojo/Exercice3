//Script pour créer un Admin
const knex = require('knex')(require('./knexfile').development);
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await knex('users').insert({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdmin();

  