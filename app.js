// Initialize Vanta.js background
VANTA.NET({
  el: "#vanta-bg",
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.00,
  minWidth: 200.00,
  scale: 1.00,
  scaleMobile: 1.00,
  color: 0xbf0a30,
  backgroundColor: 0x000614,
  points: 15.00,
  maxDistance: 25.00,
  spacing: 17.00,
  showDots: false // Optimize performance
})

// Initialize Web3
let web3;
let contract;

// Add animated counter for tokenomics stats
function animateValue(element, start, end, duration) {
  let current = start;
  const range = end - start;
  const increment = range / (duration / 16);
  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      current = end;
      clearInterval(timer);
    }
    
    // Update value and color based on change
    const isIncrease = current > start;
    element.style.color = isIncrease ? '#00ff00' : '#ff0000';
    
    if (end >= 1000000000) {
      element.textContent = `${(current/1000000000).toFixed(2)}B RFA`;
    } else if (end >= 1000000) {
      element.textContent = `${(current/1000000).toFixed(0)}M RFA`;
    } else {
      element.textContent = `${current.toFixed(0)} RFA`;
    }
  }, 16);
}

// Observe tokenomics section for animation trigger
const tokenomicsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const stats = entry.target.querySelectorAll('.tokenomics-stats .stat p');
      stats.forEach(stat => {
        const value = parseFloat(stat.textContent.replace(/[^0-9]/g, ''));
        animateValue(stat, 0, value, 2000);
      });
      
      tokenomicsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelector('.tokenomics-card').classList.add('animate-tokenomics');
tokenomicsObserver.observe(document.querySelector('.tokenomics-card'));

// Update tokenomics animation
document.querySelectorAll('.tokenomics-stats .stat-card').forEach((card, index) => {
  card.style.animationDelay = `${index * 100}ms`;
  
  card.addEventListener('mouseenter', () => {
    const value = card.querySelector('p');
    value.style.transform = 'scale(1.1)';
    setTimeout(() => {
      value.style.transform = 'scale(1)';
    }, 200);
  });
});

// Add hover animation for tokenomics stats
document.querySelectorAll('.tokenomics-stats .stat').forEach(stat => {
  stat.addEventListener('mouseenter', () => {
    const value = stat.querySelector('p');
    value.style.transform = 'scale(1.1)';
    setTimeout(() => {
      value.style.transform = 'scale(1)';
    }, 200);
  });
});

// Enhance wallet connection functionality
async function connectWallet() {
  try {
    // Check if Phantom is installed by looking for solana object
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    
    if (!isPhantomInstalled) {
      showNotification("Please install Phantom Wallet first!", "info");
      // Open Phantom wallet download in new tab
      window.open("https://phantom.app/", "_blank");
      return;
    }

    try {
      // Request Solana network access
      const resp = await window.solana.connect({
        onlyIfTrusted: false,
        network: "mainnet-beta" // Specify Solana network
      });

      const publicKey = resp.publicKey.toString();
      
      // Update button text with truncated wallet address
      const button = document.querySelector('.connect-wallet');
      if (button) {
        button.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
        button.classList.add('connected');
      }
      
      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletNetwork', 'solana');
      
      showNotification("Successfully connected to Phantom Wallet!", "success");
      
      // Log connected address
      console.log("Connected to Solana network with Public Key:", publicKey);
      
    } catch (err) {
      if (err.code === 4001) {
        // User rejected the connection request
        showNotification("Connection request rejected by user", "error");
      } else {
        showNotification("Failed to connect to Phantom wallet", "error");
        console.error("Connection error:", err);
      }
    }
    
  } catch (err) {
    console.error("Error checking Phantom wallet:", err);
    showNotification("Error checking Phantom wallet status", "error");
  }
}

// Add Phantom wallet event listeners
if (window.solana) {
  window.solana.on('connect', () => {
    console.log("Phantom wallet connected");
    showNotification("Phantom wallet connected", "success");
  });

  window.solana.on('disconnect', () => {
    console.log("Phantom wallet disconnected");
    showNotification("Phantom wallet disconnected", "info");
    
    // Reset wallet connection UI
    const button = document.querySelector('.connect-wallet');
    if (button) {
      button.textContent = 'Connect Wallet';
      button.classList.remove('connected');
    }
    
    // Clear stored connection state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletNetwork');
  });

  window.solana.on('accountChanged', async (publicKey) => {
    if (publicKey) {
      console.log('Account changed:', publicKey.toString());
      
      // Update UI with new address
      const button = document.querySelector('.connect-wallet');
      if (button) {
        button.textContent = `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
      }
      
      showNotification("Wallet account changed", "info");
    }
  });
}

// Check for existing wallet connection on page load
document.addEventListener('DOMContentLoaded', async () => {
  const isWalletConnected = localStorage.getItem('walletConnected') === 'true';
  const walletNetwork = localStorage.getItem('walletNetwork');
  
  if (isWalletConnected && walletNetwork === 'solana' && window.solana) {
    try {
      // Try to reconnect with existing trusted connection
      const resp = await window.solana.connect({
        onlyIfTrusted: true,
        network: "mainnet-beta"
      });
      
      const publicKey = resp.publicKey.toString();
      const button = document.querySelector('.connect-wallet');
      if (button) {
        button.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
        button.classList.add('connected');
      }
    } catch (err) {
      console.error("Error reconnecting to Solana wallet:", err);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletNetwork');
    }
  }
});

// Buy tokens function
async function buyTokens() {
  if (!web3 || !contract) {
    alert('Please connect your wallet first!');
    return;
  }
  
  try {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.buy().send({
      from: accounts[0],
      value: web3.utils.toWei('0.1', 'ether')
    });
    
    alert('Successfully purchased Rise for All tokens!');
  } catch (error) {
    console.error('Transaction failed:', error);
    alert('Transaction failed. Please try again.');
  }
}

// Add parallax effect to 3D elements
document.addEventListener('mousemove', (e) => {
  const elements = document.querySelectorAll('.feature, .riseforall-trump-hero');
  const mouseX = e.clientX / window.innerWidth - 0.5;
  const mouseY = e.clientY / window.innerHeight - 0.5;

  elements.forEach(el => {
    const depth = parseFloat(el.dataset.depth || 1);
    const moveX = mouseX * 50 * depth;
    const moveY = mouseY * 50 * depth;
    el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${1 + depth * 0.1})`;
  });
});

// Add smooth scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('section, .feature').forEach((el) => {
  el.classList.add('fade-in-element');
  fadeInObserver.observe(el);
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  });
});

