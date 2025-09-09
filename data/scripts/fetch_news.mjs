// data/scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

const DATA_PATH = "./data/news.json";
const sources = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/.rss/full/" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml" },
  { name: "Ambcrypto", url: "https://ambcrypto.com/feed/" },
  { name: "Bitcoinist", url: "https://bitcoinist.com/feed/" },
  { name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
  { name: "The Block", url: "https://www.theblock.co/feed" },
  { name: "CryptoBriefing", url: "https://cryptobriefing.com/feed/" },
  // NewsAPI optional, replace YOUR_KEY with your key
  // { name: "NewsAPI", url: "https://newsapi.org/v2/top-headlines?category=business&apiKey=YOUR_KEY" }
];

function parseDate(item) {
  // Try multiple RSS/Atom fields for date
  return (
    new Date(item.pubDate?.[0] || item.published?.[0] || item.updated?.[0] || item["dc:date"]?.[0])
  );
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url);
    const text = await res.text();
    const parsed = await xml2js.parseStringPromise(text, { mergeAttrs: true, explicitArray: true });

    const items = parsed.rss?.[0]?.channel?.[0]?.item || parsed.feed?.[0]?.entry || [];
    const articles = items.map((item) => {
      const title = item.title?.[0] || "No title";
      const url = item.link?.[0]?.href || item.link?.[0] || "#";
      const published_at = parseDate(item)?.toISOString() || new Date().toISOString();
      return { title, url, source: source.name, published_at };
    });

    return articles;
  } catch (e) {
    console.error(`Failed to fetch ${source.name}:`, e.message);
    return [];
  }
}

async function fetchAll() {
  let allArticles = [];
  for (const src of sources) {
    const articles = await fetchRSS(src);
    allArticles = allArticles.concat(articles);
  }

  // Sort by recency (newest first)
  allArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // Optional: move last 24h articles to the front
  const now = new Date();
  const last24h = [];
  const older = [];
  allArticles.forEach((a) => {
    const diffMs = now - new Date(a.published_at);
    if (diffMs <= 24 * 60 * 60 * 1000) last24h.push(a);
    else older.push(a);
  });

  // Shuffle to mix sources for variety
  shuffleArray(last24h);
  shuffleArray(older);

  allArticles = last24h.concat(older);

  // Save JSON
  fs.writeFileSync(DATA_PATH, JSON.stringify({ articles: allArticles }, null, 2));
  console.log(`✅ Saved ${allArticles.length} articles at ${now.toLocaleString("en-US", { timeZone: "America/New_York" })}`);
}

fetchAll();
