# Mushaf Plus 📖

A premium, fully responsive browser-based application designed to help users memorize and perfect their Quranic recitation (Tajweed) with Bosnian localized interface.

Built entirely with modern Web Technologies, this app operates entirely locally in the browser, offering a highly responsive, offline-capable, and private environment to study.

## ✨ Key Features

- **Centralized Bosnian Translation**: Fully localized interface using a custom `i18n.js` translation engine.
- **Tajweed Color-Coding & Tooltips**: Advanced text engine that highlights Tajweed rules (Ikhfa, Izhar, Qalqala, etc.) with real-time tooltips explaining each rule upon click.
- **Global Search Engine**: Instantly search across the entire Quran by text content or reference (e.g., "2:255"). Operates with a debounced results dropdown.
- **Self-Recording Engine**: Uses your device's microphone to let you record your own recitation. Play it back immediately to compare your Tajweed against the Sheikh's recitation.
- **Interactive Typography Settings**: Customize your study experience with live-updating sliders for Arabic font size, translation size, and line height. Features a live preview of Surah Ikhlas.
- **Dual Mode UI**: Seamless toggle between Dark Mode and Light Mode, with multiple accent themes (Emerald, Blue, Amber, Rose, Purple, Teal).
- **Progress Tracking & Grid**: Mark Ayahs as "Valid" (memorized) to visually track progress. Features a compact, responsive Ayah grid for quick navigation.
- **Bookmarks & Notes**: Save your favorite spots and attach private notes to any Ayah. Your session is automatically restored (last surah viewed) upon reopening the app.
- **Keyboard Shortcuts**: Advanced shortcuts for hands-free study (`Space` to record, `P` for Sheikh, `U` for user recording).
- **Data Portability**: Import/Export your progress, bookmarks, and notes as a JSON file.

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS + Custom CSS (`css/styles.css`) for fine-tuned responsiveness and theme variables.
- **Icons**: [Ionicons](https://ionic.io/ionicons)
- **Data**: Static JavaScript arrays containing the Quranic text and references (`quran_data.js`).
- **Localization**: Specialized `i18n.js` for dynamic string management.

## 🚀 Getting Started

Running the app is simple as it requires no backend. To run:

1. Clone or download this repository.
2. Ensure you have the audio MP3 files in an `mp3/` folder (format: `[SurahNumber][AyahNumber].mp3`).
3. Open `index.html` in any modern web browser.

### 🎨 Development & Styling

The app uses a static production build of **Tailwind CSS**. If you modify the `index.html` structure or add new classes, you need to rebuild the CSS:

```bash
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify
```

### Note on Microphone Permissions

Microphone access requires a secure context (HTTPS or localhost). If running locally, please use a server like **VS Code Live Server** or similar to enable the recording feature.

## 🗂 Project Structure

```text
├── index.html        # Main standard UI markup
├── css/
│   ├── styles.css            # Centralized custom typography and theme logic
│   ├── input.css             # Tailwind input file
│   └── tailwind-output.css   # Main production CSS build
├── js/
│   ├── app.js        # Initializer and global search logic
│   ├── i18n.js       # Bosnian translation engine & string definitions
│   ├── actions.js    # Logic for Bookmarks, Notes, and Progress Tracking
│   ├── audio.js      # MediaRecorder and audio engine
│   ├── render.js     # Dynamic DOM manipulation & Ayah Grid logic
│   ├── config.js     # State management and DOM references
│   └── utils.js      # Tajweed formatting and helper utilities
├── quran_data.js     # Quranic text dataset (Arabic & Translation)
└── mp3/              # (User provided) Audio recitation files
```

## ⌨️ Keyboard Shortcuts

| Key           | Action                       |
| ------------- | ---------------------------- |
| `Right Arrow` | Next Ayah                    |
| `Left Arrow`  | Previous Ayah                |
| `Space`       | Toggle Microphone Recording  |
| `V`           | Mark Ayah as "Valid"         |
| `P` / `Enter` | Play/Pause Sheikh Recitation |
| `U`           | Play/Pause User Recording    |
