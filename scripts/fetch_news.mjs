// /scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

const NEWS_JSON = "./scripts/news.json"; // news.json now in same folder
const MAX_AGE_DAYS = 21;
const FETCH_TIMEOUT_MS = 10000; // 10s per source

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

async function fetchRSS(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const text = await res.text();

    // sanitize invalid XML
    const sanitized = text.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp;");

    const parsed = await xml2js.parseStringPromise(sanitized, { trim: true });
    const items = parsed.rss?.channel?.[0]?.item || [];
    const now = new Date();

    return items
      .map((item) => ({
        title: item.title?.[0] || "No title",
        url: item.link?.[0] || "#",
        source: source.name,
        published_at: item.pubDate?.[0] || new Date().toISOString(),
      }))
      .filter(
        (a) => now - new Date(a.published_at) <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000
      );
  } catch (e) {
    console.error(`❌ Failed to fetch ${source.name}: ${e.message}`);
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
