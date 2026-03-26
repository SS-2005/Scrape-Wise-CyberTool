# Netlify deployment steps

## 1) Local run

```bash
npm install
cd netlify/functions
npm install
cd ../..
npm install -g netlify-cli
netlify login
netlify dev
```

Open: `http://localhost:8888`

## 2) Deploy with drag-and-drop zip

This project uses Netlify Functions, so **do not** drag only the `dist` folder unless you already built it correctly with functions included.

Best path:

1. Extract this zip on your machine.
2. Open terminal in the project root.
3. Run:

```bash
npm install
cd netlify/functions
npm install
cd ../..
npm run build
```

4. Push this project to GitHub.
5. In Netlify:
   - Add new site
   - Import an existing project
   - Pick your GitHub repo
6. Netlify should read `netlify.toml` automatically.
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
7. Click **Deploy site**.

## 3) Deploy with Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy
netlify deploy --prod
```

## 4) Why the URL field was not clickable

The search box had an overlay pseudo-element sitting above the input area. Human UI bugs, the eternal hobby. The fix in this zip does three things:

- disables pointer events on the overlay
- makes the whole search box focus the input
- validates and normalizes typed URLs so users can enter `example.com` or full `https://example.com`

## 5) Drop-in replacement files

If you only want to replace files in your existing project, use:

- `src/App.jsx`
- `src/App.css`

Everything else stays the same.
