function renderPage(page) {
    const totalArticlesPerPage = articlesPerSection * sections;
    const startIdx = (page - 1) * totalArticlesPerPage;
    const endIdx = startIdx + totalArticlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    const cols = Array.from({ length: sections }, () => []);
    let colIndex = 0;
    
    // --- START: MODIFIED DISTRIBUTION LOGIC ---
    // This simple sequential distribution preserves the global time sort (newest first).
    // The newest article (index 0) goes to Column 0.
    // The second newest (index 1) goes to Column 1.
    // The fourth newest (index 3) goes back to Column 0, appearing immediately after the newest article in that column.
    
    pageArticles.forEach(article => {
      // Use the modulo operator to cycle articles through columns (0, 1, 2, 0, 1, 2, ...)
      cols[colIndex % sections].push(article);
      colIndex++;
    });
    // --- END: MODIFIED DISTRIBUTION LOGIC ---

    const app = document.getElementById(appElemId);
    app.innerHTML = "";

    // The rendering loop remains the same
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
