# LinkedSpace 🚀

> Expand LinkedIn messaging to full-width on both sides. More space, less clutter.

![LinkedSpace Icon](icons/icon128.png)

---

## Features

- **Full-Width Messaging** – Removes LinkedIn's cramped width constraints on the `/messaging` page.
- **Both-Sides Expansion** – Collapses unnecessary sidebars to maximize messaging area while keeping the left thread list comfortably sized.
- **Adaptive Conversation List** – The left pane scales with your screen (between 1/6 and 1/3 of viewport, capped at 400px) and re-adapts live on resize.
- **Overlay Bubble Untouched** – The floating chat bubble on other LinkedIn pages keeps its native behavior.
- **Console Quiet** – Blocks LinkedIn's `chrome-extension://invalid/` fingerprinting flood that spams the DevTools console on every pageview.
- **Auto-Apply** – Activates instantly when you open LinkedIn messaging. No extra clicks needed.
- **SPA-Resilient** – A `MutationObserver` watches for LinkedIn's React re-renders and reapplies layout styles automatically.
- **Master Toggle** – Toolbar popup with a clean ON/OFF switch lets you pause the extension anytime.

---

## Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome/Brave and navigate to `chrome://extensions` (or `brave://extensions`)
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `linkedspace/` folder
5. Navigate to [linkedin.com/messaging](https://www.linkedin.com/messaging/) and enjoy!

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
