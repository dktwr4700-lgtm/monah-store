// يضيف علامة مائية باسم المتجر على صورة العرض قبل ما ترتفع، عشان محد
// يقدر ياخذ سكرين شوت من صفحة المنتج ويستخدم التصميم (دعوة، بطاقة، قالب...)
// ببلاش. العلامة تنرسم داخل الصورة نفسها (مو طبقة CSS فوقها)، فالصورة
// المنشورة ما لها نسخة نظيفة أصلًا — النسخة الأصلية يرفعها التاجر كملف
// التسليم المحمي، وما يستلمها العميل إلا بعد الشراء.

const MAX_SIDE = 1600;
const FONT_FAMILY = "Cairo, 'Segoe UI', Tahoma, sans-serif";

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image_load_failed")); };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image_encode_failed"))), type, quality);
  });
}

export async function watermarkImage(file, label) {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // خلفية بيضاء عشان الصور الشفافة (PNG) ما تطلع سوداء بعد التحويل لـ JPEG.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const text = `${String(label || "").trim() || "مُونة"} · نسخة عرض`;
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 16));
  const font = `700 ${fontSize}px ${FONT_FAMILY}`;
  try { await document.fonts?.load(font, text); } catch { /* نكمل بخط النظام */ }

  // نص مكرر بشكل مائل يغطي الصورة كاملة — صعب قصّه أو مسحه من زاوية وحدة.
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  const stepX = ctx.measureText(text).width + fontSize * 2.5;
  const stepY = fontSize * 4;
  const reach = Math.hypot(width, height);
  // حدّ غامق + تعبئة فاتحة: العلامة تبان على الصور الفاتحة والغامقة معًا.
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, fontSize / 9);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  for (let y = -reach; y <= reach; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2);
    for (let x = -reach; x <= reach; x += stepX) {
      ctx.strokeText(text, x + offset, y);
      ctx.fillText(text, x + offset, y);
    }
  }
  ctx.restore();

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.88);
  return new File([blob], `${(file.name || "image").replace(/\.[^.]+$/, "")}-preview.jpg`, { type: "image/jpeg" });
}
