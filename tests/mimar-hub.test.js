// أكواد اشتراك مُونة من «مركز معمار»: حساب الباقة والمدة، ربط المركز، وتفعيل التاجر للكود.
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { FakeDb, FieldValue } from "./fakeFirestore.js";

const fake = new FakeDb();
vi.mock("firebase-admin/app", () => ({ cert: () => ({}), getApps: () => [{}], initializeApp: () => {} }));
vi.mock("firebase-admin/firestore", () => ({ FieldValue, getFirestore: () => fake }));

const SECRET = "s3cret-for-tests-123";
const DAY = 86400000;
let lib, signup;
beforeAll(async () => {
  process.env.MIMAR_HUB_SECRET = SECRET;
  lib = await import("../lib/mimar-hub.js");
  signup = (await import("../api/merchant-signup.js")).default;
  // تسجيل الدخول: التوكن هو رقم المستخدم
  globalThis.fetch = vi.fn(async (url, init) => {
    if (String(url).includes("accounts:lookup")) {
      const uid = JSON.parse(init.body).idToken;
      return { ok: true, json: async () => ({ users: [{ localId: uid, email: `${uid}@test.om` }] }) };
    }
    return { ok: false, text: async () => "", json: async () => ({}) };
  });
});
beforeEach(() => fake.data.clear());

function fakeRes() {
  const out = { status: 200, json: null };
  const res = { setHeader() {}, status(c) { out.status = c; return res; }, json(o) { out.json = o; return res; } };
  return { res, out };
}
async function hub({ method = "GET", secret = SECRET, query = {}, body } = {}) {
  const { res, out } = fakeRes();
  await signup({ method, headers: secret ? { "x-hub-secret": secret } : {}, query: { hub: "1", ...query }, body }, res);
  return { status: out.status, ...out.json };
}
async function redeem(uid, body) {
  const { res, out } = fakeRes();
  await signup({ method: "POST", headers: { authorization: `Bearer ${uid}` }, query: {}, body: { action: "redeem_plan_code", ...body } }, res);
  return { status: out.status, ...out.json };
}
const iso = (t) => new Date(t).toISOString().slice(0, 10);

describe("حساب كود الباقة", () => {
  const now = new Date("2026-10-02T12:00:00Z");
  it("يوحّد الكود اللي يكتبه التاجر", () => {
    expect(lib.normalizePlanCode(" mn 7k4p 92qx ")).toBe("MN-7K4P-92QX");
    expect(lib.normalizePlanCode("7K4P92QX")).toBe("MN-7K4P-92QX");
    expect(lib.PLAN_CODE_PATTERN.test("MN-7K4P-92QX")).toBe(true);
    expect(lib.PLAN_CODE_PATTERN.test("MN-0K4P-92QX")).toBe(false);
  });
  it("متجر ما دفع: يتفعل لشهر من اليوم", () => {
    const r = lib.planCodeResult({ plan: "unpaid" }, "basic", now);
    expect(r).toMatchObject({ plan: "basic", subscriptionExpiresAt: "2026-11-01", dropAddOns: [] });
  });
  it("الشهر ينضاف على اللي باقي، والترقية مسموحة", () => {
    const seller = { plan: "basic", subscriptionExpiresAt: "2026-10-12" };
    expect(lib.planCodeResult(seller, "basic", now).subscriptionExpiresAt).toBe("2026-11-11");
    expect(lib.planCodeResult(seller, "pro", now).plan).toBe("pro");
  });
  it("كود باقة أقل ما يقبل والاشتراك شغال، ويقبل بعد ما ينتهي لو منتجاته تكفيها", () => {
    expect(() => lib.planCodeResult({ plan: "pro", subscriptionExpiresAt: "2026-10-20" }, "basic", now)).toThrow(/باقتك الحالية/);
    expect(lib.planCodeResult({ plan: "pro", subscriptionExpiresAt: "2026-09-20", productCount: 40 }, "basic", now).plan).toBe("basic");
    expect(() => lib.planCodeResult({ plan: "pro", subscriptionExpiresAt: "2026-09-20", productCount: 60 }, "basic", now)).toThrow(/60 منتج/);
  });
  it("الإضافات المدفوعة تتوقف والمجانية تبقى", () => {
    const r = lib.planCodeResult({ plan: "basic", subscriptionExpiresAt: "2026-10-05", activeAddOns: ["digitalSelling", "aiTools"] }, "basic", now);
    expect(r.dropAddOns).toEqual(["aiTools"]);
    expect(r.keepAddOns).toEqual(["digitalSelling"]);
  });
});

