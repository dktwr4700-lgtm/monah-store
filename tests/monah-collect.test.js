import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

describe("الدفع بالبطاقة عبر مونة لمتجر يفعّله المالك", () => {
  it("يشغّل البطاقة للمتجر المفعّل له ويستخدم مفاتيح مونة من الخادم فقط", async () => {
    const orders = await read("api/orders.js");
    expect(orders).toContain("if (seller.monahCollect?.enabled) return true;");
    expect(orders).toContain('return { provider: "ompay", platform: true };');
    // مفاتيح مونة ما تنحفظ عند التاجر: ompayRequest يرجع لمفاتيح البيئة لما ما فيه مفتاح
    const client = await read("lib/ompay-client.js");
    expect(client).toContain("credentialsOverride?.apiKey || process.env.OMPAY_API_KEY");
  });

  it("يعلّم الطلب إنه دخل حساب مونة ويرسل للمالك إيميل باسم المتجر والمبلغ", async () => {
    const orders = await read("api/orders.js");
    expect(orders).toContain("collectedByMonah: true");
    expect(orders).toContain("if (credentials.platform) await notifyAdminOfMonahPayment(order, orderId);");
    expect(orders).toContain("`دفع جديد عبر مونة: ${storeName} · ${price.toFixed(3)} ر.ع`");
  });

  it("تسجيل التحويل للمالك فقط", async () => {
    const orders = await read("api/orders.js");
    const fn = orders.slice(orders.indexOf("async function adminMonahPayout"), orders.indexOf("async function deleteOrderAsAdmin"));
    expect(fn).toContain("requireAdmin(account);");
    expect(orders).toContain('if (action === "admin_monah_payout") return await adminMonahPayout(req, res, account);');
  });

  it("التاجر ما يقدر يفعّلها لنفسه (قواعد Firestore تسمح له بحقول محددة بس)", async () => {
    const rules = await read("firestore.rules");
    const sellers = rules.slice(rules.indexOf("match /sellers/{sellerId}"), rules.indexOf("match /sellers/{sellerId}") + 1500);
    expect(sellers).toContain("allow update: if isAdmin() || (");
    expect(sellers).not.toContain("monahCollect");
  });
});
