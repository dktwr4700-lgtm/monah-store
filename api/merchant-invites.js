import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { createHash, randomBytes } from "node:crypto";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const ADMIN_EMAIL = "k1997551@gmail.com";
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}
const STORE_TYPES = new Set(["books", "videos", "codes", "files"]);

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanEmail(value) {
  return cleanText(value, 160).toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function inviteToken() {
  return randomBytes(32).toString("base64url");
}

function asDate(value) {
  return value?.toDate ? value.toDate() : null;
}

function isExpired(invite) {
  const expiresAt = asDate(invite?.expiresAt);
  return !expiresAt || expiresAt.getTime() <= Date.now();
}

function maskEmail(email) {
  const [name = "", domain = ""] = String(email || "").split("@");
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(2, name.length - visible.length))}${domain ? `@${domain}` : ""}`;
}

async function verifiedAccount(idToken) {
  if (!idToken) return null;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const account = (await response.json())?.users?.[0];
  return account?.localId && account?.email ? { uid: account.localId, email: cleanEmail(account.email) } : null;
}

async function requireOwner(req, res) {
  const header = String(req.headers.authorization || "");
  const account = await verifiedAccount(header.startsWith("Bearer ") ? header.slice(7) : "");
  if (!account || account.email !== ADMIN_EMAIL) {
    res.status(403).json({ error: "هذه العملية خاصة بمالك مُونَة." });
    return null;
  }
  return account;
}

async function findInvite(token) {
  const normalizedToken = cleanText(token, 180);
  if (normalizedToken.length < 40) return null;
  const snapshot = await db.collection("merchantInvites").where("tokenHash", "==", tokenHash(normalizedToken)).limit(1).get();
  if (snapshot.empty) return null;
  const document = snapshot.docs[0];
  return { id: document.id, ref: document.ref, ...document.data() };
}

function publicInvite(invite) {
  if (!invite || invite.status !== "pending" || isExpired(invite)) return null;
  return {
    storeName: invite.storeName,
    storeType: invite.storeType,
    email: invite.email,
    emailHint: maskEmail(invite.email),
    expiresAt: asDate(invite.expiresAt)?.toISOString() || null,
  };
}

function ownerInvite(invite) {
  const status = invite.status === "pending" && isExpired(invite) ? "expired" : invite.status;
  return {
    id: invite.id,
    storeName: invite.storeName,
    email: invite.email,
    storeType: invite.storeType,
    status,
    createdAt: asDate(invite.createdAt)?.toISOString() || null,
    expiresAt: asDate(invite.expiresAt)?.toISOString() || null,
    acceptedAt: asDate(invite.acceptedAt)?.toISOString() || null,
  };
}

async function inspectInvite(req, res) {
  const invite = await findInvite(req.body?.token);
  const data = publicInvite(invite);
  if (!data) return res.status(404).json({ error: "هذا الرابط غير صالح أو انتهت صلاحيته." });
  return res.status(200).json({ invite: data });
}

async function createInvite(req, res) {
  const owner = await requireOwner(req, res);
  if (!owner) return;

  const email = cleanEmail(req.body?.email);
  const storeName = cleanText(req.body?.storeName, 80);
  const storeType = STORE_TYPES.has(req.body?.storeType) ? req.body.storeType : "files";
  if (!validEmail(email)) return res.status(400).json({ error: "اكتب بريد التاجر بشكل صحيح." });
  if (storeName.length < 2) return res.status(400).json({ error: "اكتب اسم المتجر." });
  const existingSeller = await db.collection("sellers").where("email", "==", email).limit(1).get();
  if (!existingSeller.empty) return res.status(409).json({ error: "هذا البريد لديه متجر مفعّل بالفعل." });

  const token = inviteToken();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + INVITE_TTL_MS));
  await db.collection("merchantInvites").add({
    email,
    storeName,
    storeType,
    status: "pending",
    tokenHash: tokenHash(token),
    createdBy: owner.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });
  return res.status(201).json({ token, expiresAt: expiresAt.toDate().toISOString() });
}

async function activateInvite(req, res) {
  const header = String(req.headers.authorization || "");
  const account = await verifiedAccount(header.startsWith("Bearer ") ? header.slice(7) : "");
  if (!account) return res.status(401).json({ error: "سجّل دخولك بحساب الدعوة ثم حاول مرة ثانية." });

  const invite = await findInvite(req.body?.token);
  if (!invite) return res.status(404).json({ error: "هذا الرابط غير صالح أو انتهت صلاحيته." });
  const sellerRef = db.collection("sellers").doc(account.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const inviteSnapshot = await transaction.get(invite.ref);
      const sellerSnapshot = await transaction.get(sellerRef);
      if (!inviteSnapshot.exists) throw new Error("invalid_invite");
      const currentInvite = inviteSnapshot.data();
      if (currentInvite.status !== "pending" || isExpired(currentInvite)) throw new Error("invalid_invite");
      if (cleanEmail(currentInvite.email) !== account.email) throw new Error("wrong_email");
      if (sellerSnapshot.exists) throw new Error("seller_exists");

      transaction.set(sellerRef, {
        storeName: currentInvite.storeName,
        email: account.email,
        storeType: currentInvite.storeType,
        inviteId: invite.ref.id,
        createdAt: FieldValue.serverTimestamp(),
        plan: "basic",
        subscriptionExpiresAt: isoDate(new Date(Date.now() + SUBSCRIPTION_PERIOD_MS)),
      });
      transaction.update(invite.ref, {
        status: "accepted",
        acceptedBy: account.uid,
        acceptedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error?.message === "wrong_email") return res.status(403).json({ error: "سجّل الدخول بالبريد الذي وصلت له الدعوة." });
    if (error?.message === "seller_exists") return res.status(409).json({ error: "هذا الحساب لديه متجر مفعّل بالفعل." });
    return res.status(409).json({ error: "هذه الدعوة غير متاحة الآن. اطلب رابط دعوة جديد." });
  }
  return res.status(200).json({ ok: true });
}

async function listInvites(req, res) {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const snapshot = await db.collection("merchantInvites").orderBy("createdAt", "desc").limit(100).get();
  return res.status(200).json({ invites: snapshot.docs.map((document) => ownerInvite({ id: document.id, ...document.data() })) });
}

async function revokeInvite(req, res) {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const inviteId = cleanText(req.body?.inviteId, 120);
  if (!inviteId) return res.status(400).json({ error: "رابط الدعوة غير محدد." });
  const ref = db.collection("merchantInvites").doc(inviteId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return res.status(404).json({ error: "لم نجد هذه الدعوة." });
  if (snapshot.data().status !== "pending") return res.status(409).json({ error: "هذه الدعوة لم تعد معلقة." });
  await ref.update({ status: "revoked", revokedAt: FieldValue.serverTimestamp(), revokedBy: owner.uid });
  return res.status(200).json({ ok: true });
}

async function deleteInvite(req, res) {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const inviteId = cleanText(req.body?.inviteId, 120);
  if (!inviteId) return res.status(400).json({ error: "رابط الدعوة غير محدد." });
  const ref = db.collection("merchantInvites").doc(inviteId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return res.status(404).json({ error: "لم نجد هذه الدعوة." });
  await ref.delete();
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة غير مدعومة." });
  }
  try {
    const action = cleanText(req.body?.action, 24);
    if (action === "inspect") return await inspectInvite(req, res);
    if (action === "create") return await createInvite(req, res);
    if (action === "activate") return await activateInvite(req, res);
    if (action === "list") return await listInvites(req, res);
    if (action === "revoke") return await revokeInvite(req, res);
    if (action === "delete") return await deleteInvite(req, res);
    return res.status(400).json({ error: "طلب الدعوة غير واضح." });
  } catch (error) {
    console.error("merchant invite endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ الدعوة الآن. حاول مرة ثانية." });
  }
}
