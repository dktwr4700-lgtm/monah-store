import admin from "firebase-admin";

const REQUIRED_PLAN = "full";
const MAX_QUESTION_LENGTH = 1600;
const ALLOWED_ACTIONS = new Set(["chat", "improve-product", "caption", "reel-idea", "audit-store", "coupon-idea", "what-today"]);

function firebaseAdmin() {
  if (!admin.apps.length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!rawServiceAccount) throw new Error("firebase_admin_not_configured");
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(rawServiceAccount)) });
  }
  return admin;
}

function buildStoreContext(data) {
  const lines = [
    `اسم المتجر: ${data.storeName || "بدون اسم بعد"}`,
    data.tagline ? `وصف المتجر: ${data.tagline}` : "",
    `الباقة الحالية: ${data.plan}`,
    `عدد المنتجات: ${data.products.length}`,
  ].filter(Boolean);

  if (data.products.length) {
    lines.push("المنتجات (استخدم المعرّف بالضبط فقط إذا قدّمت اقتراح تطبيق):");
    data.products.forEach((product) => lines.push(`- المعرّف: ${product.id} | ${product.name} | السعر: ${product.price} ر.ع | التصنيف: ${product.category || "عام"} | ${product.hidden ? "مخفي" : "منشور"} | الوصف: ${product.description || "بدون وصف"}`));
  } else {
    lines.push("لا توجد منتجات مضافة بعد.");
  }
  lines.push(`عدد الطلبات: ${data.ordersCount}`);
  lines.push(`إجمالي المبيعات: ${data.totalSales} ر.ع`);
  return lines.join("\n");
}

async function authenticatedStoreData(req) {
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) return { error: [401, "سجّل دخولك إلى لوحة متجرك أولًا."] };

  const app = firebaseAdmin();
  const decoded = await app.auth().verifyIdToken(idToken);
  const db = app.firestore();
  const sellerSnap = await db.collection("sellers").doc(decoded.uid).get();
  if (!sellerSnap.exists || sellerSnap.data().disabled) return { error: [403, "هذا الحساب غير متاح لاستخدام المساعد الآن."] };
  if (sellerSnap.data().plan !== REQUIRED_PLAN) return { error: [403, "مساعد النمو متاح حاليًا لباقة متجر متكامل فقط."] };

  const [storeSnap, productsSnap, ordersSnap] = await Promise.all([
    db.collection("stores").doc(decoded.uid).get(),
    db.collection("products").where("ownerId", "==", decoded.uid).get(),
    db.collection("orders").where("ownerId", "==", decoded.uid).get(),
  ]);
  const products = productsSnap.docs.slice(0, 20).map((document) => {
    const product = document.data();
    return { id: document.id, name: product.name || "منتج بدون اسم", price: Number(product.price) || 0, category: product.category || "عام", description: product.description || "", hidden: Boolean(product.hidden) };
  });
  const orders = ordersSnap.docs.map((document) => document.data());
  const store = storeSnap.exists ? storeSnap.data() : {};
  return {
    data: {
      storeName: store.name || sellerSnap.data().storeName || "متجرك",
      tagline: store.tagline || "",
      plan: REQUIRED_PLAN,
      products,
      ordersCount: orders.length,
      totalSales: orders.filter((order) => order.status !== "pending").reduce((sum, order) => sum + (Number(order.price) || 0), 0),
    },
  };
}

function actionInstruction(type, storeData) {
  const productNames = storeData.products.map((product) => product.name).join("، ");
  if (type === "improve-product") return storeData.products.length ? `حسّن اسم ووصف منتج واحد. إن وُجد أكثر من منتج ولم يحدد المستخدم المنتج، اسأله أولًا عن المنتج المقصود (${productNames}). لا تقل إنك طبقت تعديلًا بنفسك.` : "أخبر التاجر أن يضيف منتجه الأول قبل تحسينه.";
  if (type === "caption") return storeData.products.length ? "اكتب كابشنًا عربيًا قصيرًا وجاهزًا للمشاركة للمنتج المحدد، مع دعوة واضحة للشراء دون اختلاق رابط." : "أخبر التاجر أن يضيف منتجه الأول قبل كتابة كابشن.";
  if (type === "reel-idea") return storeData.products.length ? "اقترح فكرة ريلز عملية: خطاف، 3 مشاهد، ودعوة ختامية." : "أخبر التاجر أن يضيف منتجه الأول قبل اقتراح فكرة ريلز.";
  if (type === "audit-store") return "راجع الاسم والوصف والمنتجات اعتمادًا على البيانات الموثوقة فقط، وقدّم 3 خطوات عملية كحد أقصى.";
  if (type === "coupon-idea") return storeData.products.length ? "اقترح كود خصم قصيرًا ونسبة بين 10 و30 بالمئة ومدة مناسبة. لا تنشئ الكود بنفسك." : "أخبر التاجر أن يضيف منتجه الأول قبل إنشاء فكرة خصم.";
  if (type === "what-today") return "اقترح مهمة واحدة أو اثنتين فقط يمكن للتاجر تنفيذها اليوم.";
  return "أجب باختصار وبأسلوب عملي عن سؤال التاجر اعتمادًا على بيانات متجره فقط.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "الطريقة غير مدعومة." });

  try {
    const trusted = await authenticatedStoreData(req);
    if (trusted.error) return res.status(trusted.error[0]).json({ error: trusted.error[1] });

    const question = String(req.body?.question || "ساعدني").trim().slice(0, MAX_QUESTION_LENGTH);
    const requestedAction = String(req.body?.actionType || "chat");
    const type = ALLOWED_ACTIONS.has(requestedAction) ? requestedAction : "chat";
    const storeContext = buildStoreContext(trusted.data);
    const system = `أنت مساعد نمو متجر داخل منصة مُونَة. تحدث بالعربية بأسلوب مباشر وودود. استخدم بيانات المتجر أدناه فقط، ولا تدّعِ تنفيذ تعديل أو نشر أو إنشاء كوبون بنفسك. لا تطلب كلمات مرور أو بيانات دفع أو بيانات شخصية حساسة.\n\n${storeContext}\n\nالمهمة الحالية: ${actionInstruction(type, trusted.data)}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system, messages: [{ role: "user", content: question || "ساعدني" }] }),
    });
    if (!response.ok) return res.status(502).json({ error: "المساعد غير متاح الآن، حاول بعد قليل." });
    const responseData = await response.json();
    const reply = responseData.content?.[0]?.text;
    if (!reply) return res.status(502).json({ error: "لم يصل رد من المساعد، حاول بعد قليل." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("growth assistant error", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تشغيل المساعد الآن، حاول بعد قليل." });
  }
}
