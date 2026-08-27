export default function handler(req, res) {
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "الطريقة غير مدعومة." });
  }

  // المساعد مخفي من الواجهة، ولا يفتح قبل أن تكتمل صلاحياته وتسعيره واختباره.
  // هذا يمنع أي استدعاء خارجي لخدمة ذكاء اصطناعي أو الوصول إلى بيانات المتجر في هذه المرحلة.
  return res.status(503).json({
    error: "مساعد النمو غير متاح حاليًا. سيتاح بعد اكتمال تفعيله واختباره.",
  });
}
