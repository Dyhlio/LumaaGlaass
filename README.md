<div align="center">

# LumaaGlaass for Jellyfin

A modern glass-inspired theme for Jellyfin, featuring a responsive interface,
refined styling, and dynamic backgrounds.

[Features](#features) · [Installation](#installation) · [Compatibility](#compatibility) · [Customization](docs/customization.md)

</div>

## Features

- **Glass interface** - Smoked-glass panels, rounded controls, and subtle hover effects.
- **Responsive layouts** - Readable titles, balanced spacing, and neatly arranged mobile actions.
- **Home banner** - Rotating artwork, touch gestures, and playback shortcuts.
- **Dynamic backgrounds** - Collection artwork and a search background that retains the last home image.
- **Focused search** - A simplified search page without visible suggestions.
- **Refined controls** - Version, audio, and subtitle selectors with clear favorite and watched states.
- **Accessibility preferences** - Reduced-motion and reduced-transparency styles.
- **Localized labels** - Follow Jellyfin's selected language, with English as a fallback for missing translations.

## Compatibility

Designed for Jellyfin Web and **tested only on Remux**, using Jellyfin Web 10.11.11.
Other clients and versions have not been tested.

Use the **Dark** base theme and a modern browser.

## Installation

No download or installer is required. Back up your existing Custom CSS and
Custom JS before replacing the theme.

### Remux

**1. Apply the stylesheet**

Open **Remux → Branding → Custom CSS** and replace your previous theme with:

```css
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/branding.css');
```

Keep the import at the top, before any personal CSS overrides. Do not combine
it with another theme or a second copy of this stylesheet.

Alternatively, open [branding.css](assets/branding.css), copy the full file,
and paste it into **Custom CSS** instead of using the import.

**2. Add the JavaScript**

Paste this loader into **Custom JS**, without `<script>` tags. Replace the previous
LumaaGlaass script or loader, and preserve unrelated scripts:

```js
(() => {
  const id = 'lumaaglaass-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/branding.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass could not be loaded.');
  };

  document.head.appendChild(script);
})();
```

Alternatively, open [branding.js](assets/branding.js), copy the full file, and paste
it into **Custom JS** instead of the loader. Use only one method, not both.
The CSS import does not load JavaScript; both installation steps are required.

**3. Save and reload**

Save both fields, select Jellyfin's **Dark** base theme, and fully reload the
client. On desktop, use **Ctrl+F5** if the previous styling remains.

Once the theme is installed, see the [customization guide](docs/customization.md)
to enable optional features or adjust its appearance. It includes copy-and-paste
instructions and explains which options can be combined. All customizations are optional.

### Updating or removing

The CDN URLs follow `main`, so you do not need to paste the full files again when
the theme changes. Fully reload the client to load updates. CDN caching can delay
updates and the two files may not refresh at exactly the same time.

For a stable installation, replace `main` in **both URLs** with the same published
commit SHA or release tag. Do not use a tag before it exists in the repository.

If you installed by copying the full files, replace both together when updating.
Do not keep an older theme script alongside the new one, even if its markers differ.

To remove LumaaGlaass, restore your backed-up CSS and JavaScript configuration.
No installer or build step is needed.

## Repository

```text
LumaaGlaass/
├── assets/
│   ├── branding.css
│   ├── branding.js
│   └── extensions/
│       ├── collection-filter.js
│       ├── hide-count-indicators.css
│       ├── media-actions.js
│       ├── player-version-switcher.js
│       └── source-selection.js
├── docs/
│   └── customization.md
├── LICENSE
└── README.md
```

The main theme files live in `assets/`; optional features live in
`assets/extensions/`. All files are used directly; no compilation is needed. jsDelivr
serves them from the public GitHub repository without GitHub Pages or Actions.
The CDN import becomes available once `assets/branding.css` is published on `main`.

## Notes

- Search reuses the last home background during the current session. Opening
  search directly or reloading it uses a neutral background until home is visited.
- Artwork comes from your Jellyfin server. No external font loader or analytics is bundled.
- Interface labels follow Jellyfin's selected language using its native translations,
  with English only as a fallback when a translation is unavailable.

## License

LumaaGlaass is a fork of [Abyss](https://github.com/AumGupta/abyss-jellyfin),
originally created by Om Gupta (AumGupta).

Released under the [MIT License](LICENSE). Keep the original copyright and
license notices when redistributing the theme.
