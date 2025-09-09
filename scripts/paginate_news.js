// scripts/paginate_news.js
export async function paginateNews(config = {}) {
  const {
    jsonPath = "./data/news.json",
    articlesPerSection = 10,
    sections = 3,
    updatedElemId = "updated",
    appElemId = "app",
    prevBtnId = "prev-btn",
    nextBtnId = "next-btn",
    pageInfoId = "page-info"
  } = config;

  let articles = [];
  let currentPage = 1;
  const articlesPerPage = articlesPerSection * sections;

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

  function renderPage(page) {
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    // Group by column
    const cols = Array.from({ length: sections }, () => []);

    // Maintain variety: take newest from each source
    const sourceGroups = {};
    pageArticles.forEach(a => {
      if (!sourceGroups[a.source]) sourceGroups[a.source] = [];
      sourceGroups[a.source].push(a);
    });

    let added;
    do {
      added = false;
      for (const src of Object.keys(sourceGroups)) {
        if (sourceGroups[src].length) {
          const article = sourceGroups[src].shift();
          // Find column with least articles
          let minCol = 0;
          for (let i = 1; i < cols.length; i++) {
            if (cols[i].length < cols[minCol].length) minCol = i;
          }
          cols[minCol].push(article);
          added = true;
        }
      }
    } while (added);

    // Sort each column by recency (newest first)
    cols.forEach(col => col.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)));

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
        link.className = a.title.length > 60 ? "big" : "";
        link.innerHTML = `${a.title}<span class="meta">${a.source} • ${timeAgo(a.published_at)}</span>`;
        section.appendChild(link);
      });

      app.appendChild(section);
    });

    updatePagination();
  }

  // -------- Fetch JSON and Init --------
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    articles = data.articles;

    renderPage(currentPage);
    updateTimestamp();

    // Expose next/prev for buttons
    window.nextPage = nextPage;
    window.prevPage = prevPage;
  } catch (err) {
    console.error("Failed to load news.json", err);
    document.getElementById(appElemId).textContent = "Failed to load news.";
  }
}
