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

function deliveryTokenValid(order, token) {
  if (!token || !order?.deliveryToken || token !== order.deliveryToken) return false;
  const expiresAt = order.deliveryTokenExpiresAt?.toDate?.();
  return Boolean(expiresAt) && expiresAt > new Date();
}

async function deliverMeta(orderId, token) {
  if (!orderId || !token) return null;
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) return null;
  const order = orderSnap.data();
  if (!deliveryTokenValid(order, token)) return null;
  const storeSnap = await db.collection("stores").doc(order.ownerId).get();
  const storeData = storeSnap.exists ? storeSnap.data() : {};
  const storeName = cleanText(storeData.name, 120) || "متجر رقمي";
  const productName = cleanText(order.productName, 160) || "منتجك";
  return {
    title: `${storeName} — استلم طلبك`,
    description: `اضغط الرابط عشان تستلم "${productName}" من ${storeName}.`,
    image: cleanText(storeData.logoUrl, 500) || DEFAULT_IMAGE,
  };
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }
  res.setHeader("Cache-Control", "public, max-age=300");
  const type = cleanText(req.query?.type, 20);
  let appPath = "/#";
  let meta = null;

  try {
    if (type === "deliver") {
      const orderId = cleanText(req.query?.orderId, 160);
      const token = cleanText(req.query?.token, 80);
      appPath = `/#deliver/${encodeURIComponent(orderId)}/${encodeURIComponent(token)}`;
      meta = await deliverMeta(orderId, token);
    } else if (type === "store") {
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
