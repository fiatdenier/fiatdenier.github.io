// scripts/paginate_news.js
// ES module for paginated Bitcoin news display

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
  let currentPage = 1;
  let articles = [];

  // --- Time display ---
  function updateTimestamp() {
    const updatedEl = document.getElementById(updatedElemId);
    const now = new Date();
    const estDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    const estStr = estDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    updatedEl.textContent = `Updated ${estStr} EST`;
  }

  // --- Format published time ---
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

  // --- Render current page ---
  function renderPage(page) {
    const articlesPerPage = articlesPerSection * sections;
    const startIdx = (page - 1) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    const cols = Array.from({ length: sections }, () => []);

    pageArticles.forEach((a, i) => {
      const col = i % sections;
      cols[col].push(a);
    });

    const app = document.getElementById(appElemId);
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

  // --- Pagination buttons ---
  function updatePagination() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
    document.getElementById(prevBtnId).disabled = currentPage === 1;
    document.getElementById(nextBtnId).disabled = currentPage === totalPages;
    document.getElementById(pageInfoId).textContent = `Page ${currentPage} of ${totalPages}`;
  }

  function nextPage() {
    const totalPages = Math.ceil(articles.length / (articlesPerSection * sections));
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

  // Attach buttons to window so inline onclick works
  window.nextPage = nextPage;
  window.prevPage = prevPage;

  // --- Fetch news and initialize ---
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    articles = data.articles || [];
    renderPage(currentPage);
    updateTimestamp();
  } catch (e) {
    console.error('Failed to load news.json', e);
    document.getElementById(appElemId).textContent = 'Failed to load news.';
  }
}
