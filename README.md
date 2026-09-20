<div align="center">

# LumaaGlaass for Jellyfin

A modern glass-inspired theme for Jellyfin, featuring a responsive interface,
refined styling, and dynamic backgrounds.

[Features](#features) · [Installation](#installation) · [Compatibility](#compatibility)

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

## Customization

### Source selection panel

The optional source panel replaces the Version dropdown with a scrollable list
on media details pages that offer multiple versions. It requires the main theme.

- Select a source, then use **Play** to start playback. Selecting a source does not autoplay.
- Uses the native version selector and its labels. Audio, video, and subtitle controls remain native.
- On desktop, the panel appears on the right and ends no lower than the Studio row
  when available, otherwise the remaining metadata. Up to six sources are visible;
  longer lists scroll within the panel.
- On mobile and tablet, it appears above the audio/video controls with a compact scroll area.
- A bottom chevron indicates that more sources are available below.

Add this separate loader to **Custom JS**, keeping the main theme loader:

```js
(() => {
  const id = 'lumaaglaass-source-panel-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/source-panel.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass source panel could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [source-panel.js](assets/source-panel.js) after the main theme
script. Use only one method and remove any previously pasted source panel prototype.
The extension includes its own styles; no additional CSS import is needed.

Save and fully reload. To disable it, remove only its loader or pasted script and
reload. The main theme files remain unchanged. Available on `main`, not in v1.0.0.

### Filter mixed collections

The optional collection filter adds **All / Movies / Shows** above collections
containing both movies and series. It uses Jellyfin's internal media types,
not translated titles, and follows the language selected in Jellyfin.

Add this separate loader to **Custom JS**, keeping the main theme loader:

```js
(() => {
  const id = 'lumaaglaass-collection-filter-script';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.src = 'https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/collection-filter.js';
  script.onerror = () => {
    script.remove();
    console.error('LumaaGlaass collection filter could not be loaded.');
  };
  document.head.appendChild(script);
})();
```

Alternatively, paste [collection-filter.js](assets/collection-filter.js) after
the main theme script. Use only one method. The extension includes its own styles;
the main CSS and JavaScript do not need to be replaced.

- Filters the native cards and section headings without changing their order.
- Does not alter collection membership, watch history, or the main Play/Shuffle actions.
- Shows other media types under **All** only.
- Resets to **All** when switching collections; single-type collections have no filter.
- Supports keyboard navigation, right-to-left layouts, and pointer feedback.
- Uses the client translator when exposed, otherwise bundled native Jellyfin strings.
  Missing translations fall back to English. No translation service or extra library query is used.

Save and fully reload. To disable it, remove its loader or pasted script and
reload again. This extension is available on `main`, not in the v1.0.0 release.

### Hide count indicators

This optional stylesheet hides Jellyfin's numeric count badges. They remain
visible unless you enable it.

**Hidden:** unplayed/unwatched item counts, including episodes on series and season
cards; item-count badges on container cards; and their `99+` variants.

**Unchanged:** watched checkmarks, favorites, playback progress, ratings, years,
media-source indicators, and counts written as ordinary text.

To enable it, use these two lines at the top of **Custom CSS**:

```css
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/branding.css');
@import url('https://cdn.jsdelivr.net/gh/Dyhlio/LumaaGlaass@main/assets/hide-count-indicators.css');
```

If the theme import is already present, add only the second line, before any
other CSS rules. No JavaScript change is needed.

Alternatively, copy [hide-count-indicators.css](assets/hide-count-indicators.css)
after your existing CSS. Its complete rule is:

```css
.countIndicator {
  display: none !important;
}
```

Save and fully reload the client. To restore the badges, remove the optional
import or pasted rule and reload again. If you added both, remove both.

Only elements using Jellyfin's `countIndicator` class are hidden. This is a visual
change: no counts or watch history are deleted. The rule also works with the
v1.0.0 base theme; the optional file is available on `main`, not in older release tags.

## Repository

```text
LumaaGlaass/
├── assets/
│   ├── branding.css
│   ├── branding.js
│   ├── collection-filter.js
│   ├── hide-count-indicators.css
│   └── source-panel.js
├── LICENSE
└── README.md
```

The files in `assets/` are used directly; no compilation is needed. jsDelivr
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
