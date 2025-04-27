const puppeteer = require('puppeteer');

async function scrapeLatestTweet(username) {
  const url = `https://x.com/${username}`;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Debug: Check if the tweet element exists.
    const tweetElement = await page.$('[data-testid="tweet"]');
    if (!tweetElement) {
      console.error("Tweet element not found for account:", username);
      return null;
    }
    console.log("Tweet element found for:", username);

    // Optionally, take a screenshot for further debugging.
    // await page.screenshot({ path: `${username}-debug.png` });

    await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    
    const latestTweet = await page.evaluate(() => {
      const tweetElement = document.querySelector('[data-testid="tweet"]');
      if (tweetElement) {
        const textElement = tweetElement.querySelector('div[lang]');
        const tweetText = textElement ? textElement.innerText : null;
        const timeElement = tweetElement.querySelector('time');
        const tweetTimestamp = timeElement ? timeElement.getAttribute('datetime') : null;
        return {
          text: tweetText,
          timestamp: tweetTimestamp,
        };
      }
      return null;
    });
    console.log("Scraped tweet for", username, ":", latestTweet);
    return latestTweet;
  } catch (error) {
    console.error(`Error scraping tweet for ${username}:`, error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeLatestTweet };
