// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
    jsonPath,
    articlesPerSection = 10,
    sections = 1, // # Changed default for Netflix style
    appElemId,
    prevBtnId,
    nextBtnId,
    pageInfoId,
  } = config;

  let articles = [];
  let currentPage = 1;

  function timeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
  }

  function renderPage(page) {
    const perPage = articlesPerSection * sections;
    const pageArticles = articles.slice((page - 1) * perPage, page * perPage);
    const app = document.getElementById(appElemId);
    if (!app) return;
    app.innerHTML = "";

    // # FIXED: We no longer create .col sections. 
    // # We inject cards directly into #app for horizontal scrolling.
    pageArticles.forEach(a => {
      const link = document.createElement("a");
      link.href = a.url;
      link.className = "story-card"; // # Added class
      link.innerHTML = `
        <div class="card-content">
            <span class="headline">${a.title}</span>
            <span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>
        </div>`;
      app.appendChild(link);
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
      const res = await fetch(jsonPath);
      const data = await res.json();
      articles = data.articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      document.getElementById(nextBtnId).onclick = () => { currentPage++; renderPage(currentPage); };
      document.getElementById(prevBtnId).onclick = () => { currentPage--; renderPage(currentPage); };

      renderPage(currentPage);
    } catch (e) { console.error("Load failed", e); }
  }
  init();
}