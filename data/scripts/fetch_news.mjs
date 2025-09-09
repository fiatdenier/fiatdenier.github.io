// data/scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const NEWS_JSON = "../news.json";

// -------- Helpers -------- //
async function fetchWithRetry(url, tries = 3, delay = 2000) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      console.error(`Fetch failed (${i + 1}/${tries}): ${url}`, e.message);
      if (i < tries - 1) {
        await new Promise((r) => setTimeout(r, delay * (i + 1))); // exponential backoff
      }
    }
  }
  return null;
}

// -------- RSS Parsers -------- //
async function parseRSS(url, sourceName) {
  try {
    const xml = await fetchWithRetry(url);
    if (!xml) return [];
    const data = await parseStringPromise(xml);
    const items = data.rss?.channel?.[0]?.item || [];
    return items.map((a) => ({
      title: a.title?.[0] || "",
      url: a.link?.[0] || "",
      published_at: a.pubDate?.[0] || "",
      source: sourceName,
    }));
  } catch (e) {
    console.error(`${sourceName} fetch failed`, e.message);
    return [];
  }
}

// -------- Sources -------- //
async function fetchNewsApi() {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=bitcoin&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
  try {
    const res = await fetchWithRetry(url);
    if (!res) return [];
    const data = JSON.parse(res);
    if (!data.articles) return [];
    return data.articles.map((a) => ({
      title: a.title,
      url: a.url,
      published_at: a.publishedAt,
      source: a.source?.name || "NewsAPI",
    }));
  } catch (e) {
    console.error("NewsAPI fetch failed", e.message);
    return [];
  }
}

async function fetchCointelegraph() {
  return await parseRSS("https://cointelegraph.com/rss", "cointelegraph.com");
}

async function fetchBitcoinMagazine() {
  return await parseRSS("https://bitcoinmagazine.com/feed/", "bitcoinmagazine.com");
}

async function fetchDecrypt() {
  return await parseRSS("https://decrypt.co/feed", "decrypt.co");
}

// -------- Main -------- //
async function main() {
  let articles = [];

  const [newsapi, cointelegraph, bitcoinmag, decrypt] = await Promise.all([
    fetchNewsApi(),
    fetchCointelegraph(),
    fetchBitcoinMagazine(),
    fetchDecrypt(),
  ]);

  articles = [...newsapi, ...cointelegraph, ...bitcoinmag, ...decrypt];

  // Sort newest first
  articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // Save with EST timestamp
  const now = new Date();
  const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  const data = {
    updated_at: estDate.toISOString(),
    articles,
  };

  fs.writeFileSync(NEWS_JSON, JSON.stringify(data, null, 2));

  // Log counts per source
  const counts = articles.reduce((acc, a) => {
    acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {});
  console.log(`✅ Saved ${articles.length} articles at ${estDate.toLocaleString("en-US", { timeZone: "America/New_York" })} EST`);
  console.log("Articles per source:", counts);
}

main();
