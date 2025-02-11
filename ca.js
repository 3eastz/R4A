// Contract address management
// Contract Address (CA) configuration
const contractConfig = {
  // Solana Program ID (Contract Address) - To be updated upon deployment
  CONTRACT_ADDRESS: "Coming Soon",
  
  // Network
  NETWORK: "Solana Mainnet",
  
  // Contract Type
  TYPE: "SPL Token",
  
  // Update CA function - Call this to update the contract address
  updateCA: function(newCA) {
    this.CONTRACT_ADDRESS = newCA;
    // Update display
    const caDisplay = document.querySelector('.contract-address-display');
    if (caDisplay) {
      caDisplay.textContent = newCA;
    }
    // Store in local storage
    localStorage.setItem('RFA_CONTRACT_ADDRESS', newCA);
  },
  
  // Initialize display
  init: function() {
    // Check for stored CA
    const storedCA = localStorage.getItem('RFA_CONTRACT_ADDRESS');
    if (storedCA) {
      this.CONTRACT_ADDRESS = storedCA;
    }
    
    // Create and add CA display element if it doesn't exist
    if (!document.querySelector('.contract-address-container')) {
      const container = document.createElement('div');
      container.className = 'contract-address-container';
      container.innerHTML = `
        <div class="ca-label">Contract Address:</div>
        <div class="contract-address-display">${this.CONTRACT_ADDRESS}</div>
      `;
      
      // Insert after nav
      const nav = document.querySelector('nav');
      if (nav) {
        nav.parentNode.insertBefore(container, nav.nextSibling);
      }
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  contractConfig.init();
});