const form = document.getElementById("brief-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const roundsEl = document.getElementById("rounds");
const fileInput = document.getElementById("reference_image");
const fileDropLabel = document.getElementById("file-drop-label");
const fileDropName = document.getElementById("file-drop-name");

const roundCards = new Map(); // round number -> DOM element

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileDropName.textContent = file ? file.name : "";
  fileDropLabel.textContent = file ? "Attached:" : "No file attached — tap to browse";
});

function setStatus(text, kind) {
  statusEl.classList.remove("hidden", "error", "success");
  if (kind) statusEl.classList.add(kind);
  statusEl.textContent = text;
}

function scoreClass(score) {
  if (score == null) return "";
  if (score >= 8) return "good";
  if (score <= 4) return "bad";
  return "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Under review...";
  setStatus("Opening the file...");
  resultsEl.classList.remove("hidden");
  roundsEl.innerHTML = "";
  roundCards.clear();

  const formData = new FormData(form);

  try {
    const res = await fetch("/api/generate/stream", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    await readEventStream(res);
  } catch (err) {
    setStatus(`Something went wrong: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for Review →";
  }
});

// Server-Sent Events arrive as "data: {...}\n\n" chunks over a streamed
// fetch response body (EventSource can't be used here since this is a POST
// with a file upload). We read the stream manually and split on blank lines.
async function readEventStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop(); // last chunk may be incomplete, keep it for next read

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const event = JSON.parse(line.slice(5).trim());
      handleEvent(event);
    }
  }
}

function handleEvent(event) {
  switch (event.type) {
    case "round_start":
      setStatus(`Round ${event.round}: developing and marking up...`);
      break;
    case "round_result":
      renderRound(event);
      break;
    case "warning":
      setStatus(event.message, "error");
      break;
    case "error":
      setStatus(`Round ${event.round ?? ""} failed: ${event.message}`, "error");
      break;
    case "done":
      markFinal(event.final_round);
      setStatus("Filed — session log stored in B2.", "success");
      break;
  }
}

function verifyBadge(verified) {
  if (verified === true) return `<span class="verify-badge ok" title="genblaze verified this manifest's SHA-256 provenance chain">✓ Verified</span>`;
  if (verified === false) return `<span class="verify-badge fail" title="genblaze could not verify this manifest">⚠ Verification failed</span>`;
  return "";
}

function renderRound(round) {
  const score = round.critique?.score ?? null;
  const verdict = round.critique?.verdict ?? "revise";
  const approved = verdict === "approve" || (score ?? 0) >= 8;
  const issue = round.critique?.issue || round.critique?.note || "";

  const card = document.createElement("div");
  card.className = "round-card";
  card.innerHTML = `
    <div class="thumb">
      <img src="${round.image_url}" alt="Round ${round.round} generated ad image" loading="lazy" />
      <span class="stamp ${approved ? "approved" : ""}">${approved ? "Approved" : "Revise"}</span>
    </div>
    <div class="round-meta">
      <div class="round-title">
        Round ${round.round}
        <span class="score-pill ${scoreClass(score)}">${score ?? "?"}/10</span>
      </div>
      <p class="issue">${issue ? `"${issue}"` : "Critic approved this take."}</p>
      <div class="round-links">
        <a href="${round.image_url}" download target="_blank" rel="noopener">download</a>
        <a href="${round.manifest_uri}" target="_blank" rel="noopener" title="SHA-256 provenance manifest stored in B2">view manifest</a>
        ${verifyBadge(round.verified)}
      </div>
      <div class="sha">SHA-256 ${round.sha256 ? round.sha256.slice(0, 20) + "…" : "n/a"}</div>
    </div>
  `;
  roundCards.set(round.round, card);
  roundsEl.appendChild(card);
}

function markFinal(finalRoundNumber) {
  const card = roundCards.get(finalRoundNumber);
  if (!card) return;
  const title = card.querySelector(".round-title");
  const badge = document.createElement("span");
  badge.className = "final-badge";
  badge.textContent = "✓ Final pick";
  title.appendChild(badge);
}
