export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, productData } = req.body;

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: 'اكتب سؤالك أول.' });
  }

  function buildProductContext(data) {
    if (!data) return 'ما وصلتني بيانات عن المنتج.';
    const lines = [];
    lines.push(`اسم المتجر: ${data.storeName || 'متجر رقمي'}`);
    if (data.storeTagline) lines.push(`وصف المتجر: ${data.storeTagline}`);
    lines.push(`اسم المنتج: ${data.productName || 'غير محدد'}`);
    lines.push(`نوع المنتج: ${data.productType === 'code' ? 'كود تفعيل/ترخيص' : 'ملف رقمي للتحميل'}`);
    lines.push(`السعر: ${data.price ?? '—'} ر.ع`);
    lines.push(`التصنيف: ${data.category || 'عام'}`);
    lines.push(`الوصف: ${data.description ? data.description : 'ما فيه وصف إضافي من البائع.'}`);
    lines.push(`طريقة الدفع: ${data.paymentMethod === 'manual' ? 'تحويل بنكي يدوي، يتأكد منه البائع نفسه' : 'دفع تلقائي فوري عبر المنصة'}`);
    return lines.join('\n');
  }

  const productContext = buildProductContext(productData);

  const systemPrompt = `أنت مساعد مبيعات ودود بمتجر رقمي على منصة Monah. مهمتك تجاوب أسئلة الزبون عن هذا المنتج بالذات قبل ما يشتري، بأسلوب عربي طبيعي ومختصر ومباشر، بدون رموز markdown خام.

بيانات المنتج:
${productContext}

قواعد صارمة:
- جاوب فقط من المعلومات أعلاه. لا تختلق تفاصيل غير موجودة (زي مدة ضمان، أو دعم لغات، أو مواصفات ملف تقنية) لو ما ذُكرت صراحة — قل بصراحة إنك ما عندك هذي المعلومة وينصح يسأل صاحب المتجر مباشرة.
- لا تفاوض على السعر ولا تعد بخصومات.
- ردك يكون قصير (٢-٤ جمل)، ما يحتاج الزبون يقرأ فقرة طويلة.
- إذا السؤال مو له علاقة بالمنتج أو الشراء، وجّه الزبون بلطف إنك هنا بس تساعده بأسئلة المنتج.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: String(question).trim() }] }],
        generationConfig: { maxOutputTokens: 400 },
      }),
    });

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'ما قدرت أطلع رد، حاول مرة ثانية.';

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'حصل خطأ، حاول مرة ثانية' });
  }
}

