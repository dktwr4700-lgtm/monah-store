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
  const hasMultipleProducts = (storeData?.products?.length || 0) > 1;
  const hasOneProduct = (storeData?.products?.length || 0) === 1;
  const hasNoProducts = (storeData?.products?.length || 0) === 0;

  // تعليمات إضافية خاصة بكل نوع إجراء — كل نوع يضيف سلوكًا محددًا فوق التعليمات العامة
  const ACTION_INSTRUCTIONS = {
    'improve-product': `
مهمتك الآن: تحسين اسم ووصف منتج معين للتاجر.
${hasNoProducts ? 'التاجر ما عنده أي منتج بعد — قل له يحتاج يضيف منتج أول قبل ما تقدر تحسّنه.' : ''}
${hasMultipleProducts ? 'عنده أكثر من منتج — إذا ما حدد التاجر اسم المنتج بسؤاله، اسأله أي منتج بالضبط يبي يحسّن (اذكر أسماء منتجاته الحالية بسؤالك).' : ''}
${hasOneProduct ? 'عنده منتج واحد فقط — اشتغل عليه مباشرة بدون ما تسأل.' : ''}
لما تحدد المنتج، اكتب له: اسم مقترح محسّن (لو يحتاج)، ووصف مقترح جديد أوضح وأقوى بيعيًا (٢-٤ جمل)، بأسلوب يبرز الفائدة للمشتري.`,

    caption: `
مهمتك الآن: كتابة كابشن جاهز لمنصات التواصل (واتساب/إنستغرام) لمنتج معين.
${hasNoProducts ? 'التاجر ما عنده أي منتج بعد — قل له يحتاج يضيف منتج أول.' : ''}
${hasMultipleProducts ? 'عنده أكثر من منتج — إذا ما حدد أي منتج، اسأله عن أي منتج يبي الكابشن (اذكر أسماء منتجاته).' : ''}
${hasOneProduct ? 'عنده منتج واحد — اكتب الكابشن له مباشرة.' : ''}
لما تحدد المنتج، اكتب كابشن قصير جذاب (٣-٥ أسطر) مناسب لواتساب أو إنستغرام، فيه مقدمة تشد الانتباه، ذكر الفائدة، ودعوة واضحة للشراء مع الإشارة إلى رابط المنتج بشكل عام (بدون رابط حقيقي، فقط "الرابط في متجرك").`,

    'reel-idea': `
مهمتك الآن: تقديم فكرة فيديو قصير (ريلز/ستوري) لمنتج معين.
${hasNoProducts ? 'التاجر ما عنده أي منتج بعد — قل له يحتاج يضيف منتج أول.' : ''}
${hasMultipleProducts ? 'عنده أكثر من منتج — إذا ما حدد أي منتج، اسأله عن أي منتج يبي الفكرة له.' : ''}
${hasOneProduct ? 'عنده منتج واحد — اكتب الفكرة له مباشرة.' : ''}
لما تحدد المنتج، اقترح: خطاف افتتاحي (Hook) بجملة واحدة تشد المشاهد بأول ٣ ثواني، فكرة مشاهد الفيديو بشكل مختصر (٣-٤ نقاط)، ودعوة ختامية (CTA) واضحة.`,

    'audit-store': `
مهمتك الآن: فحص جاهزية متجر التاجر للبيع، بناءً على بيانات المتجر أعلاه فقط.
راجع: هل عنده منتجات؟ هل المنتجات فيها وصف؟ هل عنده اسم ووصف واضح للمتجر؟
اعطِ قائمة نقاط (Checklist) قصيرة بأهم ٣-٥ أشياء ناقصة أو تحتاج تحسين، كل نقطة بجملة مختصرة وعملية. لو كل شي تمام، اذكر ذلك وامدحه بإيجاز ثم اقترح خطوة نمو تالية.`,

    'coupon-idea': `
مهمتك الآن: اقتراح كود خصم مناسب للتاجر بناءً على وضع متجره.
${hasNoProducts ? 'التاجر ما عنده منتجات بعد، فكود الخصم مو مفيد الآن — قل له يضيف منتج أول.' : `اقترح: اسم كود قصير وسهل التذكر (أحرف إنجليزية وأرقام)، نسبة خصم مناسبة (بين 10% و30% حسب حجم متجره)، ومدة مقترحة للعرض (مثلاً أسبوع أو أسبوعين). اشرح باختصار سبب اختيارك لهذي النسبة والمدة.`}`,

    'what-today': `
مهمتك الآن: اقتراح مهمة واحدة أو اثنتين بسيطتين يقدر التاجر يسويهم اليوم لتحسين متجره، بناءً على وضعه الحالي بالضبط.
لا تعطِ قائمة طويلة، فقط ١-٢ مهمة، كل وحدة بجملة قصيرة وعملية يقدر يبدأ فيها فورًا.`,

    chat: '',
  };

  const actionInstruction = ACTION_INSTRUCTIONS[type] !== undefined ? ACTION_INSTRUCTIONS[type] : '';

  const basePrompt = `أنت "مساعد نمو متجرك"، مساعد ذكي داخل منصة Monah لبيع المنتجات الرقمية بدون عمولة. تتحدث بالعربية بأسلوب مباشر وعملي وودود، بدون رموز markdown خام مثل # أو **، فقط نص عادي منظم بفقرات وأسطر واضحة.

بيانات متجر التاجر الحالي:
${storeContext}

القواعد العامة:
- ردودك دائمًا مبنية على بيانات هذا المتجر تحديدًا، لا نصائح عامة فقط.
- إذا المتجر فارغ من المنتجات، وجّه التاجر لإضافة أول منتج بدل إعطاء نصائح تسويقية عامة.
- كن مختصرًا ومباشرًا، لا تطوّل بدون داعٍ.
- أنت لا تقدر تعدّل أي شيء في المتجر مباشرة، فقط تقترح نصوصًا يقدر التاجر ينسخها أو يطبقها بنفسه لاحقًا.
${actionInstruction}`;

  const userMessage = question || 'ساعدني';

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

    // suggestion: مكان محجوز لمرحلة قادمة (اقتراح نص جاهز للتطبيق مباشرة على منتج معين)
    res.status(200).json({ reply, suggestion: null });
  } catch (error) {
    res.status(500).json({ error: 'حصل خطأ، حاول مرة ثانية' });
  }
}
