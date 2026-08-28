import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
const VERCEL_PROJECT = "monah-store";
const VERCEL_TEAM_ID = "team_g0bt8oFitWZaOHUNKYU55w49";
const RESERVED_DOMAINS = new Set(["monah-app.com", "www.monah-app.com"]);

function cleanDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function isValidDomain(domain) {
  return domain.length <= 253
    && /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(domain)
    && !RESERVED_DOMAINS.has(domain)
    && !domain.endsWith(".vercel.app");
}

function safeVerification(records) {
  if (!Array.isArray(records)) return [];
  return records.slice(0, 3).map((record) => ({
    type: String(record?.type || "TXT").slice(0, 20),
    domain: String(record?.domain || "").slice(0, 280),
    value: String(record?.value || "").slice(0, 1200),
    reason: String(record?.reason || "").slice(0, 240),
  })).filter((record) => record.domain && record.value);
}

async function verifyMerchantToken(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const account = data?.users?.[0];
  return account?.localId && account?.email ? account : null;
}

async function vercelRequest(path, options = {}) {
  return fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function readProjectDomain(domain) {
  const response = await vercelRequest(`/v9/projects/${VERCEL_PROJECT}/domains/${encodeURIComponent(domain)}?teamId=${VERCEL_TEAM_ID}`);
  if (!response.ok) return null;
  return response.json();
}

async function saveDomainState(uid, domain, responseData) {
  const verified = responseData?.verified === true;
  const verification = safeVerification(responseData?.verification);
  const patch = {
    customDomainRequested: domain,
    customDomainStatus: verified ? "connected" : "needs_dns",
    customDomainVerification: verification,
    customDomainCheckedAt: new Date().toISOString(),
    customDomainVerified: verified ? domain : FieldValue.delete(),
  };
  if (verified) patch.customDomainVerifiedAt = new Date().toISOString();
  await db.collection("stores").doc(uid).set(patch, { merge: true });
  return { domain, status: patch.customDomainStatus, verification };
}

async function ensureDomainIsAvailable(uid, domain) {
  const matches = await db.collection("stores").where("customDomainRequested", "==", domain).get();
  if (matches.docs.some((store) => store.id !== uid)) {
    throw Object.assign(new Error("هذا الدومين طلبه متجر آخر داخل مُونَة."), { statusCode: 409 });
  }

  const ownStore = await db.collection("stores").doc(uid).get();
  const existingDomain = cleanDomain(ownStore.data()?.customDomainRequested);
  if (existingDomain && existingDomain !== domain) {
    throw Object.assign(new Error("لديك دومين سابق قيد الربط. أكمل ربطه أو تواصل مع مُونَة لتغييره بأمان."), { statusCode: 409 });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة غير مدعومة." });
  }

  const idToken = String(req.headers.authorization || "").startsWith("Bearer ")
    ? String(req.headers.authorization).slice(7)
    : "";
  if (!idToken) return res.status(401).json({ error: "سجّل دخولك ثم حاول مرة ثانية." });

  let uid;
  try {
    uid = (await verifyMerchantToken(idToken))?.localId;
    if (!uid) throw new Error("invalid token");
  } catch {
    return res.status(401).json({ error: "جلسة الدخول غير صالحة. سجّل دخولك ثم حاول مرة ثانية." });
  }

  const domain = cleanDomain(req.body?.domain);
  const action = req.body?.action === "refresh" ? "refresh" : "start";
  if (!isValidDomain(domain)) {
    return res.status(400).json({ error: "اكتب اسم دومين صحيح مثل: my-store.com" });
  }
  if (!process.env.VERCEL_TOKEN) {
    return res.status(503).json({ error: "ربط الدومين يحتاج تفعيلًا من صاحب منصة مُونَة أولًا." });
  }

  try {
    await ensureDomainIsAvailable(uid, domain);
    let projectDomain = null;
    if (action === "start") {
      const createResponse = await vercelRequest(`/v10/projects/${VERCEL_PROJECT}/domains?teamId=${VERCEL_TEAM_ID}`, {
        method: "POST",
        body: JSON.stringify({ name: domain }),
      });
      if (createResponse.ok) {
        projectDomain = await createResponse.json();
      } else {
        projectDomain = await readProjectDomain(domain);
      }
    } else {
      const verifyResponse = await vercelRequest(`/v9/projects/${VERCEL_PROJECT}/domains/${encodeURIComponent(domain)}/verify?teamId=${VERCEL_TEAM_ID}`, { method: "POST" });
      projectDomain = verifyResponse.ok ? await verifyResponse.json() : await readProjectDomain(domain);
    }

    if (!Array.isArray(projectDomain?.verification)) {
      projectDomain = await readProjectDomain(domain) || projectDomain;
    }

    if (!projectDomain) {
      return res.status(502).json({ error: "تعذر تجهيز ربط هذا الدومين الآن. تأكد أنه ليس مربوطًا بمشروع آخر." });
    }

    const state = await saveDomainState(uid, domain, projectDomain);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(state);
  } catch (error) {
    console.error("custom domain endpoint error:", error?.message || "unknown");
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return res.status(500).json({ error: "تعذر فحص الدومين الآن. حاول بعد قليل." });
  }
}
