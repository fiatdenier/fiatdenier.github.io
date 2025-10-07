// create_rss.mjs
import fs from 'fs/promises';

// --- ⚙️ CONFIGURATION: CUSTOMIZE THESE DETAILS ⚙️ ---
const NEWS_JSON_PATH = './news.json';
const RSS_XML_PATH = './rss.xml'; // The file name your users will subscribe to
const CHANNEL_TITLE = "Your Website News Aggregator";
const CHANNEL_LINK = "https://yourwebsite.com/"; 
const CHANNEL_DESCRIPTION = "The latest aggregated news from your curated sources.";
// ----------------------------------------------------

/**
 * Escapes characters that are illegal in XML data (like '&', '<', '>').
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;'
        }[m];
    });
}

/**
 * Generates the full RSS XML string.
 */
function generateRss(articles, buildDate) {
    // 1. Generate XML for each article (the <item> tags)
    const itemsXml = articles.map(article => `
        <item>
            <title>${escapeXml(article.title)}</title>
            <link>${escapeXml(article.url)}</link>
            <description>${escapeXml('Source: ' + article.source)}</description>
            <pubDate>${article.published_at}</pubDate>
            <guid isPermaLink="true">${escapeXml(article.url)}</guid>
        </item>
    `).join('');

    // 2. Wrap all items in the main <channel> and <rss> tags
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>${escapeXml(CHANNEL_TITLE)}</title>
        <link>${escapeXml(CHANNEL_LINK)}</link>
        <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
        <language>en-us</language>
        <lastBuildDate>${buildDate}</lastBuildDate>
        ${itemsXml}
    </channel>
</rss>`;
}

async function createRssFeed() {
    try {
        console.log(`⏳ Reading data from ${NEWS_JSON_PATH}...`);
        const data = await fs.readFile(NEWS_JSON_PATH, 'utf8');
        const newsData = JSON.parse(data);

        // Your news.json structure is an object with an 'articles' key
        const articles = newsData.articles || [];

        if (articles.length === 0) {
            console.log("⚠️ No articles found in news.json. Skipping RSS generation.");
            return;
        }

        // The date format in news.json is already valid RFC 822 format for RSS
        // Use the newest article's date as the <lastBuildDate>
        const buildDate = new Date(articles[0].published_at).toUTCString();

        const rssXml = generateRss(articles, buildDate);

        await fs.writeFile(RSS_XML_PATH, rssXml);
        console.log(`✅ Successfully created RSS feed: ${RSS_XML_PATH}`);

    } catch (error) {
        console.error(`❌ Failed to create RSS feed:`, error.message);
        if (error.code === 'ENOENT') {
            console.error(`Please ensure ${NEWS_JSON_PATH} exists and is in the same directory.`);
        }
    }
}

createRssFeed();