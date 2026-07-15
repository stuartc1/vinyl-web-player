/*
Template: Vinyl-Web-Player
Author: Stu Cochrane (stuartc1)
GitHub: https://github.com/stuartc1/vinyl-web-player
License: MIT
*/

// ============================================================
// Theme toggle
// ============================================================
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");

  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
})();

// ============================================================
// Song grid
// ============================================================
(function () {
  const grid = document.getElementById("grid");
  const emptyState = document.getElementById("empty-state");

  // Fallback sample data — used only if songs.json can't be fetched
  // (e.g. opening index.html directly via file:// without a local server).
  const FALLBACK_SONGS = [
    {
      image: "assets/covers/track-01.jpg",
      title: "Sample Track One",
      description:
        "Replace songs.json with your own tracks — this placeholder shows while that file is unreachable.",
      mp3: "assets/audio/track-01.mp3",
    },
  ];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  function renderSongs(songs) {
    if (!Array.isArray(songs) || songs.length === 0) {
      emptyState.hidden = false;
      return;
    }

    const frag = document.createDocumentFragment();

    songs.forEach((song, i) => {
      const card = document.createElement("article");
      card.className = "card";

      card.innerHTML = `
        <div class="cover-wrap" role="button" tabindex="0" aria-label="Play or pause ${escapeHtml(song.title)}">
          <div class="record" aria-hidden="true"></div>
          <img src="${escapeHtml(song.image)}" alt="${escapeHtml(song.title)} cover art" loading="lazy">
          <span class="playing-dot" aria-hidden="true"></span>
        </div>
        <div class="card-body">
          <h3 class="track-title">${escapeHtml(song.title)}</h3>
          <p class="track-desc">${escapeHtml(song.description)}</p>
          <div class="audio-wrap">
            <audio controls controlsList="nodownload noplaybackrate" preload="metadata">
              <source src="${escapeHtml(song.mp3)}" type="audio/mpeg">
              Your browser doesn't support HTML5 audio.
            </audio>
          </div>
        </div>
      `;

      const audioEl = card.querySelector("audio");
      const coverEl = card.querySelector(".cover-wrap");
      audioEl.setAttribute("playsinline", "");

      function setActiveCard(activeAudioEl) {
        document.querySelectorAll("audio").forEach((other) => {
          if (other !== activeAudioEl) other.pause();
        });
        document
          .querySelectorAll(".card")
          .forEach((c) => c.classList.remove("is-playing"));
        card.classList.add("is-playing");
      }

      function togglePlayback(event) {
        if (event) event.preventDefault();

        if (audioEl.paused) {
          setActiveCard(audioEl);
          card.classList.add("is-playing");
          audioEl.play().catch(() => {
            card.classList.remove("is-playing");
          });
        } else {
          audioEl.pause();
          card.classList.remove("is-playing");
        }
      }

      audioEl.addEventListener("contextmenu", (e) => e.preventDefault());

      audioEl.addEventListener("play", () => {
        setActiveCard(audioEl);
      });

      audioEl.addEventListener("pause", () => {
        card.classList.remove("is-playing");
      });

      audioEl.addEventListener("ended", () => {
        card.classList.remove("is-playing");
      });

      coverEl.addEventListener("click", togglePlayback);

      coverEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          togglePlayback(event);
        }
      });

      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  fetch("songs.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("songs.json not found");
      return res.json();
    })
    .then(renderSongs)
    .catch(() => renderSongs(FALLBACK_SONGS));
})();
