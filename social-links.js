// Social media links configuration
const socialConfig = {
  links: {
    twitter: "https://twitter.com/riseforall",
    telegram: "https://t.me/riseforallcoin", 
    discord: "https://discord.gg/riseforall",
    medium: "https://medium.com/@riseforall",
    reddit: "https://reddit.com/r/riseforall"
  },

  // Update a specific social link
  updateLink: function(platform, newUrl) {
    if (this.links.hasOwnProperty(platform)) {
      this.links[platform] = newUrl;
      this.updateDOM(platform);
    }
  },

  // Update link in the DOM
  updateDOM: function(platform) {
    const linkElement = document.querySelector(`.social-link.${platform}`);
    if (linkElement) {
      linkElement.href = this.links[platform];
    }
  },

  // Initialize all social links
  initializeLinks: function() {
    Object.keys(this.links).forEach(platform => {
      const linkElement = document.querySelector(`.social-link.${platform}`);
      if (linkElement) {
        linkElement.href = this.links[platform];
      }
    });
  }
};

// Initialize links when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  socialConfig.initializeLinks();
});

// Example usage:
// To update a social link:
// socialConfig.updateLink('twitter', 'https://twitter.com/newhandle');