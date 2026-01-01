// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
    jsonPath = "./data/news.json",
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
    el.textContent = `Updated ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} EST`;
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
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        sec.appendChild(link);
      });
      app.appendChild(sec);
    });
    updatePagination();
  }

  function updatePagination() {
    const total = Math.ceil(articles.length / (articlesPerSection * sections));
    const prev = document.getElementById(prevBtnId);
    const next = document.getElementById(nextBtnId);
    const info = document.getElementById(pageInfoId);

    if (prev) prev.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === total || total === 0;
    if (info) info.textContent = `Page ${currentPage} of ${total || 1}`;
  }

  // THE FIX: Explicit event handlers
  function handleNext() {
    const total = Math.ceil(articles.length / (articlesPerSection * sections));
    if (currentPage < total) {
      currentPage++;
      renderPage(currentPage);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
      window.scrollTo(0, 0);
    }
  }

  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();
      articles = data.articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      // BIND THE BUTTONS HERE
      document.getElementById(nextBtnId)?.addEventListener('click', handleNext);
      document.getElementById(prevBtnId)?.addEventListener('click', handlePrev);

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("News load failed", e);
    }
  }
  init();
}