// Add active state to navigation links based on scroll position
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= (sectionTop - 150)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Enhance mobile responsiveness
const mobileMenu = document.querySelector('.mobile-menu');
const navContent = document.querySelector('.nav-content');

if (mobileMenu) {
  mobileMenu.addEventListener('click', () => {
    navContent.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });
}

// Add loading animation
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.loading').classList.add('hidden');
  document.body.classList.add('loaded');
});

// Price tracking functionality
class PriceTracker {
  constructor() {
    this.priceDB = window.priceDB;
    this.subscribers = new Set();
    this.startTracking();
  }

  getCurrentPrice() {
    return this.priceDB.getCurrentPrice();
  }

  updatePrice() {
    const currentPrice = this.priceDB.getCurrentPrice();
    const trend = Math.sin(Date.now() / 86400000) * 0.002;
    const random = (Math.random() - 0.5) * 0.005;
    const newPrice = Math.max(0.00000001, currentPrice * (1 + trend + random));
    
    this.priceDB.updatePrice(newPrice);
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback({
      price: this.getCurrentPrice(),
      change: this.priceDB.getChange24h(),
      volume: this.priceDB.getVolume24h()
    });
  }

  notifySubscribers() {
    const data = {
      price: this.getCurrentPrice(),
      change: this.priceDB.getChange24h(),
      volume: this.priceDB.getVolume24h()
    };
    this.subscribers.forEach(callback => callback(data));
  }

  startTracking() {
    setInterval(() => this.updatePrice(), 1000);
  }
}

// Initialize price tracker
const priceTracker = new PriceTracker();

// Add price alerts functionality
class PriceAlerts {
  constructor(priceTracker) {
    this.alerts = new Map();
    this.priceTracker = priceTracker;
    this.priceTracker.subscribe(this.checkAlerts.bind(this));
  }

  addAlert(price, type, callback) {
    const alertId = Date.now().toString();
    this.alerts.set(alertId, { price, type, callback });
    return alertId;
  }

  removeAlert(alertId) {
    this.alerts.delete(alertId);
  }

  checkAlerts(data) {
    const currentPrice = data.price;
    this.alerts.forEach((alert, id) => {
      if (alert.type === 'above' && currentPrice >= alert.price) {
        alert.callback(currentPrice);
        this.removeAlert(id);
      } else if (alert.type === 'below' && currentPrice <= alert.price) {
        alert.callback(currentPrice);
        this.removeAlert(id);
      }
    });
  }
}

// Initialize price alerts
const priceAlerts = new PriceAlerts(priceTracker);

// Update price ticker UI with more robust price handling
function updatePriceTickerUI(data) {
  const ticker = document.querySelector('.price-ticker-value');
  const changeElement = document.querySelector('.price-change');
  const volumeElement = document.querySelector('.volume-value');
  const priceTicker = document.querySelector('.price-ticker');
  
  if (ticker) {
    const oldPrice = parseFloat(ticker.textContent.replace(/[^0-9.]/g, ''));
    const isIncrease = data.price > oldPrice;
    
    // Update price with arrow indicator
    ticker.textContent = `$${data.price.toFixed(8)}${isIncrease ? '↑' : '↓'}`;
    
    // Apply color classes
    ticker.classList.remove('price-up', 'price-down');
    priceTicker.classList.remove('price-up', 'price-down');
    
    // Add appropriate color class
    if (isIncrease) {
      ticker.classList.add('price-up');
      priceTicker.classList.add('price-up');
    } else {
      ticker.classList.add('price-down');
      priceTicker.classList.add('price-down');
    }
  }
  
  if (changeElement) {
    const changeValue = data.change;
    const isPositive = changeValue >= 0;
    changeElement.textContent = `${isPositive ? '+' : ''}${changeValue.toFixed(2)}%`;
    changeElement.classList.remove('positive', 'negative');
    changeElement.classList.add(isPositive ? 'positive' : 'negative');
  }
  
  if (volumeElement) {
    volumeElement.textContent = `$${formatNumber(data.volume)}`;
    // Update volume color based on price change
    volumeElement.style.color = data.change >= 0 ? '#00ff00' : '#ff0000';
  }
}

// Initialize with specific values
document.addEventListener('DOMContentLoaded', () => {
  const initialData = {
    price: 0.00000099,
    change: -3.05,
    volume: 1500000
  };
  
  updatePriceTickerUI(initialData);
});

// Add price controls
const adminSystem = {
  password: "RFA_Admin_2025!", // You should store this securely in production
  isAuthenticated: false,
  
  authenticate(password) {
    if (password === this.password) {
      this.isAuthenticated = true;
      localStorage.setItem('rfa_admin_auth', 'true');
      return true;
    }
    return false;
  },
  
  checkAuth() {
    return this.isAuthenticated || localStorage.getItem('rfa_admin_auth') === 'true';
  },
  
  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('rfa_admin_auth');
  }
};

