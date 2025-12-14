// /scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

const NEWS_JSON = "./news.json";  // save in current folder
const MAX_AGE_DAYS = 21;
const TIMEOUT_MS = 10000; // 10 seconds
const NUM_COLUMNS = 3;

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
  { name: "CCN", url: "https://www.ccn.com/news/crypto-news/feeds/" },
  { name: "Ambcrypto", url: "https://ambcrypto.com/feed/" },
  { name: "BeinCrypto", url: "https://beincrypto.com/feed/" },
];

async function fetchRSS(source) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const text = await res.text();
    const parsed = await xml2js.parseStringPromise(text, { trim: true });

    const items = parsed.rss?.channel?.[0]?.item || [];
    const now = new Date();

    return items
      .map((item) => {
        const pubDate = item.pubDate?.[0] || new Date().toISOString();
        return {
          title: item.title?.[0] || "No title",
          url: item.link?.[0] || "#",
          source: source.name,
          published_at: pubDate,
        };
      })
      .filter(
        (a) =>
          now - new Date(a.published_at) <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000
      );
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

  // Sort all articles globally (newest → oldest)
  allArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // Distribute into columns (round-robin)
  let columns = Array.from({ length: NUM_COLUMNS }, () => []);
  allArticles.forEach((article, i) => {
    const colIndex = i % NUM_COLUMNS;
    columns[colIndex].push(article);
  });

  // Save both flat + columns
  fs.writeFileSync(
    NEWS_JSON,
    JSON.stringify({ articles: allArticles, columns }, null, 2)
  );

  console.log(
    `✅ Saved ${allArticles.length} articles into ${NUM_COLUMNS} columns in ${NEWS_JSON}`
  );
}

main();
