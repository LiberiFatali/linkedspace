# LinkedSpace 🚀

> Expand LinkedIn's main tabs to full width. More space, less clutter.

![LinkedSpace Icon](icons/icon128.png)

---

## Features

- **Full-Width Tabs** – Expands LinkedIn's main tabs to the full viewport: Home, Messaging, My Network, Jobs and Notifications.
- **Right Rail Collapsed** – Messaging, My Network and Notifications collapse the ads/recommendations rail to maximize content area; Home keeps its rail and widens everything.
- **Dedicated Jobs Layout** – The Jobs results list and detail pane are expanded for a bigger search experience.
- **Adaptive Messaging List** – On `/messaging` the left pane scales with your screen (between 1/6 and 1/3 of viewport, capped at 400px) and re-adapts live on resize.
- **Overlay Bubble Untouched** – The floating chat bubble on other LinkedIn pages keeps its native behavior.
- **Console Quiet** – Blocks LinkedIn's `chrome-extension://invalid/` fingerprinting flood that spams the DevTools console on every pageview.
- **Auto-Apply** – Activates instantly when you open a supported LinkedIn page. No extra clicks needed.
- **SPA-Resilient** – A `MutationObserver` watches for LinkedIn's React re-renders and reapplies layout styles automatically.
- **Master Toggle** – Toolbar popup with a clean ON/OFF switch lets you pause the extension anytime.

---

## Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome/Brave and navigate to `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `linkedspace/` folder
5. Navigate to [linkedin.com](https://www.linkedin.com/) and enjoy!

---

## Project Structure

```
linkedspace/
├── manifest.json          # Manifest V3 config
├── content.js             # Core logic: DOM traversal & flex layout expansion
├── styles.css             # Scaffold-level full-width overrides
├── popup/
│   ├── popup.html         # Extension toolbar popup
│   ├── popup.js           # Popup toggle & status logic
│   └── popup.css          # Premium popup styles
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── store_assets/          # Chrome Web Store graphics & screenshots
│   ├── promo_tile_440x280.png
│   ├── screenshot_before.png
│   └── screenshot_after.png
├── .gitignore
├── LICENSE                # MIT License
└── README.md
```

---

## License

This project is open-source under the [MIT License](LICENSE).
