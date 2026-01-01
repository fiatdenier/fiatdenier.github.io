// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
    jsonPath,
    articlesPerSection = 10,
    sections = 3,
    updatedElemId,
    appElemId,
    prevBtnId,
    nextBtnId,
    pageInfoId,
  } = config;

  let articles = [];
  let currentPage = 1;

  function updateTimestamp() {
    const el = document.getElementById(updatedElemId);
    if (!el) return;
    
    const now = new Date();
    
    // Formatting the string with forced seconds and EST timezone
    const timeString = now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    el.textContent = `Updated ${timeString} EST`;
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
  }

  function renderPage(page) {
    const perPage = articlesPerSection * sections;
    const pageArticles = articles.slice((page - 1) * perPage, page * perPage);
    const app = document.getElementById(appElemId);
    if (!app) return;
    app.innerHTML = "";

    const cols = Array.from({ length: sections }, () => []);
    pageArticles.forEach((a, i) => cols[i % sections].push(a));

    cols.forEach(col => {
      const sec = document.createElement("section");
      sec.className = "col";
      col.forEach(a => {
        const link = document.createElement("a");
        link.href = a.url;
        link.innerHTML = `<span class="headline">${a.title}</span><span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        sec.appendChild(link);
      });
      app.appendChild(sec);
    });
    updatePagination();
  }

  function updatePagination() {
    const total = Math.ceil(articles.length / (articlesPerSection * sections));
    const p = document.getElementById(prevBtnId);
    const n = document.getElementById(nextBtnId);
    const i = document.getElementById(pageInfoId);
    if (p) p.disabled = currentPage === 1;
    if (n) n.disabled = currentPage === total || total === 0;
    if (i) i.textContent = `Page ${currentPage} of ${total || 1}`;
  }

  async function init() {
    try {
      // Fetches using the cache-busted path
      const res = await fetch(jsonPath);
      const data = await res.json();
      articles = data.articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      document.getElementById(nextBtnId).onclick = () => { currentPage++; renderPage(currentPage); window.scrollTo(0,0); };
      document.getElementById(prevBtnId).onclick = () => { currentPage--; renderPage(currentPage); window.scrollTo(0,0); };

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) { console.error("Load failed", e); }
  }
  init();
}