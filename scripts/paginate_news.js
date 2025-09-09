// /scripts/paginate_news.js
export function paginateNews({
  jsonPath = './data/news.json',
  articlesPerSection = 10,
  sections = 3,
  updatedElemId = 'updated',
  appElemId = 'app',
  prevBtnId = 'prev-btn',
  nextBtnId = 'next-btn',
  pageInfoId = 'page-info'
} = {}) {
  let articles = [];
  let currentPage = 1;
  const articlesPerPage = articlesPerSection * sections;

  // -------- Helper: Time ago --------
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

  // -------- Helper: Update timestamp --------
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
      hour12: true
    });
    if (updatedEl) updatedEl.textContent = `Updated ${estStr} EST`;
  }

  // -------- Render a page with column balance --------
  function renderPage(page) {
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    // Group articles by source
    const sourceMap = {};
    pageArticles.forEach(a => {
      if (!sourceMap[a.source]) sourceMap[a.source] = [];
      sourceMap[a.source].push(a);
    });

    // Prepare columns: take one from each source in round-robin
    const cols = Array.from({ length: sections }, () => []);
    let added = 0;
    const sourceKeys = Object.keys(sourceMap);
    while (added < pageArticles.length) {
      for (let s = 0; s < sourceKeys.length; s++) {
        const src = sourceKeys[s];
        if (sourceMap[src].length === 0) continue;
        const colIdx = added % sections;
        cols[colIdx].push(sourceMap[src].shift());
        added++;
        if (added >= pageArticles.length) break;
      }
    }

    const app = document.getElementById(appElemId);
    if (!app) return;
    app.innerHTML = '';

    ['left', 'center', 'right'].slice(0, sections).forEach((id, idx) => {
      const section = document.createElement('section');
      section.className = 'col';
      section.id = id;

      cols[idx].forEach(a => {
        const link = document.createElement('a');
        link.href = a.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = a.title.length > 60 ? 'big' : '';
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });

      app.appendChild(section);
    });

    updatePagination();
  }

  // -------- Pagination Controls --------
  function updatePagination() {
    const totalPages = Math.ceil(articles.length / articlesPerPage);
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages;
    const pageInfo = document.getElementById(pageInfoId);
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
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

  // -------- Fetch News & Initialize --------
  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();
      // Shuffle articles first for variety
      articles = data.articles.sort(() => Math.random() - 0.5);
      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("Failed to load news.json", e);
      const app = document.getElementById(appElemId);
      if (app) app.textContent = "Failed to load news.";
    }
  }

  init();

  // Expose pagination functions globally
  window.nextPage = nextPage;
  window.prevPage = prevPage;
}
