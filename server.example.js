/**
 * Example plugin server for hosting VST plugins
 * This is a simple Express server that serves plugin files
 * In production, you would use a more robust solution with authentication, caching, etc.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from public directory
app.use(express.static('public'));

// Get list of available plugins
app.get('/api/plugins/list', (req, res) => {
  const pluginListPath = path.join(__dirname, 'public', 'plugins', 'list.json');
  
  try {
    const pluginList = JSON.parse(fs.readFileSync(pluginListPath, 'utf8'));
    res.json(pluginList);
  } catch (error) {
    console.error('Error reading plugin list:', error);
    res.status(500).json({ error: 'Failed to read plugin list' });
  }
});

// Serve individual plugin files
app.get('/api/plugins/:filename', (req, res) => {
  const filename = req.params.filename;
  const pluginPath = path.join(__dirname, 'public', 'plugins', filename);
  
  // Security: prevent directory traversal
  if (!pluginPath.startsWith(path.join(__dirname, 'public', 'plugins'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    if (fs.existsSync(pluginPath)) {
      res.sendFile(pluginPath);
    } else {
      res.status(404).json({ error: 'Plugin not found' });
    }
  } catch (error) {
    console.error('Error serving plugin:', error);
    res.status(500).json({ error: 'Failed to serve plugin' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Plugin server running on http://localhost:${PORT}`);
  console.log(`Plugin list available at http://localhost:${PORT}/api/plugins/list`);
});
