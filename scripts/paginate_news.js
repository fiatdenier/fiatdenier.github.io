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
  let columns = [];
  let usePrebuiltColumns = false;
  let currentPage = 1;

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
    return arr.filter((a) => {
      const key = a.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderPage(page) {
    const app = document.getElementById(appElemId);
    app.innerHTML = "";

    if (usePrebuiltColumns) {
      // 🔹 Use pre-sorted columns from news.json
      columns.forEach((col, idx) => {
        const section = document.createElement("section");
        section.className = "col";
        section.id = ["left", "center", "right"][idx] || `col-${idx}`;
        col.slice((page - 1) * articlesPerSection, page * articlesPerSection).forEach((a) => {
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
    } else {
      // 🔹 Old logic (fallback if no columns in JSON)
      const startIdx = (page - 1) * articlesPerSection * sections;
      const endIdx = startIdx + articlesPerSection * sections;
      const pageArticles = articles.slice(startIdx, endIdx);

      const cols = Array.from({ length: sections }, () => []);
      let colIndex = 0;
      const usedSources = new Set();

      pageArticles.forEach((article) => {
        if (!usedSources.has(article.source)) {
          cols[colIndex % sections].push(article);
          usedSources.add(article.source);
          colIndex++;
        }
      });

      pageArticles.forEach((article) => {
        const alreadyIn = cols.some((col) => col.includes(article));
        if (!alreadyIn) {
          cols[colIndex % sections].push(article);
          colIndex++;
        }
      });

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
    }

    updatePagination();
  }

  function updatePagination() {
    const totalPages = usePrebuiltColumns
      ? Math.ceil(columns[0].length / articlesPerSection)
      : Math.ceil(articles.length / (articlesPerSection * sections));

    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${totalPages}`;
  }

  function nextPage() {
    const totalPages = usePrebuiltColumns
      ? Math.ceil(columns[0].length / articlesPerSection)
      : Math.ceil(articles.length / (articlesPerSection * sections));
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
      const res = await fetch("./scripts/news.json?ts=${Date.now()}");
      const data = await res.json();

      if (data.columns) {
        usePrebuiltColumns = true;
        columns = data.columns;
      } else {
        articles = removeDuplicates(data.articles)
          .filter((a) => {
            const now = new Date();
            const pub = new Date(a.published_at);
            return (now - pub) / (1000 * 60 * 60 * 24) <= 21;
          })
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      }

      renderPage(currentPage);
      updateTimestamp();
    } catch (e) {
      console.error("Failed to load news.json", e);
      document.getElementById(appElemId).textContent = "Failed to load news.";
    }
  }

  window.nextPage = nextPage;
  window.prevPage = prevPage;

  init();
}
