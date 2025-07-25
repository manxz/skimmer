const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('./generated/prisma');
const { exec } = require('child_process');

const app = express();
const prisma = new PrismaClient();

// Run database migrations on startup
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const { exec } = require('child_process');
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        console.error('Migration error:', error);
      } else {
        console.log('Migrations completed successfully');
      }
    });
  } catch (err) {
    console.error('Failed to run migrations:', err);
  }
}

// Run migrations when the app starts
runMigrations();

app.use(cors());
app.use(express.json());

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Raw request body:', req.body);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Skimmer backend is running!' });
});

// Get all clients
app.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get a single client by ID
app.get('/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create a new client
app.post('/clients', async (req, res) => {
  try {
    const { name, address, phone, email, serviceDay, servicePerson } = req.body;
    console.log('Received request:', { name, address, phone, email, serviceDay, servicePerson });
    
    if (!name || !address || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const clientData = { name, address, phone, email, serviceDay, servicePerson };
    console.log('Creating client with data:', clientData);
    
    const client = await prisma.client.create({
      data: clientData,
    });
    
    console.log('Created client:', client);
    res.status(201).json(client);
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update a client
app.put('/clients/:id', async (req, res) => {
  try {
    const { name, address, phone, email, serviceDay, servicePerson } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, address, phone, email, serviceDay, servicePerson },
    });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete a client
app.delete('/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); // Force redeploy
// Force redeploy
// Regenerate Prisma client
// Database reset and Prisma client regenerated
