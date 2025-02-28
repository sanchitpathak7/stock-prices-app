// In your stockData.js file
const axios = require('axios');

const COMPANY_NAMES = {
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corporation',
  'GOOGL': 'Alphabet Inc.',
  'AMZN': 'Amazon.com Inc.',
  'NVDA': 'NVIDIA Corporation',
  'META': 'Meta Platforms Inc.',
  'TSLA': 'Tesla Inc.',
  'BRK-B': 'Berkshire Hathaway Inc.',
  'JPM': 'JPMorgan Chase & Co.',
  'V': 'Visa Inc.'
};

const TOP_STOCK_SYMBOLS = Object.keys(COMPANY_NAMES);

// Cache management
let cachedStockData = null;
let lastFetchTime = 0;
let isFetching = false;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function getCompanyName(symbol) {
  return COMPANY_NAMES[symbol] || symbol;
}

/**
 * Creates realistic mock data for a symbol
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock stock data
 */
function createMockDataForSymbol(symbol) {
  // Generate somewhat realistic price based on the company
  let basePrice;
  switch(symbol) {
    case 'AAPL': basePrice = 237.30; break;
    case 'MSFT': basePrice = 392.53; break;
    case 'GOOGL': basePrice = 168.50; break;
    case 'AMZN': basePrice = 208.74; break;
    case 'NVDA': basePrice = 120.02; break;
    case 'META': basePrice = 660.52; break;
    case 'TSLA': basePrice = 285.71; break;
    case 'BRK-B': basePrice = 407.28; break;
    case 'JPM': basePrice = 189.41; break;
    case 'V': basePrice = 276.37; break;
    default: basePrice = 100;
  }
  
  // Add some randomness to the price (±2%)
  const priceVariation = basePrice * (Math.random() * 0.04 - 0.02);
  const price = basePrice + priceVariation;
  
  // Generate change amount (±1.5%)
  const changeAmount = price * (Math.random() * 0.03 - 0.015);
  const percentChange = (changeAmount / price) * 100;
  
  return {
    symbol: symbol,
    name: getCompanyName(symbol),
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(changeAmount.toFixed(2)),
    percentChange: parseFloat(percentChange.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 5000000
  };
}

/**
 * Creates a complete set of mock data for all symbols
 * @returns {Array} Array of mock stock data objects
 */
function createAllMockData() {
  console.log('Generating mock data for all symbols...');
  return TOP_STOCK_SYMBOLS.map(createMockDataForSymbol);
}

/**
 * Attempts to fetch real data but falls back to mock data
 */
async function fetchAllStockData() {
  if (isFetching) {
    console.log('Already fetching data, returning cached or mock data');
    return cachedStockData || createAllMockData();
  }

  try {
    isFetching = true;
    console.log('Fetching real stock data from Alpha Vantage...');
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found. Using mock data.');
      const mockData = createAllMockData();
      cachedStockData = mockData;
      lastFetchTime = Date.now();
      return mockData;
    }
    
    // Start with all mock data
    const stockData = createAllMockData();
    let realDataCount = 0;
    let apiLimitReached = false;
    
    // Try to get data for all symbols unless API limit is reached
    for (let i = 0; i < TOP_STOCK_SYMBOLS.length && !apiLimitReached; i++) {
      const symbol = TOP_STOCK_SYMBOLS[i];
      
      try {
        const formattedSymbol = symbol.replace('.', '-');
        console.log(`Fetching data for ${symbol} (${i+1}/${TOP_STOCK_SYMBOLS.length})...`);
        
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${apiKey}`,
          { timeout: 10000 } // 10 second timeout
        );
        
        // Log raw response for debugging
        console.log(`Alpha Vantage response for ${symbol}:`, JSON.stringify(response.data).substring(0, 200) + '...');
        
        // Check for API limit messages
        if (response.data && response.data.Information && response.data.Information.includes('API rate limit')) {
          console.warn(`API limit reached: ${response.data.Information}`);
          apiLimitReached = true;
          break; 
        }
        
        // Check for errors
        if (response.data && response.data.Error) {
          console.warn(`API error for ${symbol}: ${response.data.Error}`);
          continue;
        }
        
        // Process valid data
        const data = response.data['Global Quote'];
        if (data && Object.keys(data).length > 0) {
          console.log(`Successfully got real data for ${symbol}`);
          
          stockData[i] = {
            symbol: symbol,
            name: getCompanyName(symbol),
            price: parseFloat(data['05. price']),
            change: parseFloat(data['09. change']),
            percentChange: parseFloat(data['10. change percent'].replace('%', '')),
            volume: parseInt(data['06. volume'])
          };
          
          realDataCount++;
        } else {
          console.warn(`No valid data returned for symbol: ${symbol}, using mock data.`);
          // Keep mock data for this symbol
        }
        
        // Wait to respect rate limits (only if not the last element and not reached API limit)
        if (i < TOP_STOCK_SYMBOLS.length - 1 && !apiLimitReached) {
          console.log(`Waiting 15 seconds before next API call to respect rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 15000)); 
        }
      } catch (error) {
        console.warn(`Error fetching data for ${symbol}: ${error.message}`);
        // Keep mock data for this symbol
      }
    }
    
    console.log(`Completed data fetch with ${realDataCount} real entries and ${stockData.length - realDataCount} mock entries.`);
    
    // Update cache
    cachedStockData = stockData;
    lastFetchTime = Date.now();
    return stockData;
    
  } catch (error) {
    console.error('Error in fetchAllStockData:', error);
    return createAllMockData();
  } finally {
    isFetching = false;
  }
}

async function getStockData(forceRefresh = false) {
  const now = Date.now();
  
  // If no cached data, or it's expired, or force refresh requested
  if (!cachedStockData || now - lastFetchTime > CACHE_DURATION || forceRefresh) {
    // Return mock data immediately while fetching in background if we have no cached data
    if (!cachedStockData) {
      const mockData = createAllMockData();
      
      // Start fetch in background
      fetchAllStockData().then(realData => {
        cachedStockData = realData;
        lastFetchTime = Date.now();
      }).catch(error => {
        console.error('Background fetch failed:', error);
      });
      
      return mockData;
    }
    
    // Otherwise wait for real fetch
    return await fetchAllStockData();
  }
  
  // Return cached data
  return cachedStockData;
}

module.exports = {
  getStockData,
  getCompanyName,
  TOP_STOCK_SYMBOLS,
  createAllMockData
};