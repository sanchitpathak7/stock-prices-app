const express = require('express');
const path = require('path');
const { getStockData } = require('./utils/stockData');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize stock data at startup
let initialDataFetched = false;
const initializeData = async () => {
  try {
    console.log('Pre-fetching initial stock data...');
    await getStockData();
    initialDataFetched = true;
    console.log('Initial stock data fetched successfully');
  } catch (error) {
    console.error('Failed to fetch initial stock data:', error);
    // Will retry when API endpoints are called
  }
};

// API endpoint to get top stocks
app.get('/api/stocks', async (req, res) => {
  try {
    console.log('Received request for /api/stocks');
    
    // Wait for initial data to be fetched
    if (!initialDataFetched) {
      console.log('Initial data not yet available, fetching now...');
      await initializeData();
    }
    
    const stockData = await getStockData();
    console.log(`Returning ${stockData.length} real stocks from Alpha Vantage`);
    res.json(stockData);
  } catch (error) {
    console.error('Error in /api/stocks endpoint:', error);
    res.status(503).json({ 
      error: 'Unable to fetch stock data from Alpha Vantage',
      message: error.message
    });
  }
});

// API endpoint to force refresh stock data
app.get('/api/stocks/refresh', async (req, res) => {
  try {
    console.log('Received request for /api/stocks/refresh');
    const stockData = await getStockData(true);
    console.log(`Returning ${stockData.length} freshly fetched stocks`);
    res.json(stockData);
  } catch (error) {
    console.error('Error in /api/stocks/refresh endpoint:', error);
    res.status(503).json({ 
      error: 'Unable to refresh stock data from Alpha Vantage',
      message: error.message
    });
  }
});

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness probe endpoint
app.get('/ready', (req, res) => {
  const status = initialDataFetched ? 'ready' : 'initializing';
  const statusCode = initialDataFetched ? 200 : 503;
  res.status(statusCode).json({ status });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Stock price app listening at http://localhost:${port}`);
  
  // Start fetching initial data
  initializeData();
});