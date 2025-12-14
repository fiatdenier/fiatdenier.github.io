// /scripts/paginate_news.js (CORRECTED)
export function paginateNews(config) {
  const {
    articlesPerSection = 10,
    sections = 3,
    updatedElemId,
    appElemId,
    prevBtnId,
    nextBtnId,
    pageInfoId,
    // 💡 FIX 1: Destructure jsonPath from the config object
    jsonPath = './scripts/news.json', 
  } = config;

  let articles = [];
  let columns = [];
  let usePrebuiltColumns = false;
  let currentPage = 1;

  // ... (all other helper functions remain the same) ...

  async function init() {
    try {
      // 💡 FIX 2: Use the dynamic jsonPath variable
      const res = await fetch(jsonPath);
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
