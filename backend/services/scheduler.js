const scrapeWaterOutages = require('./scraper');

class ScraperScheduler {
  constructor() {
    this.scrapeInterval = null;
    this.intervalMinutes = 30;
  }

  start() {
    console.log('Starting water outage scraper scheduler...');
    
    // Run immediately on startup
    this.runScraper();
    
    // Then every 30 minutes
    this.scrapeInterval = setInterval(() => {
      this.runScraper();
    }, this.intervalMinutes * 60 * 1000);
    
    console.log(`Scraper scheduled to run every ${this.intervalMinutes} minutes`);
  }

  stop() {
    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
      this.scrapeInterval = null;
      console.log('Scraper scheduler stopped');
    }
  }

  async runScraper() {
    console.log(`[${new Date().toISOString()}] Running scheduled water outage scrape...`);
    try {
      const outages = await scrapeWaterOutages();
      console.log(`Scrape completed with ${outages.length} outages found`);
    } catch (error) {
      console.error('Scheduled scrape failed:', error);
    }
  }
}

module.exports = new ScraperScheduler();