// scripts/paginate_news.js
export async function paginateNews({
  jsonPath = "./data/news.json",
  articlesPerSection = 10,
  sections = 3,
  updatedElemId = "updated",
  appElemId = "app",
  prevBtnId = "prev-btn",
  nextBtnId = "next-btn",
  pageInfoId = "page-info"
} = {}) {
  const articlesPerPage = articlesPerSection * sections;
  let articles = [];
  let currentPage = 1;

  // -------- Helper Functions --------
  function updateTimestamp() {
    const updatedEl = document.getElementById(updatedElemId);
    const now = new Date();
    const estDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const estStr = estDate.toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    updatedEl.textContent = `Updated ${estStr} EST`;
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

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // -------- Render Functions --------
  function renderPage(page) {
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    let pageArticles = articles.slice(startIdx, endIdx);

    // --------- Arrange columns with recency and variety ---------
    const cols = Array.from({ length: sections }, () => []);

    // Step 1: Sort all page articles by recency (newest first)
    pageArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // Step 2: Distribute articles to columns round-robin by source variety
    const sourceTracker = Array.from({ length: sections }, () => new Set());
    pageArticles.forEach((a) => {
      // Find column with least number of this source
      let minCount = Infinity;
      let targetCol = 0;
      for (let i = 0; i < sections; i++) {
        const count = cols[i].filter(c => c.source === a.source).length;
        if (count < minCount) {
          minCount = count;
          targetCol = i;
        }
      }
      cols[targetCol].push(a);
    });

    // Step 3: Sort each column by recency
    cols.forEach(col => col.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)));

    // --------- Render Columns ---------
    const app = document.getElementById(appElemId);
    app.innerHTML = "";

    ["left", "center", "right"].slice(0, sections).forEach((id, idx) => {
      const section = document.createElement("section");
      section.className = "col";
      section.id = id;

      cols[idx].forEach((a) => {
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

  // -------- Fetch Articles and Initialize --------
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    let allArticles = data.articles || [];

    // Filter only articles with valid published_at
    allArticles = allArticles.filter(a => a.published_at);

    // Sort by recency globally
    allArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    articles = allArticles;
    renderPage(currentPage);
    updateTimestamp();
  } catch (e) {
    console.error("Failed to load articles:", e);
    document.getElementById(appElemId).textContent = "Failed to load news.";
  }

  // Expose pagination functions globally
  window.nextPage = nextPage;
  window.prevPage = prevPage;
}