// Modify price controls to be admin-only
function initializePriceControls() {
  // Remove any existing price controls first
  const existingControls = document.querySelector('.price-controls');
  if (existingControls) {
    existingControls.remove();
  }

  const logoContainer = document.querySelector('.liberty-token-container');
  if (!logoContainer) return;

  const priceControls = document.createElement('div');
  priceControls.className = 'price-controls admin-only';
  priceControls.style.display = adminSystem.checkAuth() ? 'flex' : 'none';
  
  priceControls.innerHTML = `
    <button class="price-control-btn boost" onclick="boostPrice()">
      <span class="btn-icon">🚀</span>
      Boost
    </button>
    <button class="price-control-btn reroll" onclick="rerollPrice()">
      <span class="btn-icon">🎲</span>
      Reroll
    </button>
    <button class="price-control-btn reset" onclick="resetPrice()">
      <span class="btn-icon">↺</span>
      Reset
    </button>
    <button class="price-control-btn logout" onclick="adminLogout()">
      <span class="btn-icon">🚪</span>
      Logout
    </button>
  `;

  logoContainer.insertAdjacentElement('afterend', priceControls);
}

// Modify admin authentication function 
window.authenticateAdmin = function() {
  const password = prompt("Enter admin password:");
  if (adminSystem.authenticate(password)) {
    // Show controls immediately without loading
    const controls = document.querySelector('.price-controls');
    if (controls) {
      controls.style.display = 'flex';
    }
    showNotification('Admin access granted', 'success');
  } else {
    showNotification('Invalid password', 'error');
  }
};

// Modify admin logout function
window.adminLogout = function() {
  adminSystem.logout();
  const controls = document.querySelector('.price-controls');
  if (controls) {
    controls.style.display = 'none';
  }
  showNotification('Admin logged out', 'info');
};

// Initialize controls when chart is ready
document.addEventListener('DOMContentLoaded', () => {
  // ... existing DOMContentLoaded code ...
  
  // Initialize price controls
  initializePriceControls();
  
  // Check if admin is already authenticated
  if (adminSystem.checkAuth()) {
    const controls = document.querySelector('.price-controls');
    if (controls) {
      controls.style.display = 'flex';
    }
  }
});

// Admin keyboard shortcut
document.addEventListener('keydown', function(e) {
  if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'p') {
    e.preventDefault(); // Prevent default browser behavior
    authenticateAdmin();
  }
});

// Modify price control functions to check for admin access
function boostPrice() {
  if (!adminSystem.checkAuth()) {
    showNotification('Admin access required', 'error');
    return;
  }
  // Boost price by 25% (BOOST_MULTIPLIER is 1.25)
  const newPrice = priceDB.boost();
  showNotification('Price boosted! 🚀', 'success');
  updatePriceAnimation(true);
}

function rerollPrice() {
  if (!adminSystem.checkAuth()) {
    showNotification('Admin access required', 'error');
    return;
  }
  // Reroll price within 15% variance (REROLL_VARIANCE is 0.15)
  const newPrice = priceDB.reroll();
  showNotification('Price rerolled! 🎲', 'info');
  updatePriceAnimation(Math.random() > 0.5);
}

function resetPrice() {
  if (!adminSystem.checkAuth()) {
    showNotification('Admin access required', 'error');
    return;
  }
  const newPrice = priceDB.reset();
  showNotification('Price reset to initial value ↺', 'info');
  updatePriceAnimation(false);
}

// Price control functions
function updatePriceAnimation(isIncrease) {
  const ticker = document.querySelector('.price-ticker');
  ticker.classList.remove('price-up', 'price-down');
  ticker.classList.add(isIncrease ? 'price-up' : 'price-down');
  
  // Add celebration effect for significant price increases
  if (isIncrease && Math.random() > 0.7) {
    celebrateTransaction();
  }
}

// Add hover effect for price ticker with tooltip
document.querySelector('.price-ticker').addEventListener('mouseenter', () => {
  const priceChange = document.querySelector('.price-change');
  if (priceChange) {
    const change = parseFloat(priceChange.textContent);
    const tooltip = document.createElement('div');
    tooltip.className = 'price-tooltip';
    tooltip.textContent = `24h Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    document.querySelector('.price-ticker').appendChild(tooltip);
  }
});

document.querySelector('.price-ticker').addEventListener('mouseleave', () => {
  const tooltip = document.querySelector('.price-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
});

// Subscribe to price updates
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.price-ticker')) {
    const tickerHTML = `
      <div class="price-ticker">
        <div class="price-ticker-content">
          <div class="price-main">
            <span class="price-ticker-label">$RFA/SOL:</span>
            <span class="price-ticker-value">$0.00000000</span>
          </div>
          <div class="price-details">
            <span class="price-change">0.00%</span>
            <span class="volume-label">Vol:</span>
            <span class="volume-value">$0</span>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', tickerHTML);
  }
  
  priceTracker.subscribe(updatePriceTickerUI);
  
  const priceHistory = priceTracker.priceDB.getPriceHistory();
  console.log('Loaded price history:', priceHistory);
  
  AOS.init({
    duration: 1000,
    once: true
  });
});

// Add price alert UI
document.querySelector('.price-ticker').addEventListener('click', () => {
  const alertPrice = prompt('Enter price for alert (in SOL):');
  if (alertPrice) {
    const alertType = confirm('OK for above alert, Cancel for below alert') ? 'above' : 'below';
    priceAlerts.addAlert(parseFloat(alertPrice), alertType, (price) => {
      showNotification(`Price ${alertType} ${alertPrice} SOL reached! Current price: ${price.toFixed(8)} SOL`, 'success');
    });
    showNotification(`Price alert set for ${alertPrice} SOL`, 'info');
  }
});

// Helper function to format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

// Add smooth scroll behavior
const scrollElements = document.querySelectorAll('.scroll-element');

const elementInView = (el, percentageScroll = 100) => {
  const elementTop = el.getBoundingClientRect().top;
  return (
    elementTop <= 
    ((window.innerHeight || document.documentElement.clientHeight) * (percentageScroll/100))
  );
};

