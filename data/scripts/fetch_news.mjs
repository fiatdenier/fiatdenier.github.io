// data/scripts/fetch_news.mjs
import fs from "fs";
import fetch from "node-fetch";

const NEWS_JSON = "../news.json";

// -------- Sources -------- //
async function fetchNewsApi() {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=bitcoin&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles) return [];
    return data.articles.map((a) => ({
      title: a.title,
      url: a.url,
      published_at: a.publishedAt,
      source: a.source.name || "NewsAPI",
    }));
  } catch (e) {
    console.error("NewsAPI fetch failed", e);
    return [];
  }
}

// Example: Cointelegraph
async function fetchCointelegraph() {
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss");
    const data = await res.json();
    return data.items.map((a) => ({
      title: a.title,
      url: a.link,
      published_at: a.pubDate,
      source: "cointelegraph.com",
    }));
  } catch (e) {
    console.error("Cointelegraph fetch failed", e);
    return [];
  }
}

// Example: Bitcoin Magazine
async function fetchBitcoinMagazine() {
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://bitcoinmagazine.com/.rss/full/");
    const data = await res.json();
    return data.items.map((a) => ({
      title: a.title,
      url: a.link,
      published_at: a.pubDate,
      source: "bitcoinmagazine.com",
    }));
  } catch (e) {
    console.error("Bitcoin Magazine fetch failed", e);
    return [];
  }
}

// -------- Main -------- //
async function main() {
  let articles = [];

  const [newsapi, cointelegraph, bitcoinmag] = await Promise.all([
    fetchNewsApi(),
    fetchCointelegraph(),
    fetchBitcoinMagazine(),
  ]);

  articles = [...newsapi, ...cointelegraph, ...bitcoinmag];

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
  console.log(`✅ Saved ${articles.length} articles at ${estDate.toLocaleString("en-US", { timeZone: "America/New_York" })} EST`);
}

main();
