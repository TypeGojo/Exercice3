const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse les requêtes JSON

// Test route
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de support!');
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