const displayScrollElement = (element) => {
  element.classList.add('scrolled');
};

const hideScrollElement = (element) => {
  element.classList.remove('scrolled');
};

const handleScrollAnimation = () => {
  scrollElements.forEach((el) => {
    if (elementInView(el, 100)) {
      displayScrollElement(el);
    } else {
      hideScrollElement(el);
    }
  });
};

window.addEventListener('scroll', () => {
  handleScrollAnimation();
});

// Add counter animation for MAGA numbers
const animateNumbers = () => {
  const numberElements = document.querySelectorAll('.maga-number');
  
  numberElements.forEach(element => {
    const targetNumber = parseInt(element.textContent);
    let currentNumber = 0;
    const duration = 2000; 
    const steps = 60;
    const increment = targetNumber / steps;
    
    const counter = setInterval(() => {
      currentNumber += increment;
      if (currentNumber >= targetNumber) {
        element.textContent = targetNumber;
        clearInterval(counter);
      } else {
        element.textContent = Math.floor(currentNumber);
      }
    }, duration / steps);
  });
};

// Initialize number animation when section is in view
const magaSection = document.querySelector('section#maga');
if (magaSection) {
  const sectionTitle = magaSection.querySelector('h2');
  if (sectionTitle) {
    sectionTitle.textContent = 'A World Reimagined, A Future Shared';
  }
  const magaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumbers();
        magaObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  magaObserver.observe(magaSection);
}

// Add hover effect for promise items
document.querySelectorAll('.promise-item').forEach(item => {
  item.addEventListener('mouseenter', () => {
    item.querySelector('.promise-icon').style.transform = 'scale(1.2) rotate(10deg)';
  });
  
  item.addEventListener('mouseleave', () => {
    item.querySelector('.promise-icon').style.transform = 'scale(1) rotate(0deg)';
  });
});

// Add feature card interaction
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.querySelector('.feature-list').style.transform = 'translateX(10px)';
    card.querySelector('.feature-progress').style.transform = 'scaleX(1.05)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.querySelector('.feature-list').style.transform = 'translateX(0)';
    card.querySelector('.feature-progress').style.transform = 'scaleX(1)';
  });
});

// Update the feature animations for the new icons
document.querySelectorAll('.feature').forEach(feature => {
  feature.addEventListener('mouseenter', () => {
    const icon = feature.querySelector('.feature-icon');
    icon.style.transform = 'scale(1.2) rotate(10deg)';
    setTimeout(() => {
      icon.style.transform = 'scale(1) rotate(0deg)';
    }, 200);
  });
  
  feature.addEventListener('mouseleave', () => {
    const icon = feature.querySelector('.feature-icon');
    icon.style.transform = 'scale(1) rotate(0deg)';
  });
});

// Add scroll-based animation for features
const featureObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelector('.progress-bar').style.width = 
        entry.target.querySelector('.progress-bar').style.getPropertyValue('--progress');
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.feature-card').forEach(card => {
  featureObserver.observe(card);
});

// Presale Timer Functionality
function updatePresaleTimer() {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 25);
  
  function update() {
    const now = new Date().getTime();
    const distance = endDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    animateTimerValue('days', days);
    animateTimerValue('hours', hours);
    animateTimerValue('minutes', minutes);
    animateTimerValue('seconds', seconds);
    
    if (distance < 0) {
      clearInterval(timer);
      document.querySelector('.presale-timer').innerHTML = '<h3>Presale Stage 2 Is Live!</h3>';
    }
  }
  
  function animateTimerValue(id, value) {
    const element = document.getElementById(id);
    const currentValue = parseInt(element.textContent);
    if (currentValue !== value) {
      element.classList.add('flip');
      setTimeout(() => {
        element.textContent = String(value).padStart(2, '0');
        element.classList.remove('flip');
      }, 300);
    }
  }
  
  update();
  const timer = setInterval(update, 1000);
}

// Presale Purchase Function
async function buyPresale() {
  if (typeof window.solana === 'undefined') {
    alert('Please install Phantom Wallet to participate in the presale!');
    return;
  }
  
  try {
    const resp = await window.solana.connect();
    const publicKey = resp.publicKey.toString();
    
    alert('Presale purchase functionality will be implemented when smart contract is deployed!');
    
  } catch (err) {
    console.error('Error connecting to wallet:', err);
    alert('Failed to connect wallet. Please try again.');
  }
}

