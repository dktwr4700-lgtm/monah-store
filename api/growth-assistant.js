export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, storeData, actionType } = req.body;

  const type = actionType || 'chat';

  function buildStoreContext(data) {
    if (!data || Object.keys(data).length === 0) {
      return 'ما وصلتني بيانات عن المتجر، عامل التاجر كمستخدم جديد ما بدأ بعد.';
    }
    const lines = [];
    lines.push(`اسم المتجر: ${data.storeName || 'بدون اسم بعد'}`);
    if (data.tagline) lines.push(`وصف المتجر: ${data.tagline}`);
    lines.push(`الباقة الحالية: ${data.plan || 'أساسية'}`);
    lines.push(`عدد المنتجات: ${data.productsCount ?? 0}`);
    if (data.products && data.products.length > 0) {
      lines.push('المنتجات:');
      data.products.forEach((p) => {
        lines.push(
          `- ${p.name} | السعر: ${p.price} ر.ع | التصنيف: ${p.category || 'عام'} | ${p.hidden ? 'مخفي' : 'منشور'} | الوصف: ${p.description ? p.description : 'بدون وصف'}`
        );
      });
    } else {
      lines.push('ما عنده أي منتج مضاف بعد.');
    }
    lines.push(`عدد الطلبات: ${data.ordersCount ?? 0}`);
    lines.push(`إجمالي المبيعات: ${data.totalSales ?? 0} ر.ع`);
    return lines.join('\n');
  }

  const storeContext = buildStoreContext(storeData);

  const basePrompt = `أنت "مساعد نمو متجرك"، مساعد ذكي داخل منصة Monah لبيع المنتجات الرقمية بدون عمولة. تتحدث بالعربية بأسلوب مباشر وعملي وودود، بدون رموز markdown خام مثل # أو **، فقط نص عادي منظم بفقرات وأسطر واضحة.

بيانات متجر التاجر الحالي:
${storeContext}

القواعد:
- ردودك دائمًا مبنية على بيانات هذا المتجر تحديدًا، لا نصائح عامة فقط.
- إذا المتجر فارغ من المنتجات، وجّه التاجر لإضافة أول منتج بدل إعطاء نصائح تسويقية عامة.
- إذا منتج بدون وصف، انبهه لذلك بوضوح.
- كن مختصرًا ومباشرًا، لا تطوّل بدون داعٍ.
- أنت لا تقدر تعدّل أي شيء في المتجر مباشرة، فقط تقترح نصوصًا يقدر التاجر ينسخها أو يطبقها بنفسه لاحقًا.`;

  let userMessage;
  if (type === 'chat') {
    userMessage = question;
  } else {
    userMessage = question || 'ساعدني';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: basePrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'ما قدرت أطلع رد، حاول مرة ثانية';

    res.status(200).json({ reply, suggestion: null });
  } catch (error) {
    res.status(500).json({ error: 'حصل خطأ، حاول مرة ثانية' });
  }
}
