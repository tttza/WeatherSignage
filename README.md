# Dashboard

A lightweight digital signage dashboard that combines a weather panel, a clock, and a three-month calendar in a responsive layout. All assets are plain HTML, CSS, and JavaScript so the site can be hosted easily on GitHub Pages or any static host.

## Project Structure

```
root
├── index.html
├── assets/
│   ├── css/dashboard.css
│   └── js/
│       ├── main.js
│       └── modules/, utils/
└── panels/
    ├── calendar.html
    ├── clock.html
    └── weather.html
```

## Local Preview

Open `index.html` directly in your browser, or serve the folder with any static HTTP server.:

```cmd
npx serve -l 8000
```

Then visit `http://localhost:8000/` in your browser.
