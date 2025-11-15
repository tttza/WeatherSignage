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

## Credits

- [Leaflet 1.9.4](https://leafletjs.com/) — BSD 2-Clause license.
- Basemap tiles © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) — ODbL 1.0.
- Radar imagery from [RainViewer](https://www.rainviewer.com/) — RainViewer Terms of Use.
- Forecast data from [Open-Meteo API](https://open-meteo.com/) — CC BY 4.0.
- Japanese holiday dataset from [holidays-jp](https://github.com/holiday-jp/holiday_jp) — MIT License.

## License

All original dashboard source code in this repository is released under the [MIT License](LICENSE).
This MIT License applies only to the original source code of this app.  
