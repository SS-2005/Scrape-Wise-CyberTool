import * as cheerio from "cheerio";

// =====================
// CONFIGURATION
// =====================
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function getRandomAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// =====================
// EXTRACTION FUNCTIONS
// =====================
function extractEmails(text) {
  const pattern = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
  const found = text.match(pattern) || [];
  // Filter obvious false positives
  return [...new Set(found)].filter(
    (e) =>
      !e.includes("example.com") &&
      !e.includes("youremail") &&
      !e.includes("test@") &&
      e.length < 80
  );
}

function extractPhones(text) {
  // Multiple phone patterns for international support
  const patterns = [
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US/CA
    /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, // International
    /\b\d{10}\b/g, // 10-digit plain
  ];
  const found = new Set();
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => {
      const cleaned = m.replace(/\s+/g, " ").trim();
      if (cleaned.replace(/\D/g, "").length >= 7) {
        found.add(cleaned);
      }
    });
  }
  return [...found].slice(0, 10);
}

function extractSocialLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const social = {
    linkedin: new Set(),
    twitter: new Set(),
    facebook: new Set(),
    instagram: new Set(),
    youtube: new Set(),
    github: new Set(),
  };

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const lower = href.toLowerCase();

    if (lower.includes("linkedin.com")) {
      social.linkedin.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
      social.twitter.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    } else if (lower.includes("facebook.com")) {
      social.facebook.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    } else if (lower.includes("instagram.com")) {
      social.instagram.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    } else if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      social.youtube.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    } else if (lower.includes("github.com")) {
      social.github.add(
        href.startsWith("http") ? href : new URL(href, baseUrl).href
      );
    }
  });

  // Convert sets to arrays
  const result = {};
  for (const key of Object.keys(social)) {
    const arr = [...social[key]].slice(0, 3);
    if (arr.length > 0) result[key] = arr;
  }
  return result;
}

