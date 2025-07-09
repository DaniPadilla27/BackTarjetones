const express = require('express');
const app = express();
const tarjetonRoutes = require('./tarjetonController');
const loginController = require('./loginController');

const cors = require('cors');

// ✅ Habilita CORS para el frontend en http://localhost:4200
app.use(cors({
  origin: 'https://front-tarjetones.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api', tarjetonRoutes);
app.use('/api', loginController);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