// ImageSlider Class Implementation
class ImageSlider {
  constructor() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) {
      console.warn('Slider container not found, skipping initialization');
      return;
    }

    this.currentSlide = 0;
    this.slides = [
      {
        image: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#bf0a30;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#002868;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg1)"/>
          </svg>
        `)}`,
        title: "Rise for All Token",
        description: "The Future of Patriotic Finance",
        buttonText: "Join Now",
        buttonLink: "https://t.me/riseforallcoin"
      }
    ];
    
    this.initializeSlider();
    this.startAutoPlay();
    this.addTouchSupport();
    this.addKeyboardSupport();
  }

  initializeSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;

    let slider = sliderContainer.querySelector('.slider');
    if (!slider) {
      slider = document.createElement('div');
      slider.className = 'slider';
      sliderContainer.appendChild(slider);
    }
    
    this.slides.forEach((slide, index) => {
      const slideElement = document.createElement('div');
      slideElement.className = `slide ${index === 0 ? 'active' : ''}`;
      slideElement.style.backgroundImage = `url(${slide.image})`;
      
      const content = document.createElement('div');
      content.className = 'slide-content';
      content.innerHTML = `
        <div class="slide-header">
          <span class="slide-number">0${index + 1}</span>
          <div class="slide-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
        <h2 class="slide-title">${slide.title}</h2>
        <p class="slide-description">${slide.description}</p>
        <a href="${slide.buttonLink}" class="slide-button" target="_blank">
          ${slide.buttonText}
          <span class="button-arrow">→</span>
        </a>
        <div class="slide-features">
          <div class="feature-dot"></div>
          <div class="feature-dot"></div>
          <div class="feature-dot"></div>
        </div>
      `;
      
      slideElement.appendChild(content);
      slider.appendChild(slideElement);
    });

    const nav = document.createElement('div');
    nav.className = 'slider-nav';
    this.slides.forEach((slide, index) => {
      const dot = document.createElement('div');
      dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
      dot.innerHTML = `
        <span class="dot-number">0${index + 1}</span>
        <span class="dot-label">${slide.title}</span>
      `;
      dot.addEventListener('click', () => this.goToSlide(index));
      nav.appendChild(dot);
    });
    sliderContainer.appendChild(nav);

    const prevButton = document.createElement('button');
    prevButton.className = 'slider-button prev';
    prevButton.innerHTML = `
      <span class="button-arrow">←</span>
      <span class="button-text">Previous</span>
    `;
    prevButton.addEventListener('click', () => this.prevSlide());
    
    const nextButton = document.createElement('button');
    nextButton.className = 'slider-button next';
    nextButton.innerHTML = `
      <span class="button-text">Next</span>
      <span class="button-arrow">→</span>
    `;
    nextButton.addEventListener('click', () => this.nextSlide());
    
    sliderContainer.appendChild(prevButton);
    sliderContainer.appendChild(nextButton);
  }

  goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const progressBars = document.querySelectorAll('.progress-bar');
    
    slides[this.currentSlide].classList.remove('active');
    dots[this.currentSlide].classList.remove('active');
    progressBars[this.currentSlide].style.width = '0%';
    
    slides[this.currentSlide].classList.add('sliding-out');
    setTimeout(() => {
      slides[this.currentSlide].classList.remove('sliding-out');
    }, 800);
    
    this.currentSlide = index;
    
    slides[this.currentSlide].classList.add('active', 'sliding-in');
    dots[this.currentSlide].classList.add('active');
    progressBars[this.currentSlide].style.width = '100%';
    
    setTimeout(() => {
      slides[this.currentSlide].classList.remove('sliding-in');
    }, 800);
    
    const featureDots = slides[this.currentSlide].querySelectorAll('.feature-dot');
    featureDots.forEach((dot, i) => {
      setTimeout(() => {
        dot.classList.add('active');
      }, i * 200);
    });
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  startAutoPlay() {
    let autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
    
    const container = document.querySelector('.slider-container');
    container.addEventListener('mouseenter', () => {
      clearInterval(autoPlayInterval);
    });
    
    container.addEventListener('mouseleave', () => {
      autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
    });
  }

  addTouchSupport() {
    const slider = document.querySelector('.slider-container');
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX) this.nextSlide();
      if (touchEndX > touchStartX) this.prevSlide();
    });
  }

  addKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.nextSlide();
      if (e.key === 'ArrowLeft') this.prevSlide();
    });
  }
}

// Initialize slider only when needed
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.slider-container')) {
    const slider = new ImageSlider();
  }
  
  updatePresaleTimer();
  
  const progressBars = document.querySelectorAll('.stage-progress .progress-bar');
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.style.getPropertyValue('--progress');
      }
    });
  }, { threshold: 0.5 });
  
  progressBars.forEach(bar => progressObserver.observe(bar));
});

// Update tokenomics stats
const tokenomicsStats = document.querySelector('.tokenomics-stats');
if (tokenomicsStats) {
  const statsHTML = `
    <div class="stats">
      <div class="stat">
        <h3>Total Supply</h3>
        <p>1,000,000,000 RFA</p>
      </div>
    </div>
  `;
  tokenomicsStats.insertAdjacentHTML('beforeend', statsHTML);
}

// Add parallax scrolling effect
document.addEventListener('scroll', () => {
  const parallaxElements = document.querySelectorAll('.parallax');
  parallaxElements.forEach(element => {
    const speed = element.dataset.speed || 0.5;
    const yPos = -(window.pageYOffset * speed);
    element.style.transform = `translateY(${yPos}px)`;
  });
});

// Optimize price chart initialization
function initializePriceChart() {
  const ctx = document.createElement('canvas');
  ctx.id = 'priceChart';
  const chartWrapper = document.querySelector('.chart-wrapper');
  if (!chartWrapper) return;
  
  chartWrapper.appendChild(ctx);

  // Optimize initial data generation
  const initialData = generateInitialPriceData();
  const chart = createPriceChart(ctx, initialData);

  // Optimize chart updates
  priceTracker.subscribe(data => {
    updateChartData(chart, data.price);
  });
}

function generateInitialPriceData() {
  const initialPrice = 0.00000099;
  const dataPoints = 48;
  const priceData = [];
  let currentPrice = initialPrice;
  
  for (let i = 0; i < dataPoints; i++) {
    const volatility = Math.random() * 0.00000002 - 0.00000001;
    const trend = 0.00000001 * Math.sin(i / 8);
    currentPrice = Math.max(0.00000001, currentPrice + volatility + trend);
    priceData.push(currentPrice);
  }

  return {
    prices: priceData,
    labels: generateTimeLabels(dataPoints)
  };
}

function generateTimeLabels(count) {
  return Array.from({length: count}, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (count - i));
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  });
}

function createPriceChart(ctx, initialData) {
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(191, 10, 48, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 40, 104, 0)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: initialData.labels,
      datasets: [{
        label: 'RFA/SOL Price',
        data: initialData.prices,
        borderColor: '#bf0a30',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#bf0a30',
        pointHoverBorderColor: '#ffffff'
      }]
    },
    options: getChartOptions()
  });
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { display: false },
      tooltip: getTooltipConfig()
    },
    scales: getScalesConfig(),
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };
}

