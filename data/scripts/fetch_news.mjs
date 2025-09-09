// data/scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

// ---------- Config ----------
const OUTPUT_JSON = "./data/news.json";
const RSS_FEEDS = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/.rss/full/" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Ambcrypto", url: "https://ambcrypto.com/feed/" },
  { name: "Bitcoinist", url: "https://bitcoinist.com/feed/" },
  { name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
  { name: "The Block", url: "https://www.theblock.co/rss" },
  { name: "CryptoBriefing", url: "https://cryptobriefing.com/feed/" }
];

const parser = new xml2js.Parser();
const now = new Date();

// ---------- Helper ----------
function parseDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? now : d;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ---------- Fetch & Parse ----------
async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url);
    const xml = await res.text();
    const parsed = await parser.parseStringPromise(xml);
    const items = parsed.rss?.channel?.[0]?.item || parsed.feed?.entry || [];
    
    return items.map((item) => {
      const title = item.title?.[0] || "No title";
      const url = item.link?.[0]?.$.href || item.link?.[0] || "#";
      const pubDate = item.pubDate?.[0] || item.updated?.[0] || new Date().toISOString();
      return { title, url, source: feed.name, published_at: parseDate(pubDate).toISOString() };
    });
  } catch (e) {
    console.error(`Failed to fetch ${feed.name}:`, e.message);
    return [];
  }
}

// ---------- Main ----------
async function main() {
  let allArticles = [];

  for (const feed of RSS_FEEDS) {
    const articles = await fetchFeed(feed);
    allArticles = allArticles.concat(articles);
  }

  // Filter recent (<24h)
  const recentArticles = allArticles.filter(a => {
    const diff = now - new Date(a.published_at);
    return diff < 24 * 60 * 60 * 1000;
  });

  // Sort recent first, then shuffle within same day
  const sorted = recentArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  const shuffled = shuffleArray(sorted);

  // Save
  const output = { articles: shuffled };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

  // Log
  console.log(`✅ Saved ${shuffled.length} recent articles at ${now.toLocaleString("en-US", { timeZone: "America/New_York" })} EST`);
  const sources = [...new Set(shuffled.map(a => a.source))];
  console.log("Sources:", sources);
}

main();
