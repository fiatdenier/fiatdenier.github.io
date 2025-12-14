// /scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import xml2js from "xml2js";

const NEWS_JSON = "./news.json";  // save in current folder
const MAX_AGE_DAYS = 21;
const TIMEOUT_MS = 10000; // 10 seconds

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
  { name: "CryptoCoinNews", url: "https://cryptocoin.news/category/news/bitcoin/feed/" },
  { name: "Blockonomi", url: "https://blockonomi.com/bitcoin/feed/" },
  { name: "CryptoEconomy", url: "https://crypto-economy.com/cryptocurrencies/bitcoin-news/feed/" },
  { name: "CryptoBasic", url: "https://thecryptobasic.com/tag/bitcoin/feed/" },
  { name: "InsideBitcoin", url: "https://insidebitcoins.com/feed" },
  { name: "CoinGeek", url: "https://coingeek.com/feed/" },
  { name: "CryptoNews", url: "https://crypto.news/feed/" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/" }
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
        (a) => now - new Date(a.published_at) <= MAX_AGE_DAYS * 24 * 60 * 60 * 1000
      );
  } catch (e) {
    console.error(`❌ Failed to fetch ${source.name}:`, e.message);
    return []; // continue with next source
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

  fs.writeFileSync(NEWS_JSON, JSON.stringify({ articles: allArticles }, null, 2));
  console.log(`✅ Saved ${allArticles.length} articles to ${NEWS_JSON}`);
}

main();
