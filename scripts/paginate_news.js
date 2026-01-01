// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
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
    const updatedEl = document.getElementById(updatedElemId);
    if (!updatedEl) return;
    const now = new Date();
    const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const estStr = estDate.toLocaleString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true
    });
    updatedEl.textContent = `Updated ${estStr} EST`;
  }

  function timeAgo(dateStr) {
    const diffMins = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const hours = Math.floor(diffMins / 60);
    return hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
  }

  function renderPage(page) {
    const perPage = articlesPerSection * sections;
    const pageArticles = articles.slice((page - 1) * perPage, page * perPage);
    const app = document.getElementById(appElemId);
    if (!app) return;
    app.innerHTML = "";

    const cols = Array.from({ length: sections }, () => []);
    pageArticles.forEach((article, i) => cols[i % sections].push(article));

    cols.forEach(col => {
      const section = document.createElement("section");
      section.className = "col";
      col.forEach(a => {
        const link = document.createElement("a");
        link.href = a.url;
        // WRAPPED: Headline and Meta separated for color logic
        link.innerHTML = `<span class="headline">${a.title}</span><span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });
      app.appendChild(section);
    });
    updatePagination();
  }

  function updatePagination() {
    const total = Math.ceil(articles.length / (articlesPerSection * sections));
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === total || total === 0;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${total || 1}`;
  }

  async function init() {
    try {
      const res = await fetch("./scripts/news.json");
      const data = await res.json();
      articles = data.articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      document.getElementById(nextBtnId).onclick = () => { currentPage++; renderPage(currentPage); window.scrollTo(0, 0); };
      document.getElementById(prevBtnId).onclick = () => { currentPage--; renderPage(currentPage); window.scrollTo(0, 0); };

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) { console.error(e); }
  }
  init();
}