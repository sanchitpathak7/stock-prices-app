const express = require('express');
const path = require('path');
const { getStockData, createAllMockData } = require('./utils/stockData');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data fetching
let initialDataFetchStarted = false;

// API endpoint to get top stocks
app.get('/api/stocks', async (req, res) => {
  try {
    console.log('Received request for /api/stocks');
    
    // Start initial data fetch if not started yet
    if (!initialDataFetchStarted) {
      initialDataFetchStarted = true;
      
      // Return mock data immediately while starting real fetch in background
      console.log('Returning mock data while fetching real data in background...');
      res.json(createAllMockData());
      
      // Start real data fetch in background (don't wait for it)
      getStockData().catch(err => console.error('Background fetch error:', err));
      return;
    }
    
    // For subsequent requests, get the current data (cached or fetch new)
    const stockData = await getStockData();
    console.log(`Returning ${stockData.length} stocks`);
    res.json(stockData);
  } catch (error) {
    console.error('Error in /api/stocks endpoint:', error);
    res.json(createAllMockData());
  }
});

// API endpoint to force refresh stock data
app.get('/api/stocks/refresh', async (req, res) => {
  try {
    console.log('Received request for /api/stocks/refresh');
    
    // For refresh, always return something immediately
    res.json(await getStockData(true));
  } catch (error) {
    console.error('Error in /api/stocks/refresh endpoint:', error);
    res.json(createAllMockData());
  }
});

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness probe endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Stock price app listening at http://localhost:${port}`);
});