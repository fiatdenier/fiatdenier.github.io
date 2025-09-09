// /scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

const NEWS_JSON = "./scripts/news.json"; // write to /scripts
const MAX_AGE_DAYS = 21;

// List of sources with RSS URLs
const sources = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
  { name: "Bitcoinist", url: "https://bitcoinist.com/feed/" },
  { name: "BTCManager", url: "https://btcmanager.com/feed/" },
  { name: "Bitcoin.com", url: "https://news.bitcoin.com/feed/" },
  { name: "CryptoPotato", url: "https://cryptopotato.com/feed/" },
  { name: "Bitcoinnews", url: "https://bitcoinnews.com/feed/news" },
  { name: "Coindesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml" },
];

// Helper: sanitize invalid XML chars for Bitcoinnews
function sanitizeXml(str) {
  return str.replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;");
}

// Fetch and parse RSS feed
async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000, // 10s timeout
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    let text = await res.text();

    if (source.name === "Bitcoinnews") text = sanitizeXml(text);

    const parsed = await xml2js.parseStringPromise(text, { trim: true });
    const items = parsed.rss?.channel?.[0]?.item || [];
    const now = new Date();

    return items
      .map((item) => ({
        title: item.title?.[0] || "No title",
        url: item.link?.[0] || "#",
        source: source.name,
        published_at: item.pubDate?.[0] || new Date().toISOString(),
      }))
      .filter((a) => now - new Date(a.published_at) <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  } catch (e) {
    console.error(`❌ Failed to fetch ${source.name}:`, e.message);
    return [];
  }
}

async function main() {
  let allArticles = [];
  for (const src of sources) {
    const articles = await fetchRSS(src);
    console.log(`📡 ${src.name}: ${articles.length} articles fetched`);
    allArticles = allArticles.concat(articles);
  }

  allArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  fs.mkdirSync("./scripts", { recursive: true });
  fs.writeFileSync(NEWS_JSON, JSON.stringify({ articles: allArticles }, null, 2));

  console.log(`✅ Saved ${allArticles.length} articles to ${NEWS_JSON}`);
}

main();
