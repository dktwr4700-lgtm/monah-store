import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const DEFAULT_TITLE = "مُونَة — أنشئ متجرك الرقمي";
const DEFAULT_DESCRIPTION = "أنشئ متجرك الرقمي وشارك رابط منتجك مباشرة.";
const DEFAULT_IMAGE = "/og-image.png";
const CRAWLER_PATTERN = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|redditbot|googlebot|bingbot|vkshare|skypeuripreview|embedly|quora link preview|w3c_validator|bot|crawler|spider/i;

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isCrawler(userAgent) {
  return CRAWLER_PATTERN.test(String(userAgent || ""));
}

async function storeMeta(sellerId) {
  if (!sellerId) return null;
  let storeData = null;
  const directSnap = await db.collection("stores").doc(sellerId).get();
  if (directSnap.exists) {
    storeData = directSnap.data();
  } else {
    const slugSnap = await db.collection("stores").where("slug", "==", sellerId).limit(1).get();
    if (!slugSnap.empty) storeData = slugSnap.docs[0].data();
  }
  if (!storeData) return null;
  const storeName = cleanText(storeData.name, 120) || "متجر رقمي";
  const tagline = cleanText(storeData.tagline, 200) || "تسوق منتجات رقمية أصلية على مُونَة.";
  return {
    title: `${storeName} — متجر على مُونَة`,
    description: tagline,
    image: cleanText(storeData.logoUrl, 500) || DEFAULT_IMAGE,
  };
}

function renderHtml(meta, canonicalUrl) {
  const title = escapeHtml(meta?.title || DEFAULT_TITLE);
  const description = escapeHtml(meta?.description || DEFAULT_DESCRIPTION);
  const image = escapeHtml(meta?.image || DEFAULT_IMAGE);
  return `<!doctype html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
</head><body></body></html>`;
}

// بيانات المتجر أو المنتج كاملة بطلب واحد للصفحات العامة. السيرفر يقراها بسرعة
// وتنحفظ في سيرفرات Vercel القريبة من الزبون، فالمتجر يفتح بدون ما المتصفح يتصل بقاعدة البيانات.
// (نفس الدالة عشان ما نتعدى حد عدد الدوال في Vercel)
const PUBLIC_PRODUCT_FIELDS = ["ownerId", "name", "price", "description", "category", "type", "codesCount", "images", "previewVideoUrl", "featured", "sortOrder", "requiresActivation", "options", "askBuyer"];

function publicProduct(id, data) {
  const out = { id, hidden: false, suspended: false };
  for (const key of PUBLIC_PRODUCT_FIELDS) if (data[key] !== undefined) out[key] = data[key];
  return out;
}

function publicStore(data) {
  const { updatedAt, ...rest } = data || {};
  return rest;
}

async function findStore(sellerId) {
  const [directSnap, slugSnap] = await Promise.all([
    db.collection("stores").doc(sellerId).get(),
    db.collection("stores").where("slug", "==", sellerId).limit(1).get(),
  ]);
  if (directSnap.exists) return { ownerId: directSnap.id, store: directSnap.data() };
  if (!slugSnap.empty) return { ownerId: slugSnap.docs[0].id, store: slugSnap.docs[0].data() };
  return null;
}

async function storeProducts(ownerId) {
  const snap = await db.collection("products").where("ownerId", "==", ownerId).where("hidden", "==", false).where("suspended", "==", false).get();
  const list = snap.docs.map((d) => publicProduct(d.id, d.data()));
  list.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0));
  return list;
}

async function publicData(req, res) {
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=600");
  const sellerId = cleanText(req.query?.sellerId, 160);
  const productId = cleanText(req.query?.productId, 160);
  if (/^[A-Za-z0-9_-]{1,160}$/.test(productId)) {
    const snap = await db.collection("products").doc(productId).get();
    if (!snap.exists) return res.status(404).json({ status: "missing" });
    const product = snap.data();
    if (product.hidden || product.suspended) return res.status(200).json({ status: "unavailable" });
    const [storeSnap, products] = await Promise.all([db.collection("stores").doc(product.ownerId).get(), storeProducts(product.ownerId)]);
    return res.status(200).json({ status: "ready", ownerId: product.ownerId, store: storeSnap.exists ? publicStore(storeSnap.data()) : null, product: publicProduct(snap.id, product), products });
  }
  if (/^[A-Za-z0-9_-]{1,160}$/.test(sellerId)) {
    const found = await findStore(sellerId);
    if (!found) return res.status(404).json({ status: "missing" });
    const products = await storeProducts(found.ownerId);
    return res.status(200).json({ status: "ready", ownerId: found.ownerId, store: publicStore(found.store), products });
  }
  return res.status(400).json({ status: "missing" });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }
  const type = cleanText(req.query?.type, 20);
  if (type === "data") {
    try {
      return await publicData(req, res);
    } catch (error) {
      console.error("public data error:", error?.message || "unknown");
      res.setHeader("Cache-Control", "no-store");
      return res.status(500).json({ status: "error" });
    }
  }
  res.setHeader("Cache-Control", "public, max-age=300");
  let appPath = "/#";
  let meta = null;

  try {
    if (type === "store") {
      const sellerId = cleanText(req.query?.sellerId, 160);
      appPath = `/#store/${encodeURIComponent(sellerId)}`;
      meta = await storeMeta(sellerId);
    }
  } catch (error) {
    console.error("link-preview error:", error?.message || "unknown");
  }

  if (!isCrawler(req.headers["user-agent"])) {
    return res.redirect(302, appPath);
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const appUrl = `https://${req.headers.host || "monah-app.com"}${appPath}`;
  return res.status(200).send(renderHtml(meta, appUrl));
}
