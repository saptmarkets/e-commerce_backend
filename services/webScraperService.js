const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class WebScraperService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Generate search variations for better results
  generateSearchVariations(productName) {
    const variations = [];
    
    // Original name
    variations.push(productName);
    
    // Try just the main product name (remove brand and size)
    let mainProduct = productName.toLowerCase();
    
    // Remove common brands
    const brands = ['capilano', 'nestle', 'coca', 'pepsi', 'dove', 'pantene'];
    brands.forEach(brand => {
      mainProduct = mainProduct.replace(brand, '').trim();
    });
    
    // Remove size/weight patterns
    mainProduct = mainProduct.replace(/\d+\s*(g|ml|l|kg)/gi, '').trim();
    mainProduct = mainProduct.replace(/\d+\s*جم/g, '').trim();
    
    if (mainProduct && mainProduct !== productName.toLowerCase()) {
      variations.push(mainProduct);
    }
    
    // Try just the first word (usually the brand or main product)
    const firstWord = productName.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      variations.push(firstWord);
    }
    
    // Try common product keywords
    const keywords = ['honey', 'drink', 'coffee', 'tea', 'milk', 'water', 'juice'];
    keywords.forEach(keyword => {
      if (productName.toLowerCase().includes(keyword)) {
        variations.push(keyword);
      }
    });
    
    return [...new Set(variations)]; // Remove duplicates
  }

  // Generic search function for e-commerce sites
  async searchProduct(siteUrl, productName) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the site
      await page.goto(siteUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for search functionality to load
      await page.waitForTimeout(5000);
      
      // Find search elements
      const searchElements = await page.evaluate(() => {
        const elements = [];
        const selectors = [
          'input[placeholder*="Search"]',
          'input[name="q"]',
          '.search-input',
          'input[type="search"]',
          '[data-testid*="search"]',
          'input[placeholder*="search" i]'
        ];
        
        selectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            elements.push({
              selector,
              placeholder: element.placeholder,
              type: element.type
            });
          }
        });
        
        return elements;
      });
      
      if (searchElements.length === 0) {
        throw new Error('Search box not found');
      }
      
      const searchVariations = this.generateSearchVariations(productName);
      let bestResults = [];
      
      for (const searchTerm of searchVariations) {
        try {
          // Use the first found search element
          const searchSelector = searchElements[0].selector;
          
          // Clear and type search term
          await page.click(searchSelector);
          await page.keyboard.down('Control');
          await page.keyboard.press('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
          await page.type(searchSelector, searchTerm);
          await page.keyboard.press('Enter');
          
          // Wait for results
          await page.waitForTimeout(5000);
          
          // Extract product images
          const images = await page.evaluate(() => {
            const productImages = [];
            const imgElements = document.querySelectorAll('img');
            
            imgElements.forEach(img => {
              const src = img.src || img.getAttribute('data-src');
              if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
                productImages.push({
                  url: src,
                  alt: img.alt || '',
                  title: img.title || img.alt || ''
                });
              }
            });
            
            return productImages.slice(0, 10);
          });
          
          if (images.length > bestResults.length) {
            bestResults = images;
          }
          
          // Wait before next search
          await page.waitForTimeout(3000);
          
        } catch (error) {
          console.log(`Error with search term "${searchTerm}":`, error.message);
        }
      }
      
      await page.close();
      return bestResults;
      
    } catch (error) {
      console.error(`Error searching on ${siteUrl}:`, error.message);
      return [];
    }
  }

  // Site-specific scrapers for major e-commerce sites
  async scrapeCarrefourKSA(productName) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://www.carrefourksa.com/mafsau/en', { waitUntil: 'networkidle2' });
      
      // Wait for search to load
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
      
      // Search for product
      await page.type('input[placeholder*="Search"]', productName);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Extract product images
      const images = await page.evaluate(() => {
        const productImages = [];
        const imgElements = document.querySelectorAll('.product-card img, .product-image img');
        
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && src.includes('product')) {
            productImages.push({
              url: src,
              alt: img.alt || '',
              title: img.title || img.alt || ''
            });
          }
        });
        
        return productImages.slice(0, 5);
      });
      
      await page.close();
      return images;
      
    } catch (error) {
      console.error('Error scraping Carrefour KSA:', error.message);
      return [];
    }
  }

  async scrapePandaSA(productName) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://panda.sa/', { waitUntil: 'networkidle2' });
      
      // Wait for search to load
      await page.waitForSelector('input[type="search"], input[name="q"]', { timeout: 10000 });
      
      // Search for product
      const searchInput = await page.$('input[type="search"], input[name="q"]');
      await searchInput.type(productName);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Extract product images
      const images = await page.evaluate(() => {
        const productImages = [];
        const imgElements = document.querySelectorAll('.product img, .item img, img[src*="product"]');
        
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src) {
            productImages.push({
              url: src,
              alt: img.alt || '',
              title: img.title || img.alt || ''
            });
          }
        });
        
        return productImages.slice(0, 5);
      });
      
      await page.close();
      return images;
      
    } catch (error) {
      console.error('Error scraping Panda.sa:', error.message);
      return [];
    }
  }

  async scrapeLulu(productName) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto('https://www.luluhypermarket.com/en-ae', { waitUntil: 'networkidle2' });
      
      // Wait for search to load
      await page.waitForSelector('input[type="search"], input[name="q"]', { timeout: 10000 });
      
      // Search for product
      const searchInput = await page.$('input[type="search"], input[name="q"]');
      await searchInput.type(productName);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Extract product images
      const images = await page.evaluate(() => {
        const productImages = [];
        const imgElements = document.querySelectorAll('.product img, .item img, img[src*="product"]');
        
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src) {
            productImages.push({
              url: src,
              alt: img.alt || '',
              title: img.title || img.alt || ''
            });
          }
        });
        
        return productImages.slice(0, 5);
      });
      
      await page.close();
      return images;
      
    } catch (error) {
      console.error('Error scraping Lulu:', error.message);
      return [];
    }
  }

  // Main function to scrape images from multiple sites
  async scrapeImagesFromSites(siteUrls, productName) {
    const allImages = {};
    
    for (let i = 0; i < siteUrls.length; i++) {
      const siteUrl = siteUrls[i];
      if (!siteUrl || !siteUrl.trim()) continue;
      
      try {
        let images = [];
        
        // Use site-specific scrapers for known sites
        if (siteUrl.includes('carrefourksa.com')) {
          images = await this.scrapeCarrefourKSA(productName);
        } else if (siteUrl.includes('panda.sa')) {
          images = await this.scrapePandaSA(productName);
        } else if (siteUrl.includes('luluhypermarket.com')) {
          images = await this.scrapeLulu(productName);
        } else {
          // Generic scraper for unknown sites
          images = await this.searchProduct(siteUrl, productName);
        }
        
        allImages[i] = images;
        console.log(`Found ${images.length} images from site ${i + 1}: ${siteUrl}`);
        
      } catch (error) {
        console.error(`Failed to scrape site ${i + 1} (${siteUrl}):`, error.message);
        allImages[i] = [];
      }
    }
    
    return allImages;
  }

  // Cleanup function
  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new WebScraperService(); 