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

async function fetchAllStockData() {
  if (isFetching) {
    console.log('Already fetching data, waiting for completion...');
    while(isFetching) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return cachedStockData;
  }

  try {
    isFetching = true;
    console.log('Fetching real stock data from Alpha Vantage...');
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not found. Set ALPHA_VANTAGE_API_KEY environment variable.');
    }
    
    const stockData = [];
    
    // Fetch data for each symbol sequentially to respect rate limits
    for (let i = 0; i < TOP_STOCK_SYMBOLS.length; i++) {
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
        
        if (response.data && response.data.Note) {
          console.warn(`API limit message: ${response.data.Note}`);
          throw new Error(`Alpha Vantage API limit reached: ${response.data.Note}`);
        }
        
        const data = response.data['Global Quote'];
        if (data && Object.keys(data).length > 0) {
          console.log(`Successfully got data for ${symbol}`);
          
          stockData.push({
            symbol: symbol,
            name: getCompanyName(symbol),
            price: parseFloat(data['05. price']),
            change: parseFloat(data['09. change']),
            percentChange: parseFloat(data['10. change percent'].replace('%', '')),
            volume: parseInt(data['06. volume'])
          });
        } else {
          console.error(`No valid data returned for symbol: ${symbol}`);
          throw new Error(`No valid data returned for symbol: ${symbol}`);
        }
        
        // Wait to respect rate limits (only if not the last element)
        if (i < TOP_STOCK_SYMBOLS.length - 1) {
          console.log(`Waiting 15 seconds before next API call to respect rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 15000)); 
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        throw error; // Propagate the error
      }
    }
    
    if (stockData.length === 0) {
      throw new Error('No stock data was retrieved from Alpha Vantage');
    }
    
    // Update cache only if we successfully got all data
    cachedStockData = stockData;
    lastFetchTime = Date.now();
    console.log(`Finished fetching all ${stockData.length} stocks from Alpha Vantage`);
    return stockData;
    
  } catch (error) {
    console.error('Error fetching stock data from Alpha Vantage:', error);
    throw error; // Propagate the error to caller
  } finally {
    isFetching = false;
  }
}

async function getStockData(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (!forceRefresh && cachedStockData && now - lastFetchTime < CACHE_DURATION) {
    console.log('Returning cached stock data from Alpha Vantage');
    return cachedStockData;
  }
  
  // Need to fetch new data
  return await fetchAllStockData();
}

module.exports = {
  getStockData,
  getCompanyName,
  TOP_STOCK_SYMBOLS
};