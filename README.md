# BigQuery Release Notes Hub & Share Hub

A premium, glassmorphic single-page web application that fetches the Google Cloud BigQuery Release Notes Atom feed, parses it into structured updates, filters them in real-time, and lets you compose and preview tweets to share them on X (Twitter).

Built with a **Python Flask** backend and a **vanilla HTML, CSS, and JavaScript** frontend.

---

## ✨ Features

- **Daily Release Splitter**: Automatically parses daily grouped logs into individual, categorized, card-based updates (*Features, Announcements, Changes, Issues/Fixes, Deprecations*).
- **Offline Caching**: Saves parsed data to a local `cache.json` disk cache to load updates instantly on startup and recover from connection drops gracefully.
- **X/Twitter Live Post Preview**:
  - Automatically formats drafts using three presets (*Concise, News, Detailed*).
  - Features an authentic X/Twitter visual preview card box.
  - Highlights hashtags (e.g. `#BigQuery`), handles (e.g. `@GoogleCloud`), and URLs in real-time.
  - Attaches a custom-generated BigQuery visualization link preview banner.
- **Smart Character Limits**: Adjusts counter lengths dynamically by treating URLs at X's standard 23-character t.co rate.
- **Dynamic Stats & Search**: Instantly filter updates by category or text search. View dashboard metrics tracking features, fixes, and announcements.
- **High-Fidelity Aesthetics**: Sleek dark/light theme switching with custom CSS variables, glassmorphic panels, dynamic card elevations, SVG loaders, and floating toast banners.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, `feedparser` (Atom parsing), `beautifulsoup4` (HTML parsing)
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, variables), Vanilla JavaScript (ES6+ State management, Clipboard APIs)
- **Visuals**: Inline custom SVG assets, Custom AI-generated tech banner illustration

---

## 🚀 How to Run the Project

### Prerequisites
- Python 3.9+ installed
- Git (optional)

### Setup & Run
1. Clone or navigate to the project directory:
   ```bash
   cd /Users/sarthaksahoo/bigquery-release-notes
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the environment and install dependencies:
   ```bash
   # On macOS/Linux:
   source .venv/bin/activate
   pip install flask requests feedparser beautifulsoup4

   # On Windows:
   .venv\Scripts\activate
   pip install flask requests feedparser beautifulsoup4
   ```

4. Launch the application:
   ```bash
   python app.py
   ```

5. Access the app in your browser at:
   👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## 📁 Project Structure

```
bigquery-release-notes/
├── .venv/                  # Virtual environment folder
├── .gitignore              # Files ignored by version control
├── app.py                  # Flask backend (feed fetcher, cache, router)
├── cache.json              # Local disk cache containing feed data
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Frontend page structure & inline SVGs
└── static/
    ├── css/
    │   └── style.css       # Layouts, themes, animations, & X card preview styles
    ├── images/
    │   └── bigquery_banner.jpg # Banner graphic for visual Tweet previews
    └── js/
        └── app.js          # State handling, live filters, text parsers, & sharing
```

---

## 📐 Architecture & Request Flow

1. **Initial Load**:
   - The user loads `/`. The Flask server serves `templates/index.html`.
   - The frontend calls `/api/notes`. The server reads `cache.json` and returns notes instantly.
   
2. **Refresh Cycle**:
   - The user clicks **Refresh Notes**.
   - The frontend shows a loading spinner and POSTs to `/api/refresh`.
   - The server downloads Google's XML feed, parses entry elements, splits them by category headers (`<h3>`), updates the disk cache, and returns the fresh JSON list.
   - The frontend recalculates metrics, redraws the cards, and fires a success toast.

3. **Composing & Sharing**:
   - Clicking a card opens the composer pane, binds the title/metadata, and formats the tweet preview.
   - Editing text updates the character counter and the live X mockup preview wrapper in real-time.
   - Clicking **Post on X** dispatches a standard Web Intent popup window (`https://twitter.com/intent/tweet?text=...`), prompting the user to share the update.

---

## 📄 License
This project is open-source and available under the MIT License.