function getTooltipConfig() {
  return {
    mode: 'index',
    intersect: false,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    titleColor: '#ffffff',
    bodyColor: '#ffffff',
    borderColor: '#bf0a30',
    borderWidth: 1,
    padding: 12,
    titleFont: { size: 14, weight: 'bold' },
    bodyFont: { size: 13, weight: '600' },
    displayColors: false,
    callbacks: {
      label: context => `Price: $${context.raw.toFixed(8)}`
    }
  };
}

function getScalesConfig() {
  return {
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#ffffff',
        font: { size: 12, weight: '600' },
        maxRotation: 45,
        minRotation: 45,
        maxTicksLimit: 12
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false
      },
      ticks: {
        color: '#ffffff',
        font: { size: 12, weight: '600' },
        callback: value => '$' + value.toFixed(8)
      },
      afterDataLimits: scale => {
        const maxValue = Math.max(...scale.chart.data.datasets[0].data);
        const minValue = Math.min(...scale.chart.data.datasets[0].data);
        const range = maxValue - minValue;
        scale.max = maxValue + (range * 0.2);
        scale.min = Math.max(0, minValue - (range * 0.1));
      }
    }
  };
}

function updateChartData(chart, newPrice) {
  const newData = {
    labels: [...chart.data.labels.slice(1), new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})],
    datasets: [{
      ...chart.data.datasets[0],
      data: [...chart.data.datasets[0].data.slice(1), newPrice]
    }]
  };
  chart.data = newData;
  chart.update('none');
}

// Optimize transaction feed
class TransactionFeed {
  constructor(priceTracker) {
    this.container = document.querySelector('.transaction-feed');
    this.transactions = [];
    this.maxTransactions = 5;
    this.priceTracker = priceTracker;
    this.lastPrice = 0.00000099;
    this.transactionTypes = ['Buy', 'Sell'];
    this.start();
  }

  generateWalletAddress() {
    const validChars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    return Array(4).fill(0).map(() => validChars[Math.floor(Math.random() * validChars.length)]).join('') +
           '...' +
           Array(4).fill(0).map(() => validChars[Math.floor(Math.random() * validChars.length)]).join('');
  }

  generateTransaction() {
    const currentPrice = this.priceTracker.getCurrentPrice();
    const priceChange = currentPrice - this.lastPrice;
    const type = priceChange >= 0 ? 'Buy' : 'Sell';
    
    const baseAmounts = [10000, 50000, 100000, 500000, 1000000];
    const volatilityMultiplier = Math.abs(priceChange / this.lastPrice) * 10 + 1;
    const amount = Math.floor(baseAmounts[Math.floor(Math.random() * baseAmounts.length)] * volatilityMultiplier);
    
    return {
      type,
      amount,
      price: currentPrice,
      address: this.generateWalletAddress(),
      timestamp: new Date().toLocaleTimeString()
    };
  }

  addTransaction() {
    const transaction = this.generateTransaction();
    this.transactions.unshift(transaction);
    
    if (this.transactions.length > this.maxTransactions) {
      this.transactions.pop();
    }

    this.priceTracker.priceDB.addTransaction(
      transaction.type.toLowerCase(),
      transaction.amount
    );

    this.lastPrice = transaction.price;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = this.transactions.map(tx => this.generateTransactionHTML(tx)).join('');
  }

  generateTransactionHTML(tx) {
    return `
      <div class="transaction ${tx.type.toLowerCase()}" data-aos="fade-left">
        <span class="tx-type" style="color: ${tx.type === 'Buy' ? '#00ff00' : '#ff0000'}">${tx.type}</span>
        <span class="tx-amount">${tx.amount.toLocaleString()} RFA</span>
        <span class="tx-address">${tx.address}</span>
        <span class="tx-time">${tx.timestamp}</span>
        <span class="tx-price">$${tx.price.toFixed(8)}</span>
      </div>
    `;
  }

  start() {
    setInterval(() => {
      const currentPrice = this.priceTracker.getCurrentPrice();
      const priceChange = Math.abs((currentPrice - this.lastPrice) / this.lastPrice);
      
      if (Math.random() < (0.2 + priceChange * 2)) {
        this.addTransaction();
      }
    }, 2000 + Math.random() * 1000);
  }
}

// Update chart initialization
document.addEventListener('DOMContentLoaded', () => {
  const transactionFeed = new TransactionFeed(priceTracker);
  initializePriceChart();
  
  priceTracker.subscribe(data => {
    updatePriceTickerUI(data);
    const recentVolume = transactionFeed.transactions
      .reduce((sum, tx) => sum + (tx.amount * data.price), 0);
    
    const volumeElement = document.querySelector('.volume-value');
    if (volumeElement) {
      volumeElement.textContent = `$${formatNumber(recentVolume)}`;
      volumeElement.style.color = data.change >= 0 ? '#00ff00' : '#ff0000';
    }
  });
});

// Add tooltip functionality
const tooltips = document.querySelectorAll('[data-tooltip]');
tooltips.forEach(element => {
  tippy(element, {
    content: element.getAttribute('data-tooltip'),
    theme: 'custom',
    placement: 'top',
    animation: 'scale'
  });
});

// Add smooth scroll animations
const scrollAnimations = () => {
  const elements = document.querySelectorAll('.animate-on-scroll');
  elements.forEach(element => {
    if (isElementInViewport(element)) {
      element.classList.add('animated');
    }
  });
};

window.addEventListener('scroll', scrollAnimations);
scrollAnimations();

