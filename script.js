/*
Template: Vinyl-Web-Player
Author: Stu Cochrane (stuartc1)
GitHub: https://github.com/stuartc1/vinyl-web-player
License: MIT
*/
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

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

  function playNextTrack(currentCard) {
    const cards = Array.from(grid.querySelectorAll(".card"));
    const idx = cards.indexOf(currentCard);
    const nextCard = cards[idx + 1];

    if (!nextCard) return;

    nextCard.scrollIntoView({ behavior: "smooth", block: "center" });

    const nextAudio = nextCard.querySelector("audio");
    nextAudio.play().catch(() => {
      nextCard.classList.remove("is-playing");
    });
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
          <div class="vinyl-sheen" aria-hidden="true"></div>
          <div class="record" aria-hidden="true"></div>
          <img src="${escapeHtml(song.image)}" alt="${escapeHtml(song.title)} cover art" loading="lazy">
          <span class="playing-dot" aria-hidden="true"></span>
        </div>
        <div class="card-body">
          <h3 class="track-title">${escapeHtml(song.title)}</h3>
          <p class="track-desc">${escapeHtml(song.description)}</p>
          <div class="audio-wrap">
              <audio preload="metadata" style="display:none">
                <source src="${escapeHtml(song.mp3)}" type="audio/mpeg">
              </audio>
              <div class="player-controls">
                <button class="play-btn" type="button" aria-label="Play">
                  <svg class="icon-play" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                  <svg class="icon-pause" viewBox="0 0 24 24" width="16" height="16" hidden><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
                </button>
                <span class="time time-current">0:00</span>
                <div class="seek-bar" role="slider" aria-label="Seek" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div class="seek-track">
                    <div class="seek-fill"></div>
                    <div class="seek-thumb"></div>
                  </div>
                </div>
                <span class="time time-duration">0:00</span>
                <button class="volume-btn" type="button" aria-label="Mute">
                  <svg class="icon-vol-on" viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.06c1.5-.74 2.5-2.26 2.5-4.03z"/></svg>
                  <svg class="icon-vol-off" viewBox="0 0 24 24" width="15" height="15" hidden><path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 8v1.7l2.24 2.24c.17-.42.26-.87.26-1.94zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
                </button>
              </div>
            </div>
        </div>
      `;

      const audioEl = card.querySelector("audio");
      const coverEl = card.querySelector(".cover-wrap");
      const recordEl = card.querySelector(".record");
      const playBtn = card.querySelector(".play-btn");
      const iconPlay = card.querySelector(".icon-play");
      const iconPause = card.querySelector(".icon-pause");
      const timeCurrent = card.querySelector(".time-current");
      const timeDuration = card.querySelector(".time-duration");
      const seekBar = card.querySelector(".seek-bar");
      const seekFill = card.querySelector(".seek-fill");
      const seekThumb = card.querySelector(".seek-thumb");
      const volumeBtn = card.querySelector(".volume-btn");
      const iconVolOn = card.querySelector(".icon-vol-on");
      const iconVolOff = card.querySelector(".icon-vol-off");

      function formatTime(sec) {
        if (!isFinite(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
      }

      function updatePlayIcon() {
        const playing = !audioEl.paused;
        iconPlay.style.display = playing ? "none" : "block";
        iconPause.style.display = playing ? "block" : "none";
        playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
      }

      function updateSeek() {
        const pct = audioEl.duration ? (audioEl.currentTime / audioEl.duration) * 100 : 0;
        seekFill.style.width = `${pct}%`;
        seekThumb.style.left = `${pct}%`;
        seekBar.setAttribute("aria-valuenow", Math.round(pct));
        timeCurrent.textContent = formatTime(audioEl.currentTime);
      }

      audioEl.addEventListener("loadedmetadata", () => {
        timeDuration.textContent = formatTime(audioEl.duration);
      });
      audioEl.addEventListener("timeupdate", updateSeek);
      audioEl.addEventListener("play", updatePlayIcon);
      audioEl.addEventListener("pause", updatePlayIcon);

      playBtn.addEventListener("click", () => togglePlayback());

      function seekFromEvent(e) {
        const rect = seekBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        audioEl.currentTime = pct * (audioEl.duration || 0);
        updateSeek();
      }

      let seeking = false;
      seekBar.addEventListener("pointerdown", (e) => {
        seeking = true;
        seekFromEvent(e);
      });
      window.addEventListener("pointermove", (e) => {
        if (seeking) seekFromEvent(e);
      });
      window.addEventListener("pointerup", () => {
        seeking = false;
      });
      seekBar.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + 5);
        if (e.key === "ArrowLeft") audioEl.currentTime = Math.max(0, audioEl.currentTime - 5);
      });

      volumeBtn.addEventListener("click", () => {
        audioEl.muted = !audioEl.muted;
        iconVolOn.style.display = audioEl.muted ? "none" : "block";
        iconVolOff.style.display = audioEl.muted ? "block" : "none";
      });

      if (recordEl && song.vinyl) {
        try {
          const val = String(song.vinyl).trim();
          recordEl.style.setProperty("--vinyl-color", val);
          recordEl.dataset.vinyl = val; // helpful for debugging in DevTools
        } catch (e) {
          // ignore invalid values
        }
      }
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
        playNextTrack(card);
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
