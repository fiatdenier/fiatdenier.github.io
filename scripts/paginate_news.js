// /scripts/paginate_news.js
export function paginateNews(config) {
  const {
    jsonPath = "./data/news.json", // Matches your GitHub Action move
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

  // Internal helper functions
  const timeAgo = (dateStr) => {
    const diffMins = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const hours = Math.floor(diffMins / 60);
    return hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
  };

  const renderPage = (page) => {
    const start = (page - 1) * (articlesPerSection * sections);
    const pageArticles = articles.slice(start, start + (articlesPerSection * sections));
    const app = document.getElementById(appElemId);
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
  };

  const updatePagination = () => {
    const total = Math.ceil(articles.length / (articlesPerSection * sections));
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === total || total === 0;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${total || 1}`;
  };

  // THE FIX: Explicitly attach the logic to the buttons
  async function init() {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();
      articles = data.articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

      // Connect the buttons to the functions
      document.getElementById(nextBtnId).onclick = () => {
        currentPage++;
        renderPage(currentPage);
        window.scrollTo(0, 0);
      };
      document.getElementById(prevBtnId).onclick = () => {
        currentPage--;
        renderPage(currentPage);
        window.scrollTo(0, 0);
      };

      renderPage(currentPage);
    } catch (e) {
      console.error("Path Error:", e);
      document.getElementById(appElemId).innerText = "Could not load news from " + jsonPath;
    }
  }
  init();
}