// app.js
async function loadNews(page = 1) {
  try {
    const res = await fetch("data/news.json");
    const data = await res.json();

    // Update header with EST time
    const updated = new Date(data.updated_at);
    document.getElementById("updated-time").textContent =
      updated.toLocaleString("en-US", { timeZone: "America/New_York" }) + " EST";

    // Split into <24h and older
    const now = new Date();
    const cutoff = now.getTime() - 24 * 60 * 60 * 1000;

    const recent = data.articles.filter(
      (a) => new Date(a.published_at).getTime() >= cutoff
    );
    const older = data.articles.filter(
      (a) => new Date(a.published_at).getTime() < cutoff
    );

    let articles = [];

    if (page === 1) {
      // Page 1 = all <24h
      articles = recent;
    } else {
      // Pages 2+ = older articles, paginated
      const perPage = 20;
      const start = (page - 2) * perPage;
      const end = start + perPage;
      articles = older.slice(start, end);
    }

    const container = document.getElementById("news-container");
    container.innerHTML = "";

    articles.forEach((a) => {
      const pub = new Date(a.published_at);
      const div = document.createElement("div");
      div.className = "article";
      div.innerHTML = `
        <a href="${a.url}" target="_blank">${a.title}</a>
        <div class="meta">${a.source} • ${pub.toLocaleString("en-US", {
        timeZone: "America/New_York",
      })} EST</div>
      `;
      container.appendChild(div);
    });

    // Pagination buttons
    const perPage = 20;
    const totalPages = 1 + Math.ceil(older.length / perPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === page) btn.classList.add("active");
      btn.onclick = () => loadNews(i);
      pagination.appendChild(btn);
    }
  } catch (err) {
    console.error("Failed to load news:", err);
  }
}

// Load first page on startup
document.addEventListener("DOMContentLoaded", () => loadNews(1));
