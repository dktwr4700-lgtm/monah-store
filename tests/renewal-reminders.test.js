import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function loadDue() {
  const src = await read("api/merchant-signup.js");
  const start = src.indexOf("const RENEWAL_REMINDER_DAYS");
  const end = src.indexOf("function renewalReminderStep");
  return new Function(`${src.slice(start, end)}; return renewalReminderDue;`)();
}

describe("تذكير تجديد الاشتراك", () => {
  it("يرسل قبل 5 أيام وقبل يوم ويوم الانتهاء، وكل وحدة مرة بس", async () => {
    const due = await loadDue();
    expect(due(6, [])).toBe(null);
    expect(due(5, [])).toBe(5);
    expect(due(4, [5])).toBe(null);
    expect(due(1, [5])).toBe(1);
    expect(due(1, [5, 1])).toBe(null);
    expect(due(0, [5, 1])).toBe(0);
    expect(due(0, [5, 1, 0])).toBe(null);
    expect(due(-1, [])).toBe(null);
  });

  it("لو فات الجدول يرسل الأقرب بس", async () => {
    const due = await loadDue();
    expect(due(3, [])).toBe(5);
    expect(due(0, [])).toBe(0);
  });

  it("محمي بـ CRON_SECRET ومجدول يوميًا، وتذكيرات التسجيل تبقى موقوفة", async () => {
    const api = await read("api/merchant-signup.js");
    const fn = api.slice(api.indexOf("async function sendRenewalReminders"), api.indexOf("export default async function handler"));
    expect(fn).toContain("authHeader !== `Bearer ${process.env.CRON_SECRET}`");
    expect(fn).toContain("isUnpaidSeller(seller)");
    const vercel = JSON.parse(await read("vercel.json"));
    expect(vercel.crons).toContainEqual({ path: "/api/merchant-signup?job=renewal_reminders", schedule: "0 5 * * *" });
    expect(vercel.crons.map((c) => c.path)).not.toContain("/api/merchant-signup?job=onboarding_reminders");
  });
});

describe("تذكير المسجلين اللي ما فعّلوا", () => {
  it("رسالتين بس، للتسجيلات الجديدة، ومحمي بـ CRON_SECRET", async () => {
    const api = await read("api/merchant-signup.js");
    const fn = api.slice(api.indexOf("async function sendSignupReminders"), api.indexOf("export default async function handler"));
    expect(fn).toContain("authHeader !== `Bearer ${process.env.CRON_SECRET}`");
    expect(fn).toContain("if (daysSince > SIGNUP_NUDGE_WINDOW_DAYS) continue;");
    expect(api).toContain("const SIGNUP_NUDGE_WINDOW_DAYS = 14;");
    expect(api).toMatch(/key: "completeSignup",\s+schedule: \[1, 3\]/);
    const vercel = JSON.parse(await read("vercel.json"));
    expect(vercel.crons).toContainEqual({ path: "/api/merchant-signup?job=signup_reminders", schedule: "10 5 * * *" });
  });
});
