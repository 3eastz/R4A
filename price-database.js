// Database for RFA/SOL price tracking
class PriceDatabase {
  constructor() {
    this.INITIAL_PRICE = 0.00000099;
    this.STORAGE_KEY = 'RFA_PRICE_DATA';
    this.DEFAULT_DATA = {
      currentPrice: this.INITIAL_PRICE,
      priceHistory: [{
        price: this.INITIAL_PRICE,
        timestamp: Date.now(),
        volume: 1500000
      }],
      lastUpdate: Date.now()
    };
    
    // Load or initialize data
    this.data = this.loadData();
    
    // Add price control limits
    this.MAX_PRICE = 0.00001000; // Maximum price limit
    this.MIN_PRICE = 0.00000001; // Minimum price limit
    this.BOOST_MULTIPLIER = 1.25; // 25% boost
    this.REROLL_VARIANCE = 0.15; // 15% variance for reroll
  }

  loadData() {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : this.DEFAULT_DATA;
    } catch (error) {
      console.error('Error loading price data:', error);
      return this.DEFAULT_DATA;
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving price data:', error);
    }
  }

  getCurrentPrice() {
    return this.data.currentPrice;
  }

  getPriceHistory() {
    return [...this.data.priceHistory];
  }

  updatePrice(newPrice, volume = 1500000) {
    this.data.currentPrice = newPrice;
    this.data.priceHistory.push({
      price: newPrice,
      timestamp: Date.now(),
      volume: volume
    });

    // Keep only last 100 price points
    if (this.data.priceHistory.length > 100) {
      this.data.priceHistory.shift();
    }

    this.data.lastUpdate = Date.now();
    this.saveData();
  }

  resetToInitial() {
    this.data = {
      currentPrice: this.INITIAL_PRICE,
      priceHistory: [{
        price: this.INITIAL_PRICE,
        timestamp: Date.now(),
        volume: 1500000
      }],
      lastUpdate: Date.now()
    };
    this.saveData();
    return this.INITIAL_PRICE;
  }

  getChange24h() {
    if (this.data.priceHistory.length < 2) return 0;
    
    const oneDayAgo = Date.now() - 86400000;
    const oldPrice = this.data.priceHistory.find(p => p.timestamp >= oneDayAgo)?.price || 
                    this.data.priceHistory[0].price;
    
    return ((this.data.currentPrice - oldPrice) / oldPrice) * 100;
  }

  getVolume24h() {
    const oneDayAgo = Date.now() - 86400000;
    return this.data.priceHistory
      .filter(p => p.timestamp >= oneDayAgo)
      .reduce((sum, p) => sum + p.volume, 0);
  }

  // Get price data for specific timeframe
  getPriceDataForTimeframe(timeframe) {
    const now = Date.now();
    const timeframeMs = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    }[timeframe] || 86400000; // default to 24h

    return this.data.priceHistory.filter(p => p.timestamp >= now - timeframeMs);
  }

  // Get price statistics
  getPriceStats() {
    const prices = this.data.priceHistory.map(p => p.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }

  // Export data for backup
  exportData() {
    return JSON.stringify(this.data);
  }

  // Import data from backup
  importData(jsonData) {
    try {
      const parsedData = JSON.parse(jsonData);
      if (this.validateData(parsedData)) {
        this.data = parsedData;
        this.saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing price data:', error);
      return false;
    }
  }

  // Validate data structure
  validateData(data) {
    return data &&
           typeof data.currentPrice === 'number' &&
           Array.isArray(data.priceHistory) &&
           typeof data.lastUpdate === 'number';
  }

  // Add transaction record
  addTransaction(type, amount) {
    const transaction = {
      type, // 'buy' | 'sell' | 'transfer'
      amount,
      price: this.data.currentPrice,
      timestamp: Date.now()
    };

    // Update price based on transaction type and size
    const priceImpact = (amount / 1000000) * 0.0000001; // Example price impact calculation
    const newPrice = type === 'buy' 
      ? this.data.currentPrice * (1 + priceImpact)
      : this.data.currentPrice * (1 - priceImpact);

    this.updatePrice(newPrice, amount);
    return transaction;
  }

  boost() {
    const boostedPrice = Math.min(this.data.currentPrice * this.BOOST_MULTIPLIER, this.MAX_PRICE);
    this.updatePrice(boostedPrice);
    return boostedPrice;
  }

  reroll() {
    const variance = this.data.currentPrice * this.REROLL_VARIANCE;
    const min = Math.max(this.data.currentPrice - variance, this.MIN_PRICE);
    const max = Math.min(this.data.currentPrice + variance, this.MAX_PRICE);
    const newPrice = min + (Math.random() * (max - min));
    this.updatePrice(newPrice);
    return newPrice;
  }

  reset() {
    return this.resetToInitial();
  }
}

// Export the database instance
const priceDB = new PriceDatabase();
window.priceDB = priceDB; // Make it globally accessible

// Example usage:
/*
// Get current price
console.log(priceDB.getCurrentPrice());

// Reset price to initial value
priceDB.resetToInitial();

// Add a transaction
priceDB.addTransaction('buy', 100000);

// Get 24h change
console.log(priceDB.getChange24h());

// Get price history
console.log(priceDB.getPriceHistory());

// Export data
const backup = priceDB.exportData();

// Import data
priceDB.importData(backup);
*/