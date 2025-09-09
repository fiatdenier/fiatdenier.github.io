// scripts/paginate_news.js
export async function paginateNews({
  jsonPath = './data/news.json',
  articlesPerSection = 10,
  sections = 3,
  updatedElemId = 'updated',
  appElemId = 'app',
  prevBtnId = 'prev-btn',
  nextBtnId = 'next-btn',
  pageInfoId = 'page-info'
}) {
  const app = document.getElementById(appElemId);
  const updatedElem = document.getElementById(updatedElemId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);
  const pageInfo = document.getElementById(pageInfoId);

  let articles = [];
  let currentPage = 1;
  const articlesPerPage = articlesPerSection * sections;
  let totalPages = 1;

  // Fetch JSON
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    articles = data.articles || [];
    totalPages = Math.ceil(articles.length / articlesPerPage);

    // Set updated timestamp
    if (data.updated_at) {
      const dt = new Date(data.updated_at);
      updatedElem.textContent = `Updated ${dt.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`;
    }

    renderPage();
  } catch (e) {
    console.error('Failed to load news.json', e);
    app.innerHTML = '<p>Error loading articles.</p>';
  }

  function renderPage() {
    app.innerHTML = ''; // clear previous content

    const startIdx = (currentPage - 1) * articlesPerPage;
    const pageArticles = articles.slice(startIdx, startIdx + articlesPerPage);

    // Create columns
    const cols = [];
    for (let i = 0; i < sections; i++) {
      const col = document.createElement('section');
      col.classList.add('col');
      app.appendChild(col);
      cols.push(col);
    }

    // Distribute articles into columns
    pageArticles.forEach((article, i) => {
      const col = cols[i % sections];
      const a = document.createElement('a');
      a.href = article.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = article.title.length > 60 ? 'big' : ''; // optional styling
      a.innerHTML = `${article.title} <span class="meta">${article.source} • ${timeAgo(article.published_at)}</span>`;
      col.appendChild(a);
    });

    // Update buttons and page info
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date) / 1000); // seconds
    if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
  }

  // Pagination controls
  window.prevPage = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  window.nextPage = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  };
}
