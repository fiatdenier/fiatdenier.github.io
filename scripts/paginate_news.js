// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
    // UPDATED: Default to the new location moved by your GitHub Action
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
    const updatedEl = document.getElementById(updatedElemId);
    if (!updatedEl) return;
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

  function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
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
    const totalArticlesPerPage = articlesPerSection * sections;
    const startIdx = (page - 1) * totalArticlesPerPage;
    const endIdx = startIdx + totalArticlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    const cols = Array.from({ length: sections }, () => []);
    let colIndex = 0;

    pageArticles.forEach(article => {
      cols[colIndex % sections].push(article);
      colIndex++;
    });

    const app = document.getElementById(appElemId);
    if (!app) return;
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
        link.className = a.title.length > 60 ? "big" : "";
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });
      app.appendChild(section);
    });

    updatePagination();
  }

  function updatePagination() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const info = document.getElementById(pageInfoId);

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (info) info.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }

  // UPDATED: Functions now move the user to the top of the page for better UX
  function nextPage() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
      window.scrollTo(0, 0);
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
      window.scrollTo(0, 0);
    }
  }

  async function init() {
    try {
      // FIXED: Loading from the path passed in config (now ./data/news.json)
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error("Could not find " + jsonPath);
      
      const data = await res.json();
      articles = removeDuplicates(data.articles)
        .filter(a => {
          const now = new Date();
          const pub = new Date(a.published_at);
          return (now - pub) / (1000 * 60 * 60 * 24) <= 21;
        })
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      // NEW: Explicitly attach click listeners to the buttons
      document.getElementById(nextBtnId)?.addEventListener('click', nextPage);
      document.getElementById(prevBtnId)?.addEventListener('click', prevPage);

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("Failed to load news.json", e);
      const app = document.getElementById(appElemId);
      if (app) app.textContent = "Failed to load news. Check if /data/news.json exists.";
    }
  }

  init();
}