# HAGAKON HOTELL

Responsive hotel website built with HTML, CSS, and JavaScript. A small Node.js server supports local development; Vercel deploys the static site from the connected GitHub repository.

## Run locally

From the main project folder:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Alternatively, from this `outputs` folder, run the same commands to use the copy here.

## Current content notes

The map points to Mombasa at city level because no street address or pin was provided. The photos and room names/details are illustrative; rates are on request. Replace these with confirmed property details and real photos.

The booking form saves enquiries to Supabase. The private admin dashboard is available at `/admin`; add the hotel owner's account in Supabase Authentication before signing in. See `ADMIN-SETUP.md` for details. The room names and photos are still illustrative until replaced with confirmed property details and real photos.
