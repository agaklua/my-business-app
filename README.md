# The Amani House

A responsive hotel website made with HTML, CSS, and browser JavaScript. The small Node.js server serves the static files for local development. Vercel serves the same files directly.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm start` runs the same server. There are no third-party npm dependencies.

## Deploy to Vercel

Import this project in Vercel and select **Other** as the framework preset. Leave the build command and output directory empty; Vercel serves `index.html`, `styles.css`, and `script.js` as static files. `vercel.json` configures clean URLs.

## Before publishing

The name, room rates, email, phone and WhatsApp number, and map location are illustrative sample details. Update them in `index.html` for the real property. The enquiry form opens a prefilled email in the guest's email application; it does not submit to a booking backend.
