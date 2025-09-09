// paginate_news.js
export function paginateNews(config) {
  const {
    jsonPath = "scripts/news.json",
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
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    el.textContent = `Updated ${est.toLocaleString("en-US")}`;
  }

  function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMins = Math.floor((now - then) / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours < 24) return mins === 0 ? `${hours} hours ago` : `${hours} hours ${mins} mins ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  function removeDuplicates(arr) {
    const seen = new Set();
    return arr.filter(a => {
      const key = a.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderPage(page) {
    const start = (page - 1) * articlesPerSection * sections;
    const end = start + articlesPerSection * sections;
    const pageArticles = articles.slice(start, end);

    const cols = Array.from({ length: sections }, () => []);
    let colIndex = 0;
    const usedSources = new Set();

    pageArticles.forEach(a => {
      if (!usedSources.has(a.source)) {
        cols[colIndex % sections].push(a);
        usedSources.add(a.source);
        colIndex++;
      }
    });
    pageArticles.forEach(a => {
      const alreadyIn = cols.some(c => c.includes(a));
      if (!alreadyIn) {
        cols[colIndex % sections].push(a);
        colIndex++;
      }
    });

    const app = document.getElementById(appElemId);
    app.innerHTML = "";
    ["left", "center", "right"].slice(0, sections).forEach((id, idx) => {
      const section = document.createElement("section");
      section.className = "col";
      section.id = id;
      cols[idx].forEach(a => {
        const link = document.createElement("a");
        link.href = a.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });
      app.appendChild(section);
    });
    updatePagination();
  }

  function updatePagination() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${totalPages}`;
  }

  function nextPage() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  }

  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();
      articles = removeDuplicates(data.articles)
        .filter(a => (new Date() - new Date(a.published_at)) / (1000*60*60*24) <= 21)
        .sort((a,b) => new Date(b.published_at)-new Date(a.published_at));
      renderPage(currentPage);
      updateTimestamp();
    } catch(e) {
      console.error("Failed to load news.json", e);
      document.getElementById(appElemId).textContent = "Failed to load news.";
    }
  }

  window.nextPage = nextPage;
  window.prevPage = prevPage;

  init();
}
