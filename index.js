const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const routes = require('./routes'); // Importer le fichier routes.js

// Middleware
app.use(express.json());

// Utiliser les routes
app.use('/api', routes);

// Start du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
