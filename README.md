# MoodShelf

A small reading app that recommends books from **how you feel today** and **what you have already read**.

Book metadata and covers come from the free [Open Library](https://openlibrary.org/developers/api) APIs. Your shelf is stored only in this browser (`localStorage`). No account, no API key.

## How it works

1. Pick a mood on **Discover** (cozy, tense, epic, tender, curious, and so on).
2. Optionally turn on **Lean on books I’ve already liked**.
3. Add finished books on **My shelf** and rate them.
4. MoodShelf searches Open Library with mood subjects, then scores results against subjects from books you rated highly.

## Run it

This is a static site. Open `index.html` in a browser, or serve the folder:

```bash
cd moodshelf
python3 -m http.server 8000
```

Then visit http://localhost:8000

A network connection is required so the app can query Open Library.

## Project files

- `index.html` — page structure
- `styles.css` — layout and theme
- `app.js` — moods, shelf, search, and ranking