describe("ربط مركز معمار", () => {
  it("يرفض بدون كلمة السر الصحيحة", async () => {
    expect((await hub({ secret: null, query: { action: "catalog" } })).status).toBe(401);
    expect((await hub({ secret: "wrong-secret-xxxxxxx", query: { action: "catalog" } })).status).toBe(401);
  });
  it("يعرض الباقات بأسعارها", async () => {
    const r = await hub({ query: { action: "catalog" } });
    expect(r.catalog.map((c) => c.item)).toEqual(["starter", "basic", "pro"]);
    expect(r.catalog.map((c) => c.price)).toEqual([0.5, 5, 10]);
  });
  it("يطلع أكواد لوكيل بدون تكرار الدفعة، وللبيع المباشر لازم يكون معها لمين", async () => {
    const body = { action: "mint", agent: "Agent@X.om", agentName: "حمد", item: "basic", count: 3, unit: 2.5, batch: "b1" };
    const a = await hub({ method: "POST", body });
    expect(a.codes).toHaveLength(3);
    expect(a.codes[0]).toMatch(lib.PLAN_CODE_PATTERN);
    expect((await hub({ method: "POST", body })).codes.sort()).toEqual(a.codes.sort());
    expect((await hub({ method: "POST", body: { ...body, item: "unpaid", batch: "b2" } })).status).toBe(400);
    expect((await hub({ method: "POST", body: { action: "mint", item: "pro", count: 1, batch: "d0" } })).status).toBe(400);
    const d = await hub({ method: "POST", body: { action: "mint", note: "متجر معمار", item: "pro", count: 1, batch: "d1" } });
    const doc = (await fake.collection("planCodes").doc(d.codes[0]).get()).data();
    expect(doc).toMatchObject({ plan: "pro", note: "مركز معمار: متجر معمار", used: false });
    expect(doc.agent).toBeUndefined();
  });
  it("قائمة الوكيل والنظرة العامة تطلع اسم المتجر وباقته بس", async () => {
    const a = await hub({ method: "POST", body: { action: "mint", agent: "agent@x.om", item: "basic", count: 2, unit: 2.5, batch: "b1" } });
    await fake.collection("sellers").doc("s1").set({ storeName: "متجر الندى", email: "nada@x.om", plan: "basic", subscriptionExpiresAt: iso(Date.now() + 20 * DAY), paymentAccountNumber: "123456789" });
    await fake.collection("sellers").doc("s2").set({ storeName: "منتهي", plan: "basic", subscriptionExpiresAt: iso(Date.now() - 3 * DAY) });
    await fake.collection("sellers").doc("s3").set({ storeName: "لسا ما دفع", plan: "unpaid" });
    await fake.collection("planCodes").doc(a.codes[0]).update({ used: true, usedBy: "s1" });
    const l = await hub({ query: { action: "list", agent: "agent@x.om" } });
    expect(l.codes.find((c) => c.used)).toMatchObject({ customer: "s1", item: "basic", cost: 2.5 });
    expect(l.customers).toEqual([{ id: "s1", name: "متجر الندى", plan: "الأساسي", expiresAt: Date.parse(iso(Date.now() + 20 * DAY)) }]);
    const o = await hub({ query: { action: "overview" } });
    expect(o.stats).toMatchObject({ active: 1, total: 3 });
    expect(o.customers.map((c) => c.name)).toEqual(["متجر الندى"]);
    expect(o.codes.find((c) => c.used).customer).toBe("متجر الندى");
    expect(JSON.stringify([l, o])).not.toMatch(/nada@x\.om|123456789/);
  });
});