// =====================
// CONFIDENCE SCORING
// =====================
function emailConfidence(email) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (domain.endsWith(".edu") || domain.endsWith(".gov")) return 82;
  if (["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain))
    return 62;
  if (domain.includes(".")) return 74;
  return 50;
}

function phoneConfidence(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return 78;
  if (digits.length === 10) return 75;
  if (digits.length >= 8 && digits.length <= 15) return 65;
  return 45;
}

function socialConfidence(platform, url) {
  const scores = {
    linkedin: 85,
    github: 82,
    twitter: 65,
    facebook: 60,
    instagram: 58,
    youtube: 55,
  };
  return scores[platform] || 50;
}

// =====================
// SCAM DETECTION
// =====================
function analyzeScamIndicators(url, html, title) {
  const domain = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  const indicators = [];
  let score = 0;

  // HTTPS check
  if (!url.startsWith("https://")) {
    score += 15;
    indicators.push("No HTTPS encryption");
  }

  // Suspicious domain patterns
  if (/\d{5,}/.test(domain)) {
    score += 20;
    indicators.push("Domain contains suspicious number sequence");
  }
  if (domain.split(".").some((p) => p.length > 30)) {
    score += 15;
    indicators.push("Unusually long domain segment");
  }
  if ((domain.match(/-/g) || []).length > 2) {
    score += 15;
    indicators.push("Excessive hyphens in domain");
  }

  // Suspicious keywords in domain
  const suspiciousDomainWords = [
    "login",
    "secure",
    "verify",
    "account",
    "update",
    "confirm",
    "banking",
    "paypal",
    "amazon",
    "microsoft",
    "apple",
    "google",
  ];
  if (suspiciousDomainWords.some((w) => domain.includes(w))) {
    score += 20;
    indicators.push("Domain impersonates known brand/service");
  }

  if (html) {
    const text = html.toLowerCase();

    // Urgency language
    const urgencyWords = [
      "act now",
      "limited time",
      "urgent",
      "immediately",
      "expires today",
      "last chance",
      "hurry",
    ];
    const urgencyCount = urgencyWords.filter((w) => text.includes(w)).length;
    if (urgencyCount > 1) {
      score += 15;
      indicators.push("Excessive urgency language detected");
    }

    // Lottery/prize scam patterns
    const scamPhrases = [
      "congratulations, you",
      "you have won",
      "claim your prize",
      "you are selected",
      "lucky winner",
      "wire transfer",
    ];
    if (scamPhrases.some((p) => text.includes(p))) {
      score += 30;
      indicators.push("Lottery or prize scam language detected");
    }

    // No contact info is suspicious
    const hasEmail = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i.test(html);
    const hasPhone = /[\+\d][\d\s\-\(\)]{6,}[\d]/.test(html);
    if (!hasEmail && !hasPhone) {
      score += 15;
      indicators.push("No verifiable contact information found");
    }

    // Check for unrealistic promises
    const promises = [
      "100% free",
      "no risk",
      "guaranteed income",
      "make money fast",
      "work from home",
      "earn $",
      "get rich",
    ];
    if (promises.some((p) => text.includes(p))) {
      score += 20;
      indicators.push("Unrealistic financial promises");
    }
  }

  // Positives (reduce score)
  if (url.startsWith("https://")) score = Math.max(0, score - 5);

  const isScam = score >= 60;
  const riskLevel =
    score >= 75 ? "HIGH" : score >= 50 ? "MEDIUM" : score >= 25 ? "LOW" : "MINIMAL";

  return {
    isScam,
    score: Math.min(100, score),
    riskLevel,
    indicators: indicators.length > 0 ? indicators : ["No significant risk indicators found"],
    safe: score < 30,
  };
}

// =====================
// PAGE METADATA
// =====================
function extractMetadata($, url) {
  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    "/favicon.ico";
  const faviconUrl = favicon.startsWith("http")
    ? favicon
    : new URL(favicon, url).href;

  return { title, description, favicon: faviconUrl };
}

// =====================
// MAIN SCRAPE FUNCTION
// =====================
async function scrapeWebsite(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles for cleaner text
    $("script, style, noscript, iframe").remove();
    const text = $("body").text().replace(/\s+/g, " ");

    const emails = extractEmails(html); // use full html for mailto links too
    const phones = extractPhones(text);
    const social = extractSocialLinks(html, url);
    const metadata = extractMetadata($, url);
    const scamAnalysis = analyzeScamIndicators(url, text, metadata.title);

    // Build contacts array
    const contacts = [];

    for (const email of emails) {
      contacts.push({
        type: "email",
        value: email,
        confidence: emailConfidence(email),
        icon: "mail",
      });
    }

    for (const phone of phones) {
      contacts.push({
        type: "phone",
        value: phone,
        confidence: phoneConfidence(phone),
        icon: "phone",
      });
    }

    for (const [platform, urls] of Object.entries(social)) {
      for (const socialUrl of urls) {
        contacts.push({
          type: platform,
          value: socialUrl,
          confidence: socialConfidence(platform, socialUrl),
          icon: platform,
        });
      }
    }

    return {
      success: true,
      url,
      metadata,
      contacts,
      scamAnalysis,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeout);
    let errorMessage = err.message;
    if (err.name === "AbortError") {
      errorMessage = "Request timed out after 15 seconds";
    } else if (errorMessage.includes("ENOTFOUND")) {
      errorMessage = "Domain not found. Please check the URL.";
    } else if (errorMessage.includes("ECONNREFUSED")) {
      errorMessage = "Connection refused by the server.";
    }
    return { success: false, error: errorMessage, url };
  }
}

// =====================
// NETLIFY HANDLER
// =====================
export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { url } = JSON.parse(event.body || "{}");
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    const result = await scrapeWebsite(url);
    return {
      statusCode: result.success ? 200 : 500,
      headers,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error: " + err.message }),
    };
  }
};
