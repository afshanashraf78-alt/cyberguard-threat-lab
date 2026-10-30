# CyberGuard — Threat Lab

A separate CyberGuard learning-site copy. It does not edit the original public CyberGuard page and does not scan real systems. The site uses browser-only mock scenarios; its assessment and contact forms are demos and do not transmit form data.

## Run locally

This site has no third-party package dependencies. With Node.js installed, run:

```sh
node server.mjs
```

Then open `http://localhost:3000`.

## Project map

- `index.html` contains the accessible single-page site structure.
- `styles.css` contains the responsive visual system and reduced-motion rules.
- `src/app.js` contains the library filters, simulations, self-check, and demo intake interactions.
- `src/data.js` contains 32 historical fact records.
- `public/manus-routes.json` declares the page route for Manus preview tooling.
- `server.mjs` serves the site locally without a framework or dependency install.


## GitHub Pages

The site uses relative asset paths, so it works from a repository subpath. To publish it from GitHub Pages, use the public repository's `main` branch and `/` as the Pages source. The site and repository are publicly visible when the repository is public. The forms and cybersecurity simulations remain local educational demos; they do not run scans or submit data.
