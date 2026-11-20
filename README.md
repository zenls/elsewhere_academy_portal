# Elsewhere Academy — prototype handoff

This is the editable source for the Elsewhere Academy clickable web prototype, exported from the published version as of 20 November 2026. It is a static HTML, CSS and JavaScript site, not a Figma file. No build or package installation is required to run it locally.

Live reference: https://elsewhere-academy-discover-aina.noblerice18.chatgpt.site/#/home

## Run locally

1. Unzip the archive and open a terminal in the `elsewhere-academy` folder.
2. Start a local server using Python 3:

   ```sh
   python3 -m http.server 8000 --directory dist
   ```

3. Open http://localhost:8000/ in a browser. Use Ctrl+C in the terminal to stop the server.

Any static web server or editor's live-server extension can be used instead. Navigation uses URL hashes (for example `/#/discover`).

## Project files

- `dist/index.html` — page shell, navigation and script references.
- `dist/app.js` — screen templates, navigation and interaction logic.
- `dist/booking.js` — demo availability, price calculation, checkout and trip list.
- `dist/data.js` — experience listings, host names, descriptions, prices and associated images.
- `dist/app.css` — the site's styles and responsive layouts.
- `dist/assets/` — included photos and other visual assets.
- `dist/credits.html` — existing photo attribution and source references. Review individual image licenses and permissions before further publication or commercial use. Some site imagery and maps may still use external URLs and require internet access.

## Prototype behaviour and next steps

This is a front-end prototype. Hosts, listings, reviews, availability, verification and prices are sample content. In Discover, open an experience and choose **Book instantly** to see the short checkout and immediate demo confirmation. **Request to book instead** leaves the trip waiting for a response; use Host view to simulate accepting or declining it. **Your trips** lists the saved demo bookings and lets you cancel them or withdraw pending requests. Confirmed bookings use places in the demo calendar; cancellation releases them.

No real booking, notification, payment or refund takes place. Trip data is saved in the visitor's browser using local storage, not in a shared account or database.

A developer can edit the files directly and deploy the contents of `dist/` to a static hosting provider. A production service would require additional work on accounts, a database, booking and payment integrations, host verification, accessibility, security, and real content.

This export contains the site files and photo credits, but not the owner's account credentials, hosting configuration or Git history. Access to the current hosted site's management or publishing is separate from possession of this archive and requires the owner's authorization. The live site is not changed by editing this copy.
