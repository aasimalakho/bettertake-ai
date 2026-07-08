const statusEl = document.getElementById("history-status");
const gridEl = document.getElementById("history-grid");

function scoreClass(score) {
  if (score == null) return "";
  if (score >= 8) return "good";
  if (score <= 4) return "bad";
  return "";
}

(async function loadHistory() {
  try {
    const res = await fetch("/api/sessions");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    const data = await res.json();
    render(data.sessions || []);
  } catch (err) {
    statusEl.classList.add("error");
    statusEl.textContent = `Couldn't reach the archive: ${err.message}`;
  }
})();

function render(sessions) {
  if (sessions.length === 0) {
    statusEl.textContent = "No campaigns filed yet — submit one from the home page.";
    return;
  }
  statusEl.classList.add("hidden");

  sessions.forEach((s) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      ${s.thumbnail_url ? `<img src="${s.thumbnail_url}" alt="${escapeHtml(s.product || "")}" loading="lazy" />` : `<div class="history-noimg">No image</div>`}
      <div class="history-meta">
        <div class="history-product">${escapeHtml(s.product || "Untitled campaign")}</div>
        <div class="history-direction">${escapeHtml(s.brand_direction || "")}</div>
        <div class="history-stats ${scoreClass(s.final_score)}">
          ${s.round_count} round${s.round_count === 1 ? "" : "s"}
          ${s.final_score != null ? `· ${s.final_score}/10` : ""}
        </div>
        <div class="history-date">${s.created_at ? new Date(s.created_at).toLocaleString() : ""}</div>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
