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

  // -------- Fetch and initialize --------
  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();

      // Filter out articles older than 21 days
      const now = new Date();
      articles = data.articles.filter(
        a => now - new Date(a.published_at) <= MS_21_DAYS
      );

      // Sort by recency
      articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("Failed to load news.json", e);
      document.getElementById(appElemId).textContent = "Failed to load news.";
    }
  }

  // -------- Render page --------
  function renderPage(page) {
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    let pageArticles = articles.slice(startIdx, endIdx);

    // Separate recent (<24h) and older
    if (page === 1) {
      const recentCutoff = new Date(new Date() - 24 * 60 * 60 * 1000);
      const recent = pageArticles.filter(a => new Date(a.published_at) > recentCutoff);
      const older = pageArticles.filter(a => new Date(a.published_at) <= recentCutoff);
      pageArticles = [...recent, ...older];
    }

    // Deduplicate by URL
    const seen = new Set();
    pageArticles = pageArticles.filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Shuffle to mix sources
    pageArticles = shuffleArray(pageArticles);

    // Distribute into columns
    const cols = Array.from({ length: sections }, () => []);
    pageArticles.forEach((a, i) => {
      cols[i % sections].push(a);
    });

    // Render columns
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

  // -------- Helpers --------
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
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

  // -------- Pagination --------
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

  // Expose functions for HTML buttons
  window.nextPage = nextPage;
  window.prevPage = prevPage;

  // Initialize
  init();
}