// Add confetti effect on successful transaction
function celebrateTransaction() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// Add dynamic token burn counter
class TokenBurnCounter {
  constructor() {
    this.burnedTokens = 0;
    this.totalSupply = 1000000000; // 1 billion total supply
    this.burnRate = 0.000001; // 0.0001% per transaction
    this.element = document.querySelector('.token-burn-counter');
    this.lastUpdate = Date.now();
    this.updateInterval = setInterval(() => this.updateBurnedTokens(), 2000);
    
    // Subscribe to transaction feed to trigger burns
    priceTracker.subscribe(data => {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastUpdate;
      
      // Only update if enough time has passed (prevent too frequent updates)
      if (timeDiff >= 2000) {
        this.triggerBurn(data.price);
        this.lastUpdate = currentTime;
      }
    });
  }

  triggerBurn(currentPrice) {
    // Calculate burn amount based on price and volume
    const baseVolume = Math.random() * 1000000; // Random volume between 0 and 1M tokens
    const priceImpact = currentPrice * 1000000; // Price impact multiplier
    const burnAmount = baseVolume * this.burnRate * (1 + priceImpact);
    
    // Add to total burned tokens
    this.burnedTokens += burnAmount;
    
    // Ensure we don't burn more than total supply
    this.burnedTokens = Math.min(this.burnedTokens, this.totalSupply);
    
    // Update display with animation
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.element) return;
    
    const formattedAmount = Math.floor(this.burnedTokens).toLocaleString();
    const burnPercentage = ((this.burnedTokens / this.totalSupply) * 100).toFixed(2);
    
    this.element.innerHTML = `
      <div class="burn-amount">${formattedAmount} RFA</div>
      <div class="burn-percentage">${burnPercentage}% of Total Supply</div>
      <div class="burn-progress">
        <div class="progress-bar" style="width: ${burnPercentage}%"></div>
      </div>
    `;
    
    // Add animation class
    this.element.classList.add('burn-update');
    setTimeout(() => {
      this.element.classList.remove('burn-update');
    }, 500);
  }

  updateBurnedTokens() {
    // Natural burn rate over time (very small)
    const naturalBurn = Math.random() * 100; // 0-100 tokens per update
    this.burnedTokens += naturalBurn;
    this.updateDisplay();
  }
}

new TokenBurnCounter();

// Add dynamic hover effects for feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Add scroll progress indicator
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  progressBar.style.width = scrolled + '%';
});

// Add success notifications
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${type === 'success' ? '✓' : '!'}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add wallet connection success notification
const originalConnectWallet = window.connectWallet;
window.connectWallet = async function() {
  try {
    await originalConnectWallet();
    showNotification('Wallet connected successfully!');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

// Add copy address functionality
document.querySelectorAll('.wallet-address').forEach(element => {
  element.addEventListener('click', async () => {
    const address = element.textContent;
    await navigator.clipboard.writeText(address);
    showNotification('Address copied to clipboard!');
  });
});

// Add auto-updating market stats
function updateMarketStats() {
  const stats = {
    price: Math.random() * 0.0000001,
    volume: Math.random() * 1000000,
    marketCap: Math.random() * 10000000
  };
  
  document.querySelectorAll('[data-stat]').forEach(element => {
    const stat = element.dataset.stat;
    const value = stats[stat];
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: stat === 'price' ? 8 : 0
    }).format(value);
    
    if (element.textContent !== formattedValue) {
      element.classList.add('updating');
      setTimeout(() => {
        element.textContent = formattedValue;
        element.classList.remove('updating');
      }, 300);
    }
  });
}

setInterval(updateMarketStats, 5000);

// Add smooth anchor scrolling with header offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  });
});

// Add hover effect for social links with ripple animation
document.querySelectorAll('.social-link').forEach(link => {
  link.addEventListener('mouseenter', function(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    this.appendChild(ripple);
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    
    const x = e.clientX - rect.left - size/2;
    const y = e.clientY - rect.top - size/2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add cool hover effect for timeline items
document.querySelectorAll('.timeline-item').forEach(item => {
  item.addEventListener('mouseenter', () => {
    item.style.transform = 'scale(1.02) translateX(10px)';
    item.style.boxShadow = '0 10px 30px rgba(191, 10, 48, 0.3)';
  });
  
  item.addEventListener('mouseleave', () => {
    item.style.transform = 'scale(1) translateX(0)';
    item.style.boxShadow = 'none';
  });
});

// Add typing animation for hero subtitle
function typeWriter(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

document.addEventListener('DOMContentLoaded', () => {
  const heroSubtitle = document.querySelector('.hero p');
  if (heroSubtitle) {
    typeWriter(heroSubtitle, heroSubtitle.textContent);
  }
});

// Add smooth parallax effect for logo
document.addEventListener('mousemove', (e) => {
  const logo = document.querySelector('.large-token-logo');
  if (logo) {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    logo.style.transform = `translate(${mouseX * 30}px, ${mouseY * 30}px) rotateY(${mouseX * 20}deg) rotateX(${-mouseY * 20}deg)`;
  }
});

// Add loading screen
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelector('.loading').classList.add('hidden');
    document.body.classList.add('loaded');
  }, 1500);
});

// Enhanced notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${type === 'success' ? '✓' : '!'}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Enhanced hover effects for feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Add confetti effect for successful transactions
function celebrateTransaction() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// Enhanced scroll reveal animations
const scrollReveal = () => {
  const elements = document.querySelectorAll('[data-aos]');
  elements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight * 0.8;
    
    if (elementTop < triggerPoint) {
      element.classList.add('aos-animate');
    }
  });
};

window.addEventListener('scroll', scrollReveal);
window.addEventListener('load', scrollReveal);

// Improved price ticker animation
const enhancePriceTicker = () => {
  const ticker = document.querySelector('.price-ticker');
  if (!ticker) return;
  
  let lastPrice = 0;
  
  priceTracker.subscribe(data => {
    const priceValue = document.querySelector('.price-ticker-value');
    const currentPrice = data.price;
    
    if (currentPrice !== lastPrice) {
      priceValue.classList.add('price-update');
      setTimeout(() => priceValue.classList.remove('price-update'), 1000);
      lastPrice = currentPrice;
    }
  });
};

