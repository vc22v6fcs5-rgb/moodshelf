const STORAGE_KEY = "moodshelf.v1";

const MOODS = [
  {
    id: "cozy",
    emoji: "☕",
    name: "Cozy",
    blurb: "Warm, low-stakes, comforting",
    subjects: ["cozy mystery", "cozy", "domestic fiction", "small town", "found family", "comfort"],
    queries: ["cozy mystery", "cozy fantasy", "feel good fiction"],
    hint: "Soft lighting energy. Think bookshops, kitchens, found family, and mysteries that get solved over tea.",
  },
  {
    id: "adventure",
    emoji: "🗺️",
    name: "Adventurous",
    blurb: "Movement, discovery, stakes",
    subjects: ["adventure", "quest", "travel", "survival", "exploration", "action"],
    queries: ["adventure fiction", "quest fantasy", "survival novel"],
    hint: "You want to leave the house without leaving the chair. Big landscapes, journeys, and motion.",
  },
  {
    id: "epic",
    emoji: "⚔️",
    name: "Epic",
    blurb: "Worlds, maps, long haul",
    subjects: ["epic fantasy", "high fantasy", "science fiction", "space opera", "world-building"],
    queries: ["epic fantasy", "space opera", "high fantasy"],
    hint: "Sprawling worlds, invented maps, and books that make dinner an afterthought.",
  },
  {
    id: "romance",
    emoji: "💌",
    name: "Romantic",
    blurb: "Yearning, spark, closeness",
    subjects: ["romance", "love stories", "romantic comedy", "historical romance"],
    queries: ["romance novel", "romantic comedy", "love story fiction"],
    hint: "Chemistry first. Contemporary swoon, historical heat, or a love story hiding in another genre.",
  },
  {
    id: "thrill",
    emoji: "🔦",
    name: "Tense",
    blurb: "Paced, twisty, alert",
    subjects: ["thriller", "suspense", "mystery", "crime", "psychological thriller"],
    queries: ["psychological thriller", "crime thriller", "suspense novel"],
    hint: "Short chapters, rising pulse. You want to know what happens next more than you want to sleep.",
  },
  {
    id: "dark",
    emoji: "🌑",
    name: "Dark",
    blurb: "Bleak, gothic, unsettling",
    subjects: ["horror", "gothic", "dark fantasy", "psychological fiction", "occult"],
    queries: ["gothic novel", "horror fiction", "dark fantasy"],
    hint: "Atmosphere over comfort. Fog, dread, morally gray people, and stories that leave a bruise.",
  },
  {
    id: "sad",
    emoji: "🌧️",
    name: "Tender",
    blurb: "Quiet, emotional, human",
    subjects: ["literary fiction", "family", "grief", "coming of age", "relationships"],
    queries: ["literary fiction", "family saga", "coming of age novel"],
    hint: "Not forced cheerfulness. Company for a heavy or reflective day — slow, human, precise.",
  },
  {
    id: "funny",
    emoji: "😄",
    name: "Playful",
    blurb: "Wit, lightness, mischief",
    subjects: ["humor", "comedy", "satire", "comic novel", "funny"],
    queries: ["humorous fiction", "comic novel", "satire"],
    hint: "You want to smirk on public transit. Voice-forward books with timing and mischief.",
  },
  {
    id: "curious",
    emoji: "🔬",
    name: "Curious",
    blurb: "Learn something real",
    subjects: ["science", "history", "biography", "essays", "psychology", "nature"],
    queries: ["popular science", "narrative history", "biography"],
    hint: "Nonfiction that reads like a story. Big ideas, lives, and how the world actually works.",
  },
  {
    id: "inspired",
    emoji: "🔥",
    name: "Fired up",
    blurb: "Drive, change, courage",
    subjects: ["self-help", "leadership", "memoir", "creativity", "business"],
    queries: ["motivational memoir", "creativity", "personal development"],
    hint: "A spark more than a lecture. Lives and ideas that make you want to start something.",
  },
];

const state = {
  mood: "cozy",
  shelf: loadShelf(),
  tab: "discover",
};

function loadShelf() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveShelf() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.shelf));
  renderShelfCount();
}

function $(sel) {
  return document.querySelector(sel);
}

