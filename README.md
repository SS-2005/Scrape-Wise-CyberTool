# ScrapeWise v2.0 — Ultimate Web Scraper

A modern, full-stack web application that extracts contact information (emails, phones, social links) from any public website and performs scam risk analysis. Built for Netlify deployment with serverless functions.


## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Install function dependencies
cd netlify/functions && npm install && cd ../..

# Install Netlify CLI
npm install -g netlify-cli

# Run locally (includes serverless functions)
netlify dev
```

Then open http://localhost:8888

## 📁 Project Structure

```
scrapewise/
├── netlify/
│   └── functions/
│       ├── scrape.js          # Serverless scraping function
│       └── package.json       # Function dependencies
├── src/
│   ├── App.jsx                # Main React component
│   ├── App.css                # Component styles
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
└── netlify.toml               # Netlify configuration
```

## ✨ Features

- **Contact Extraction**: Emails, phone numbers, LinkedIn, Twitter, Facebook, Instagram, YouTube, GitHub
- **Confidence Scoring**: Each contact gets a % confidence score
- **Scam Detection**: Multi-factor analysis with risk levels (MINIMAL / LOW / MEDIUM / HIGH)
- **CSV Export**: Download all results as a formatted CSV
- **Copy to Clipboard**: One-click copy for any contact
- **Dark Theme**: Modern animated dark UI with particle effects
- **Responsive**: Works on mobile, tablet, desktop

## 🔧 Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Netlify Functions (Node.js serverless)
- **Scraping**: node-fetch + cheerio
- **Styling**: Pure CSS with animations

## 👨‍💻 Author

Developed by Sahil Shaikh  
[Portfolio](https://ss2005-portfolio.netlify.app/projects/scrapewise)
