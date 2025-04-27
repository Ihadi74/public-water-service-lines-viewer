// routes/latestTweetAll.js
const express = require('express');
const router = express.Router();
const { scrapeLatestTweet } = require('../scraper');  // Adjust the path accordingly

// Allowed accounts for tweet scraping
const allowedAccounts = ["cityofcalgary", "CalgaryPolice", "luu_giaan"];

router.get('/', async (req, res) => {
  try {
    // Run scraping functions concurrently for all allowed accounts.
    const tweetPromises = allowedAccounts.map(async (account) => {
      const tweetData = await scrapeLatestTweet(account);
      if (tweetData && tweetData.timestamp) {
        return { account, ...tweetData };
      } else if (tweetData) {
        // Provide a fallback date if timestamp is missing
        return { account, ...tweetData, timestamp: "1970-01-01T00:00:00Z" };
      }
      return null;
    });

    const results = await Promise.all(tweetPromises);
    const validTweets = results.filter((tweet) => tweet !== null && tweet.timestamp);
    if (validTweets.length === 0) {
      return res.status(404).json({ message: 'No tweets found or tweets could not be scraped.' });
    }

    // Sort by timestamp (most recent first)
    validTweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Respond with the most recent tweet
    res.json({ tweet: validTweets[0] });
  } catch (err) {
    console.error("Error in /api/latest-tweet-all:", err);
    res.status(500).json({ error: 'Server error while scraping tweets.' });
  }
});

module.exports = router;