// Enhanced transaction feed animations
const enhanceTransactionFeed = () => {
  const feed = document.querySelector('.transaction-feed');
  if (!feed) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, { threshold: 0.1 });
  
  feed.querySelectorAll('.transaction').forEach(tx => {
    observer.observe(tx);
  });
};

// Improved token burn animation
const enhanceTokenBurn = () => {
  const burnCounter = document.querySelector('.token-burn-counter');
  if (!burnCounter) return;
  
  burnCounter.addEventListener('update', () => {
    burnCounter.classList.add('burn-update');
    setTimeout(() => burnCounter.classList.remove('burn-update'), 500);
  });
};

// Initialize enhancements
document.addEventListener('DOMContentLoaded', () => {
  enhancePriceTicker();
  enhanceTransactionFeed();
  enhanceTokenBurn();
  
  // Initialize AOS with enhanced settings
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
    easing: 'ease-out-cubic'
  });
});

// Enhanced mobile menu
const initMobileMenu = () => {
  const menuButton = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  
  if (!menuButton || !navLinks) return;
  
  menuButton.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuButton.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuButton.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('active');
      menuButton.classList.remove('active');
    }
  });
};

// Initialize mobile menu
initMobileMenu();

// Enhanced scroll to top button
const addScrollToTop = () => {
  const button = document.createElement('button');
  button.className = 'scroll-to-top';
  button.innerHTML = '↑';
  document.body.appendChild(button);
  
  window.addEventListener('scroll', () => {
    button.classList.toggle('visible', window.scrollY > 500);
  });
  
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
};

// Initialize scroll to top
addScrollToTop();

// Enhanced notification system
class NotificationSystem {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${this.getIcon(type)}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;
    
    this.container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
  
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '!',
      info: 'i',
      warning: '⚠'
    };
    return icons[type] || icons.info;
  }
}

// Initialize notification system
const notifications = new NotificationSystem();
window.showNotification = (message, type, duration) => {
  notifications.show(message, type, duration);
};

// Enhanced theme support
const initThemeSupport = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  const setTheme = (dark) => {
    document.documentElement.classList.toggle('dark-theme', dark);
  };
  
  prefersDark.addListener((e) => setTheme(e.matches));
  setTheme(prefersDark.matches);
};

// Initialize theme support
initThemeSupport();

// Replace ScrollReveal implementation with Intersection Observer
const initializeScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.add('fade-in');
      }
    });
  }, observerOptions);

  // Observe all elements that need animations
  document.querySelectorAll('.fade-in-element, .feature-card, .maga-card, .vision-card, .timeline-item').forEach(el => {
    animationObserver.observe(el);
  });
};

// Enhanced initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize existing functionality
  enhancePriceTicker();
  enhanceTransactionFeed();
  enhanceTokenBurn();
  initializeScrollAnimations();
  
  // Initialize AOS with improved settings
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
    easing: 'ease-out-cubic',
    delay: 100
  });

  // Add smooth scrolling for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Initialize price controls visibility
  const initializePriceControls = () => {
    const controls = document.querySelector('.price-controls');
    if (controls && adminSystem.checkAuth()) {
      controls.style.display = 'flex';
    }
  };

  initializePriceControls();

  // Enhanced admin authentication
  window.authenticateAdmin = function() {
    const password = prompt("Enter admin password:");
    if (adminSystem.authenticate(password)) {
      const controls = document.querySelector('.price-controls');
      if (controls) {
        controls.style.display = 'flex';
      }
      showNotification('Admin access granted', 'success');
    } else {
      showNotification('Invalid password', 'error');
    }
  };

  // Add keyboard shortcut for admin panel
  document.addEventListener('keydown', function(e) {
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      authenticateAdmin();
    }
  });

  // Initialize Vanta.js background with optimized settings
  if (VANTA) {
    VANTA.NET({
      el: "#vanta-bg",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xbf0a30,
      backgroundColor: 0x000614,
      points: 15.00,
      maxDistance: 25.00,
      spacing: 17.00,
      showDots: false // Optimize performance
    });
  }

  // Initialize price chart if element exists
  if (document.querySelector('.chart-wrapper')) {
    initializePriceChart();
  }

  // Initialize presale timer if element exists
  if (document.querySelector('.presale-timer')) {
    updatePresaleTimer();
  }

  // Add loading animation for price updates
  document.querySelector('.price-ticker')?.classList.add('initialized');

  // Initialize parallax effects
  const parallaxElements = document.querySelectorAll('.parallax');
  window.addEventListener('scroll', () => {
    parallaxElements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(window.pageYOffset * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  });

  // Add interactive effects for feature cards
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Initialize tooltips if Tippy.js is available
  if (window.tippy) {
    tippy('[data-tooltip]', {
      theme: 'custom',
      placement: 'top',
      animation: 'scale'
    });
  }
});

// Add graceful fallbacks for external libraries
const checkLibraries = () => {
  if (!window.AOS) {
    console.warn('AOS library not loaded, falling back to basic animations');
  }
  if (!window.Chart) {
    console.warn('Chart.js not loaded, price chart disabled');
  }
  if (!window.confetti) {
    console.warn('Canvas confetti not loaded, celebration effects disabled');
  }
};

checkLibraries();

// Optimize performance by debouncing scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedScroll = debounce(() => {
  handleScrollAnimation();
  updateActiveNavLink();
}, 16);

window.addEventListener('scroll', debouncedScroll);

// Handle errors gracefully
window.addEventListener('error', (e) => {
  console.warn('Error caught:', e.error);
  // Prevent breaking the entire site
  e.preventDefault();
});