// /scripts/paginate_news.js
export function paginateNews({
  jsonPath = "./data/news.json",
  articlesPerSection = 10,
  sections = 3,
  updatedElemId = "updated",
  appElemId = "app",
  prevBtnId = "prev-btn",
  nextBtnId = "next-btn",
  pageInfoId = "page-info",
}) {
  let articles = [];
  let currentPage = 1;
  const articlesPerPage = articlesPerSection * sections;
  const MS_21_DAYS = 21 * 24 * 60 * 60 * 1000;

  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();

      const now = new Date();
      articles = data.articles
        .filter(a => now - new Date(a.published_at) <= MS_21_DAYS)
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("Failed to load news.json", e);
      document.getElementById(appElemId).textContent = "Failed to load news.";
    }
  }

  function renderPage(page) {
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    let pageArticles = articles.slice(startIdx, endIdx);

    // Deduplicate by URL
    const seen = new Set();
    pageArticles = pageArticles.filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Group by source
    const bySource = {};
    pageArticles.forEach(a => {
      if (!bySource[a.source]) bySource[a.source] = [];
      bySource[a.source].push(a);
    });

    // Distribute round-robin to columns
    const cols = Array.from({ length: sections }, () => []);
    let i = 0;
    while (Object.keys(bySource).some(k => bySource[k].length)) {
      for (const src of Object.keys(bySource)) {
        if (bySource[src].length) {
          cols[i % sections].push(bySource[src].shift());
          i++;
        }
      }
    }

    // Render
    const app = document.getElementById(appElemId);
    app.innerHTML = "";
    ["left", "center", "right"].forEach((id, idx) => {
      const section = document.createElement("section");
      section.className = "col";
      section.id = id;

      cols[idx]?.forEach(a => {
        const link = document.createElement("a");
        link.href = a.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.className = a.title.length > 60 ? "big" : "";
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });

      app.appendChild(section);
    });

    updatePagination();
  }

  function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  function updateTimestamp() {
    const updatedEl = document.getElementById(updatedElemId);
    const now = new Date();
    const estDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const estStr = estDate.toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    updatedEl.textContent = `Updated ${estStr} EST`;
  }

  function updatePagination() {
    const totalPages = Math.ceil(articles.length / articlesPerPage);
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${totalPages}`;
  }

  function nextPage() {
    const totalPages = Math.ceil(articles.length / articlesPerPage);
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

  window.nextPage = nextPage;
  window.prevPage = prevPage;

  init();
}