function coverUrl(coverId, size = "M") {
  if (!coverId) return "";
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

function workId(key) {
  return key || "";
}

function normalizeTitle(title) {
  return (title || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function onShelf(book) {
  const id = workId(book.key);
  const title = normalizeTitle(book.title);
  return state.shelf.some((b) => b.key === id || normalizeTitle(b.title) === title);
}

function likedSubjects() {
  const weights = new Map();
  for (const book of state.shelf) {
    const weight = (book.rating || 3) >= 4 ? 2 : 1;
    for (const s of book.subjects || []) {
      const key = s.toLowerCase();
      if (key.length < 3) continue;
      weights.set(key, (weights.get(key) || 0) + weight);
    }
  }
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([subject]) => subject);
}

function currentMood() {
  return MOODS.find((m) => m.id === state.mood) || MOODS[0];
}

function renderMoods() {
  const grid = $("#mood-grid");
  grid.innerHTML = MOODS.map((m) => `
    <button type="button" class="mood ${m.id === state.mood ? "is-on" : ""}" data-mood="${m.id}">
      <span class="emoji">${m.emoji}</span>
      <span class="name">${m.name}</span>
      <span class="blurb">${m.blurb}</span>
    </button>
  `).join("");
  $("#mood-hint").textContent = currentMood().hint;
}

function renderShelfCount() {
  $("#shelf-count").textContent = String(state.shelf.length);
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach((btn) => {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  $("#panel-discover").hidden = tab !== "discover";
  $("#panel-shelf").hidden = tab !== "shelf";
}

async function searchOpenLibrary(q, limit = 12) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count,number_of_pages_median"
  );
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Open Library request failed");
  const data = await res.json();
  return data.docs || [];
}

function scoreBook(book, mood, tasteSubjects, useShelf) {
  const subjects = (book.subjects || []).map((s) => s.toLowerCase());
  let score = 0;
  const reasons = [];

  for (const s of mood.subjects) {
    if (subjects.some((x) => x.includes(s) || s.includes(x))) {
      score += 4;
    }
  }

  if (useShelf && tasteSubjects.length) {
    let hits = 0;
    for (const t of tasteSubjects) {
      if (subjects.some((x) => x.includes(t) || t.includes(x))) hits += 1;
    }
    if (hits) {
      score += hits * 3;
      reasons.push(`echoes ${hits} theme${hits > 1 ? "s" : ""} from books you liked`);
    }
  }

  if (book.ratings_average) score += book.ratings_average;
  if (book.ratings_count > 20) score += 1;
  if (book.cover_i) score += 0.5;

  if (!reasons.length) reasons.push(`matches a ${mood.name.toLowerCase()} reading mood`);
  return { score, reason: reasons[0] };
}

async function recommend() {
  const mood = currentMood();
  const status = $("#status");
  const results = $("#results");
  const btn = $("#recommend-btn");
  const useShelf = $("#prefer-shelf").checked && state.shelf.length > 0;
  const taste = likedSubjects();

  btn.disabled = true;
  status.hidden = false;
  status.textContent = useShelf
    ? `Searching Open Library for ${mood.name.toLowerCase()} books that rhyme with your shelf…`
    : `Searching Open Library for ${mood.name.toLowerCase()} books…`;
  results.innerHTML = "";

  try {
    const queries = [...mood.queries];
    if (useShelf && taste.length) {
      queries.push(`subject:(${taste.slice(0, 3).map((s) => `"${s}"`).join(" OR ")})`);
    }

    const bags = await Promise.all(queries.slice(0, 3).map((q) => searchOpenLibrary(q, 16)));
    const merged = new Map();
    for (const doc of bags.flat()) {
      if (!doc.title || !doc.key) continue;
      if (onShelf(doc)) continue;
      if (!merged.has(doc.key)) merged.set(doc.key, doc);
    }

    const ranked = [...merged.values()]
      .map((book) => {
        const { score, reason } = scoreBook(book, mood, taste, useShelf);
        return { book, score, reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 9);

    if (!ranked.length) {
      status.textContent = "No fresh titles came back. Add a couple of books to your shelf and try again.";
      return;
    }

    status.textContent = useShelf
      ? `Nine picks for a ${mood.name.toLowerCase()} mood, tilted toward your shelf.`
      : `Nine picks for a ${mood.name.toLowerCase()} mood. Add books you’ve read to personalize this.`;

    results.innerHTML = ranked.map(({ book, reason }) => bookCard(book, reason)).join("");
  } catch (err) {
    console.error(err);
    status.textContent = "Could not reach Open Library. Check your connection and try again.";
  } finally {
    btn.disabled = false;
  }
}

function bookCard(book, reason) {
  const authors = (book.author_name || []).slice(0, 2).join(", ") || "Unknown author";
  const year = book.first_publish_year ? ` · ${book.first_publish_year}` : "";
  const subjects = (book.subjects || []).slice(0, 4);
  const img = coverUrl(book.cover_i);
  const cover = img
    ? `<img class="cover" src="${img}" alt="" />`
    : `<div class="cover ph">No cover</div>`;
  const saved = onShelf(book);
  return `
    <article class="book-card" data-key="${escapeAttr(book.key)}">
      ${cover}
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="meta">${escapeHtml(authors)}${year}</p>
        <p class="why">${escapeHtml(reason)}</p>
        <div class="chips">${subjects.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("")}</div>
        <div class="actions">
          <button type="button" class="save" data-add="${encodeURIComponent(JSON.stringify(slim(book)))}" ${saved ? "disabled" : ""}>
            ${saved ? "On shelf" : "I read this"}
          </button>
          <a class="ghost" href="https://openlibrary.org${book.key}" target="_blank" rel="noopener">Open Library</a>
        </div>
      </div>
    </article>
  `;
}

function slim(book) {
  return {
    key: book.key,
    title: book.title,
    author_name: book.author_name || [],
    first_publish_year: book.first_publish_year || null,
    cover_i: book.cover_i || null,
    subjects: (book.subjects || []).slice(0, 12),
    rating: 4,
  };
}

function addToShelf(book) {
  if (onShelf(book)) return;
  state.shelf.unshift({ ...slim(book), rating: book.rating || 4, addedAt: Date.now() });
  saveShelf();
  renderShelf();
}

function removeFromShelf(key) {
  state.shelf = state.shelf.filter((b) => b.key !== key);
  saveShelf();
  renderShelf();
}

function setRating(key, rating) {
  const book = state.shelf.find((b) => b.key === key);
  if (!book) return;
  book.rating = rating;
  saveShelf();
  renderShelf();
}

function renderShelf() {
  renderShelfCount();
  const list = $("#shelf-list");
  if (!state.shelf.length) {
    list.innerHTML = `<p class="hint">Your shelf is empty. Search a book you finished and add it — even five titles make recommendations sharper.</p>`;
    return;
  }
  list.innerHTML = state.shelf.map((book) => {
    const authors = (book.author_name || []).slice(0, 2).join(", ");
    const img = coverUrl(book.cover_i, "S");
    const stars = [1, 2, 3, 4, 5].map((n) =>
      `<button type="button" class="${n <= (book.rating || 0) ? "on" : ""}" data-rate="${book.key}|${n}" aria-label="${n} stars">★</button>`
    ).join("");
    return `
      <article class="shelf-item">
        ${img ? `<img src="${img}" alt="" />` : `<div class="cover ph" style="width:48px;height:70px">—</div>`}
        <div>
          <strong>${escapeHtml(book.title)}</strong>
          <div class="meta">${escapeHtml(authors)}</div>
          <div class="stars">${stars}</div>
        </div>
        <button class="ghost remove" type="button" data-remove="${escapeAttr(book.key)}">Remove</button>
      </article>
    `;
  }).join("");
}

async function searchToAdd(query) {
  const box = $("#search-results");
  box.innerHTML = `<p class="hint">Searching Open Library…</p>`;
  try {
    const docs = await searchOpenLibrary(query, 8);
    if (!docs.length) {
      box.innerHTML = `<p class="hint">Nothing matched that search.</p>`;
      return;
    }
    box.innerHTML = docs.map((book) => {
      const authors = (book.author_name || []).slice(0, 2).join(", ");
      const img = coverUrl(book.cover_i, "S");
      const saved = onShelf(book);
      return `
        <article class="search-hit">
          ${img ? `<img src="${img}" alt="" />` : `<div></div>`}
          <div>
            <strong>${escapeHtml(book.title)}</strong>
            <div class="meta">${escapeHtml(authors || "Unknown author")}</div>
          </div>
          <button type="button" class="primary" data-add="${encodeURIComponent(JSON.stringify(slim(book)))}" ${saved ? "disabled" : ""}>
            ${saved ? "Added" : "Add"}
          </button>
        </article>
      `;
    }).join("");
  } catch {
    box.innerHTML = `<p class="hint">Search failed. Try again in a moment.</p>`;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("'", "&#39;");
}

function bind() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  $("#mood-grid").addEventListener("click", (e) => {
    const mood = e.target.closest("[data-mood]");
    if (!mood) return;
    state.mood = mood.dataset.mood;
    renderMoods();
  });

  $("#recommend-btn").addEventListener("click", recommend);

  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#book-query").value.trim();
    if (q) searchToAdd(q);
  });

  $("#clear-shelf").addEventListener("click", () => {
    if (!state.shelf.length) return;
    if (confirm("Clear every book on this shelf?")) {
      state.shelf = [];
      saveShelf();
      renderShelf();
    }
  });

  document.body.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      try {
        addToShelf(JSON.parse(decodeURIComponent(addBtn.dataset.add)));
        addBtn.disabled = true;
        addBtn.textContent = "On shelf";
      } catch {}
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      removeFromShelf(rm.dataset.remove);
      return;
    }
    const rate = e.target.closest("[data-rate]");
    if (rate) {
      const [key, n] = rate.dataset.rate.split("|");
      setRating(key, Number(n));
    }
  });
}

renderMoods();
renderShelf();
bind();
