// أكواد اشتراك مُونة («مركز معمار»): الوكيل أو متجر معمار يبيع كود باقة لشهر، والتاجر يكتبه في لوحته ويتفعل اشتراكه.
// الأكواد في مجموعة planCodes، يكتبها ويقرأها الخادم بس (قواعد Firestore ترفض أي مجموعة ما لها قاعدة).
//
// ربط المركز (من خادم لخادم، بكلمة السر المشتركة MIMAR_HUB_SECRET في Vercel بس). يمر عبر
// /api/merchant-signup?hub=1 عشان ما نزيد عدد دوال Vercel:
// GET  ?action=catalog            → الباقات اللي تنباع كأكواد وأسعارها
// GET  ?action=overview           → الباقات + عدد المتاجر + آخر الأكواد + المتاجر اللي اشتراكها شغال
// GET  ?action=list&agent=email   → أكواد الوكيل، والمستخدم منها مع اسم المتجر وباقته وموعد انتهائها
// POST {action:"mint", agent?, agentName?, note?, item, count, unit, batch} → يطلع أكواد (نفس batch ما يطلع مرتين)
import { randomInt, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { ADD_ON_CATALOG, STARTER_MONTHLY_PRICE, BASE_MONTHLY_PRICE, PRO_MONTHLY_PRICE, productLimitForPlan } from "../src/subscriptionCatalog.js";

export const PLAN_CODE_ITEMS = {
  starter: { name: "ابدأ", price: STARTER_MONTHLY_PRICE },
  basic: { name: "الأساسي", price: BASE_MONTHLY_PRICE },
  pro: { name: "برو", price: PRO_MONTHLY_PRICE },
};
const PLAN_RANK = { starter: 1, basic: 2, pro: 3 };
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // نفس مدة الاشتراك المدفوع
const MAX_BATCH = 200;
const LATEST = 100;
const MAX_CUSTOMERS = 500;
const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

// حروف الأكواد: بدون 0/O و1/I/L عشان ما تتلخبط وقت الكتابة
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PLAN_CODE_PATTERN = /^MN-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;

// يوحّد الكود اللي يكتبه التاجر: حروف كبيرة، بدون مسافات، ويضيف الشرطات لو نساها
export function normalizePlanCode(input) {
  const raw = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("MN") ? raw.slice(2) : raw;
  if (body.length !== 8) return String(input || "").trim().toUpperCase().slice(0, 20);
  return `MN-${body.slice(0, 4)}-${body.slice(4)}`;
}

export class PlanCodeError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const isoDate = (date) => date.toISOString().slice(0, 10);
// الاشتراك شغال لين بداية يوم الانتهاء (نفس فحص api/orders.js)
const runningUntil = (seller, now) => (seller.subscriptionExpiresAt && new Date(seller.subscriptionExpiresAt) > now ? new Date(seller.subscriptionExpiresAt) : null);

// شو يصير لمتجر التاجر لو فعّل كود باقة. ما نكتب شي هنا، بس نحسب ونتحقق.
// - الشهر ينضاف على اللي باقي من اشتراكه (ما يضيع عليه شي)
// - كود باقة أعلى يرقّيه، وكود باقة أقل ما يقبل وهو اشتراكه شغال
// - الكود يغطي الباقة بس: الإضافات المدفوعة تتوقف (بعد ما يوافق)، والمجانية تبقى
export function planCodeResult(seller, codePlan, now = new Date()) {
  if (!PLAN_CODE_ITEMS[codePlan]) throw new PlanCodeError(400, "نوع الكود غير معروف.");
  const current = PLAN_RANK[seller.plan] ? seller.plan : null; // unpaid أو trial: ما عنده باقة مدفوعة
  const until = runningUntil(seller, now);
  if (current && until && PLAN_RANK[codePlan] < PLAN_RANK[current]) {
    throw new PlanCodeError(409, `هذا كود باقة «${PLAN_CODE_ITEMS[codePlan].name}» وباقتك الحالية «${PLAN_CODE_ITEMS[current].name}». استخدم كود لباقتك أو أعلى.`);
  }
  const limit = productLimitForPlan(codePlan);
  if (Number(seller.productCount || 0) > limit) {
    throw new PlanCodeError(409, `عندك ${seller.productCount} منتج، وباقة «${PLAN_CODE_ITEMS[codePlan].name}» تكفي ${limit} بس. استخدم كود باقة أعلى.`);
  }
  const base = until || now;
  const paidAddOns = (seller.activeAddOns || []).filter((key) => (ADD_ON_CATALOG.find((a) => a.key === key)?.price || 0) > 0);
  return {
    plan: codePlan,
    subscriptionExpiresAt: isoDate(new Date(base.getTime() + PERIOD_MS)),
    dropAddOns: paidAddOns,
    keepAddOns: (seller.activeAddOns || []).filter((key) => !paidAddOns.includes(key)),
  };
}

// ---------- ربط المركز ----------
export function checkHubSecret(req) {
  const want = process.env.MIMAR_HUB_SECRET || "";
  if (want.length < 16) throw new PlanCodeError(503, "ربط الوكلاء غير مفعّل.");
  const got = Buffer.from(String(req.headers?.["x-hub-secret"] || ""));
  const ok = Buffer.from(want);
  if (got.length !== ok.length || !timingSafeEqual(got, ok)) throw new PlanCodeError(401, "غير مصرّح.");
}

export const catalog = () => Object.entries(PLAN_CODE_ITEMS).map(([item, p]) => ({ item, label: `باقة ${p.name} · شهر`, price: p.price }));
const ms = (v) => (v?.toDate ? v.toDate().getTime() : typeof v === "number" ? v : typeof v === "string" && v ? Date.parse(v) : null);
const block = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
const nameOf = (s) => String(s?.storeName || "متجر").slice(0, 60);
// عن المتجر: اسمه وباقته وموعد انتهائها بس
const customerOf = (id, s) => ({ id, name: nameOf(s), plan: PLAN_CODE_ITEMS[s.plan]?.name || "", item: s.plan || "", expiresAt: ms(s.subscriptionExpiresAt) });

async function sellersById(db, ids) {
  const snaps = await Promise.all([...new Set(ids)].map((u) => db.collection("sellers").doc(u).get()));
  return new Map(snaps.filter((s) => s.exists).map((s) => [s.id, s.data()]));
}

const codeRow = (d) => {
  const c = d.data();
  return { code: d.id, item: c.plan, used: Boolean(c.used), usedAt: ms(c.usedAt), at: ms(c.createdAt), cost: c.agentPrice || 0, agent: c.agent || null, note: c.note || "", customer: c.used ? c.usedBy || null : null };
};

async function list(db, agent) {
  const snap = await db.collection("planCodes").where("agent", "==", agent).get();
  const codes = snap.docs.map(codeRow);
  const sellers = await sellersById(db, codes.filter((c) => c.customer).map((c) => c.customer));
  return {
    catalog: catalog(),
    codes: codes.map(({ agent: _a, note: _n, ...c }) => c),
    customers: [...sellers.entries()].map(([id, s]) => { const { item: _i, ...c } = customerOf(id, s); return c; }),
  };
}

async function overview(db) {
  const today = isoDate(new Date());
  const [latest, active, total] = await Promise.all([
    db.collection("planCodes").orderBy("createdAt", "desc").limit(LATEST).get(),
    db.collection("sellers").where("subscriptionExpiresAt", ">", today).get(),
    db.collection("sellers").count().get(),
  ]);
  const codes = latest.docs.map(codeRow);
  const sellers = await sellersById(db, codes.filter((c) => c.customer).map((c) => c.customer));
  const customers = active.docs
    .filter((d) => PLAN_RANK[d.data().plan])
    .map((d) => customerOf(d.id, d.data()))
    .sort((a, b) => (a.expiresAt || 0) - (b.expiresAt || 0));
  return {
    catalog: catalog(),
    stats: { active: customers.length, total: total.data().count, activeLabel: "متجر اشتراكه شغال", totalLabel: "حساب تاجر" },
    codes: codes.map((c) => ({ ...c, customer: c.customer ? nameOf(sellers.get(c.customer)) : null })),
    customers: customers.slice(0, MAX_CUSTOMERS),
  };
}

async function mint(db, body) {
  const agent = String(body?.agent || "").trim().toLowerCase();
  const note = String(body?.note || "").trim().slice(0, 80);
  const item = String(body?.item || "");
  const count = Number(body?.count);
  const batchId = String(body?.batch || "").slice(0, 60);
  if (agent && !EMAIL.test(agent)) throw new PlanCodeError(400, "إيميل الوكيل غير صحيح.");
  if (!agent && !note) throw new PlanCodeError(400, "اكتب لمين الأكواد (مثلًا: متجر معمار).");
  if (!PLAN_CODE_ITEMS[item]) throw new PlanCodeError(400, "باقة غير معروفة.");
  if (!Number.isInteger(count) || count < 1 || count > MAX_BATCH) throw new PlanCodeError(400, "عدد غير صحيح.");
  if (!batchId) throw new PlanCodeError(400, "رقم الدفعة ناقص.");
  // نفس الدفعة لو انطلبت مرة ثانية (إعادة محاولة) ترجع نفس الأكواد
  const prev = await db.collection("planCodes").where("hubBatch", "==", batchId).get();
  if (!prev.empty) return prev.docs.map((d) => d.id);
  const codes = new Set();
  while (codes.size < count) codes.add(`MN-${block()}-${block()}`);
  const batch = db.batch();
  for (const code of codes) {
    batch.create(db.collection("planCodes").doc(code), {
      plan: item,
      note: agent ? `وكيل معمار: ${String(body?.agentName || agent).slice(0, 60)}` : `مركز معمار: ${note}`,
      ...(agent ? { agent, agentPrice: Number(body?.unit) || 0 } : {}),
      hubBatch: batchId, used: false, createdBy: "mimar-hub", createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return [...codes];
}

export async function hubHandler(db, req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    checkHubSecret(req);
    const action = req.method === "GET" ? req.query?.action : req.body?.action;
    if (req.method === "GET" && action === "catalog") return res.status(200).json({ catalog: catalog() });
    if (req.method === "GET" && action === "overview") return res.status(200).json(await overview(db));
    if (req.method === "GET" && action === "list") {
      const agent = String(req.query?.agent || "").trim().toLowerCase();
      if (!EMAIL.test(agent)) throw new PlanCodeError(400, "إيميل الوكيل غير صحيح.");
      return res.status(200).json(await list(db, agent));
    }
    if (req.method === "POST" && action === "mint") return res.status(200).json({ codes: await mint(db, req.body) });
    throw new PlanCodeError(400, "طلب غير معروف.");
  } catch (err) {
    if (err instanceof PlanCodeError) return res.status(err.status).json({ error: err.message });
    console.error("mimar hub error:", err?.message || "unknown");
    return res.status(500).json({ error: "صار خطأ في مُونة." });
  }
}
