import { describe, it, expect } from "vitest";
import { toText } from "../lib/mail-text.js";

describe("نسخة النص العادي للإيميل", () => {
  it("تشيل الوسوم وتحوّل الروابط والأسطر", () => {
    const t = toText('<style>p{color:red}</style><div><h2>طلب جديد</h2><p>راجعي الإيصال &amp; أكدي</p><a href="https://monah-app.com/dashboard">افتحي اللوحة</a></div>');
    expect(t).toBe("طلب جديد\nراجعي الإيصال & أكدي\nافتحي اللوحة: https://monah-app.com/dashboard");
  });
});