describe("التاجر يفعّل الكود", () => {
  async function code(plan, id = "MN-AAAA-BBBB") {
    await fake.collection("planCodes").doc(id).set({ plan, used: false, agent: "agent@x.om" });
    return id;
  }
  it("متجر ما دفع يتفعل، والكود ما يشتغل مرة ثانية", async () => {
    await fake.collection("sellers").doc("u1").set({ storeName: "متجري", plan: "unpaid", activeAddOns: [] });
    await fake.collection("merchantSignups").doc("u1").set({ status: "awaiting_payment" });
    const c = await code("starter");
    const r = await redeem("u1", { code: "mn-aaaa-bbbb" });
    expect(r).toMatchObject({ status: 200, ok: true, plan: "starter", subscriptionExpiresAt: iso(Date.now() + 30 * DAY) });
    const seller = (await fake.collection("sellers").doc("u1").get()).data();
    expect(seller).toMatchObject({ plan: "starter", subscriptionExpiresAt: iso(Date.now() + 30 * DAY), lastPlanCode: c });
    expect((await fake.collection("merchantSignups").doc("u1").get()).data().status).toBe("activated");
    expect((await fake.collection("planCodes").doc(c).get()).data()).toMatchObject({ used: true, usedBy: "u1", usedByEmail: "u1@test.om" });
    expect((await redeem("u1", { code: c })).status).toBe(409);
  });
  it("الإضافات المدفوعة: يسأله أول، وبعد الموافقة تتوقف", async () => {
    await fake.collection("sellers").doc("u2").set({ storeName: "متجر", plan: "basic", subscriptionExpiresAt: iso(Date.now() + 5 * DAY), activeAddOns: ["digitalSelling", "salesGrowth"] });
    const c = await code("basic", "MN-CCCC-DDDD");
    const ask = await redeem("u2", { code: c });
    expect(ask).toMatchObject({ status: 200, needsConfirm: true, dropAddOns: ["salesGrowth"] });
    expect((await fake.collection("planCodes").doc(c).get()).data().used).toBe(false);
    const ok = await redeem("u2", { code: c, confirmDropAddOns: true });
    expect(ok).toMatchObject({ ok: true, activeAddOns: ["digitalSelling"], droppedAddOns: ["salesGrowth"], subscriptionExpiresAt: iso(Date.now() + 35 * DAY) });
  });
  it("كود غلط أو بدون متجر يرجع رسالة واضحة", async () => {
    expect((await redeem("u3", { code: "hello" })).status).toBe(400);
    expect((await redeem("u3", { code: "MN-ZZZZ-ZZZZ" })).status).toBe(403);
    await fake.collection("sellers").doc("u3").set({ storeName: "س", plan: "unpaid" });
    const r = await redeem("u3", { code: "MN-ZZZZ-ZZZZ" });
    expect(r).toMatchObject({ status: 404, error: "الكود غير صحيح." });
  });
});

describe("روابط وكلاء معمار", () => {
  async function post(uid, body) {
    const { res, out } = fakeRes();
    await signup({ method: "POST", headers: { authorization: `Bearer ${uid}` }, query: {}, body }, res);
    return { status: out.status, ...out.json };
  }
  it("المتجر اللي سجّل من رابط الوكيل ينربط فيه، ودفعاته (بالبطاقة أو كود متجر معمار) تنحسب له وبس مرة", async () => {
    expect((await post("v1", { action: "register", storeName: "متجر الوكيل", storeType: "files", ref: " hamad " })).status).toBe(200);
    expect((await post("v2", { action: "register", storeName: "بدون وكيل", storeType: "files", ref: "x!" })).status).toBe(200);
    expect((await fake.collection("sellers").doc("v1").get()).data().referredBy).toBe("HAMAD");
    expect((await fake.collection("sellers").doc("v2").get()).data().referredBy).toBeUndefined();
    // كود من متجر معمار
    await fake.collection("planCodes").doc("MN-AAAA-CCCC").set({ plan: "basic", used: false, note: "مركز معمار: متجر معمار" });
    expect((await post("v1", { action: "redeem_plan_code", code: "MN-AAAA-CCCC" })).ok).toBe(true);
    // كود الوكيل نفسه: ما ينحسب (ربحه أخذه من البيع)
    await fake.collection("planCodes").doc("MN-AAAA-DDDD").set({ plan: "basic", used: false, agent: "hamad@x.om" });
    expect((await post("v1", { action: "redeem_plan_code", code: "MN-AAAA-DDDD" })).ok).toBe(true);
    // دفعة بالبطاقة (تجديد)، ونفس الدفعة مرتين
    await lib.recordReferralPayment(fake, { uid: "v1", eventId: "RENEW-v1-1", plan: "pro", amount: 10 });
    await lib.recordReferralPayment(fake, { uid: "v1", eventId: "RENEW-v1-1", plan: "pro", amount: 10 });
    await lib.recordReferralPayment(fake, { uid: "v2", eventId: "RENEW-v2-1", plan: "basic", amount: 5 });
    const r = await hub({ query: { action: "referrals", ref: "HAMAD" } });
    expect(r.signups.map((x) => [x.id, x.name])).toEqual([["v1", "متجر الوكيل"]]);
    expect(r.events.map((e) => [e.id, e.item, e.amount, e.kind]).sort()).toEqual([["MN-AAAA-CCCC", "basic", 5, "code"], ["RENEW-v1-1", "pro", 10, "card"]]);
    expect((await hub({ query: { action: "referrals" } })).events).toHaveLength(2);
    expect((await hub({ query: { action: "referrals", ref: "a b" } })).status).toBe(400);
  });
});
