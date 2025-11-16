# Dashboard

A lightweight digital signage dashboard that combines a weather panel, a clock, and a three-month calendar in a responsive layout. All assets are plain HTML, CSS, and JavaScript so the site can be hosted easily on GitHub Pages or any static host. Currently only support Japanese.

<img width="1652" height="981" alt="image" src="https://github.com/user-attachments/assets/5e1ddc5f-ab03-493e-ac88-5becf0e38059" />


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

## Install As A PWA

- Serve the project over `https://` or `http://localhost` so the service worker can run.
- Open the dashboard in a Chromium-based browser and wait for the panels to finish loading.
- Use the browser's install button (Chrome: address bar icon or *⋮ > Install Simple Dashboard*) to add it to your device.
- After installing, the dashboard runs fullscreen with cached assets so the latest data is available even if the network drops.

## Credits

- [Leaflet 1.9.4](https://leafletjs.com/) — BSD 2-Clause license.
- Basemap tiles © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) — ODbL 1.0.
- Radar imagery from [RainViewer](https://www.rainviewer.com/) — RainViewer Terms of Use.
- Forecast data from [Open-Meteo API](https://open-meteo.com/) — CC BY 4.0.
- Japanese holiday dataset from [holidays-jp](https://github.com/holiday-jp/holiday_jp) — MIT License.

## License

All original dashboard source code in this repository is released under the [MIT License](LICENSE).
This MIT License applies only to the original source code of this app.  

