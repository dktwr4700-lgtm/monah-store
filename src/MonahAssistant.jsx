import React, { useEffect, useRef, useState } from "react";

// زر "اسأل مونة" العائم بالصفحة الرئيسية: محادثة قصيرة مع مساعد آلي يجاوب عن
// مُونة من معلوماتها الرسمية بس (الخادم: api/customer-assistant.js بوضع "monah").
// المحادثة تنحفظ بالمتصفح لين يسكّر التبويب، وما تنرسل إلا آخر رسائلها للخادم.

const STORAGE_KEY = "monah_assistant_chat";
const WHATSAPP_URL = "https://wa.me/96876630905";
const MAX_SENT_MESSAGES = 10;

const MA_T = {
  ar: {
    open: "اسأل مونة",
    title: "مساعد مُونة",
    subtitle: "مساعد آلي · يرد خلال ثوانٍ",
    close: "إغلاق",
    intro: "هلا 👋 أنا مساعد مُونة الآلي. اسألني عن الباقات والأسعار، أو كيف تبيع منتجاتك الرقمية وتستلم فلوسك.",
    suggestions: ["كم أسعار الباقات؟", "كيف أبيع دعوات أو تصاميم رقمية؟", "كيف يدفع العميل ويستلم الملف؟", "فيه عمولة على المبيعات؟"],
    placeholder: "اكتب سؤالك…",
    send: "إرسال",
    typing: "يكتب…",
    startStore: "افتح متجرك مجانًا",
    whatsapp: "كلّمنا واتساب",
    genericError: "ما قدرت أجاوب الحين. جرّب مرة ثانية أو كلّمنا على واتساب.",
    connectionError: "تعذر الاتصال. تأكد من الإنترنت وجرّب مرة ثانية.",
    disclaimer: "ردود آلية وقد تخطئ أحيانًا — للتأكيد كلّمنا واتساب.",
  },
  en: {
    open: "Ask Monah",
    title: "Monah assistant",
    subtitle: "Automated assistant · replies in seconds",
    close: "Close",
    intro: "Hi 👋 I'm Monah's automated assistant. Ask me about plans and pricing, or how to sell your digital products and get paid.",
    suggestions: ["How much are the plans?", "How do I sell digital invitations or designs?", "How does the customer pay and get the file?", "Is there a commission on sales?"],
    placeholder: "Type your question…",
    send: "Send",
    typing: "Typing…",
    startStore: "Open your store for free",
    whatsapp: "WhatsApp us",
    genericError: "I couldn't answer right now. Try again, or reach us on WhatsApp.",
    connectionError: "Couldn't connect. Check your internet and try again.",
    disclaimer: "Automated replies can be wrong sometimes — confirm with us on WhatsApp.",
  },
};

const styles = `
  .ma-launch{ position:fixed; bottom:18px; inset-inline-end:18px; z-index:60; display:inline-flex; align-items:center; gap:9px; background:#153A2C; color:#fff; border:none; border-radius:100px; padding:12px 18px 12px 16px; font:800 13.5px 'Cairo',sans-serif; cursor:pointer; box-shadow:0 12px 28px rgba(12,32,24,.28); transition:transform .16s ease-out, box-shadow .16s ease-out; }
  .ma-launch:hover{ transform:translateY(-2px); box-shadow:0 16px 32px rgba(12,32,24,.32); }
  .ma-launch:focus-visible{ outline:3px solid #D6F35C; outline-offset:3px; }
  .ma-dot{ width:9px; height:9px; border-radius:50%; background:#D6F35C; box-shadow:0 0 0 4px rgba(214,243,92,.22); flex-shrink:0; }
  .ma-panel{ position:fixed; bottom:18px; inset-inline-end:18px; z-index:61; width:min(380px, calc(100vw - 24px)); height:min(560px, calc(100dvh - 36px)); background:#FBFAF7; border:1px solid #E4E0D3; border-radius:22px; box-shadow:0 24px 60px rgba(12,32,24,.24); display:flex; flex-direction:column; overflow:hidden; font-family:'Cairo',sans-serif; color:#16233F; animation:ma-in .18s ease-out; }
  @keyframes ma-in{ from{ opacity:0; transform:translateY(10px) scale(.98); } to{ opacity:1; transform:none; } }
  @media (max-width:520px){ .ma-panel{ bottom:0; inset-inline-end:0; width:100vw; height:min(88dvh, 640px); border-radius:22px 22px 0 0; border-bottom:none; } .ma-launch{ bottom:14px; inset-inline-end:14px; } }
  @media (prefers-reduced-motion:reduce){ .ma-panel{ animation:none; } .ma-launch{ transition:none; } }
  .ma-head{ display:flex; align-items:center; gap:10px; padding:14px 16px; background:#153A2C; color:#fff; }
  .ma-head img{ width:32px; height:32px; border-radius:9px; background:#fff; flex-shrink:0; }
  .ma-head b{ display:block; font-family:'Almarai',sans-serif; font-size:14.5px; }
  .ma-head small{ display:block; font-size:11px; color:rgba(255,255,255,.72); }
  .ma-close{ margin-inline-start:auto; background:rgba(255,255,255,.12); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:17px; cursor:pointer; line-height:1; }
  .ma-close:focus-visible{ outline:2px solid #D6F35C; }
  .ma-body{ flex:1; overflow-y:auto; padding:16px 14px 8px; display:flex; flex-direction:column; gap:9px; }
  .ma-msg{ max-width:86%; padding:10px 13px; border-radius:16px; font-size:13px; line-height:1.85; white-space:pre-wrap; word-wrap:break-word; }
  .ma-msg.bot{ align-self:flex-start; background:#fff; border:1px solid #ECE8DC; border-start-start-radius:6px; }
  .ma-msg.user{ align-self:flex-end; background:#153A2C; color:#fff; border-start-end-radius:6px; }
  .ma-msg.error{ align-self:flex-start; background:#FBEFEC; color:#8A3A2C; border:1px solid #F0D5CE; }
  .ma-typing{ align-self:flex-start; font-size:12px; color:#7A766A; padding:4px 6px; }
  .ma-chips{ display:flex; flex-wrap:wrap; gap:7px; margin-top:4px; }
  .ma-chip{ background:#fff; border:1px solid #DCD6C6; color:#153A2C; border-radius:100px; padding:7px 12px; font:700 12px 'Cairo',sans-serif; cursor:pointer; text-align:start; }
  .ma-chip:hover{ border-color:#153A2C; }
  .ma-actions{ display:flex; gap:7px; padding:8px 12px 0; }
  .ma-actions a{ flex:1; text-align:center; text-decoration:none; border-radius:100px; padding:8px 10px; font-size:12px; font-weight:800; }
  .ma-cta{ background:#D6F35C; color:#143226; }
  .ma-wa{ background:#fff; color:#153A2C; border:1px solid #DCD6C6; }
  .ma-form{ display:flex; gap:8px; padding:10px 12px 6px; }
  .ma-form textarea{ flex:1; resize:none; border:1px solid #DCD6C6; border-radius:14px; padding:10px 12px; font:13px 'Cairo',sans-serif; background:#fff; color:#16233F; max-height:96px; min-height:42px; }
  .ma-form textarea:focus{ outline:2px solid #153A2C; outline-offset:0; border-color:transparent; }
  .ma-send{ align-self:flex-end; background:#153A2C; color:#fff; border:none; border-radius:12px; height:42px; padding:0 15px; font:800 12.5px 'Cairo',sans-serif; cursor:pointer; }
  .ma-send:disabled{ opacity:.5; cursor:default; }
  .ma-note{ font-size:10.5px; color:#8A8676; text-align:center; padding:0 14px 10px; }
`;

function loadChat() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((m) => m && typeof m.content === "string") : [];
  } catch {
    return [];
  }
}

export default function MonahAssistant({ lang = "ar" }) {
  const t = MA_T[lang] || MA_T.ar;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadChat);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const launchRef = useRef(null);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* المحادثة تبقى بالذاكرة بس */ }
  }, [messages]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    function onKey(event) { if (event.key === "Escape") closePanel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, sending, open]);

  function closePanel() {
    setOpen(false);
    setTimeout(() => launchRef.current?.focus(), 0);
  }

  async function ask(text) {
    const question = String(text || "").trim();
    if (!question || sending) return;
    const next = [...messages.filter((m) => m.role !== "error"), { role: "user", content: question }];
    setMessages(next);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/customer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "monah",
          messages: next.slice(-MAX_SENT_MESSAGES).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || t.genericError);
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const message = error instanceof TypeError ? t.connectionError : (error.message || t.genericError);
      setMessages((current) => [...current, { role: "error", content: message }]);
    }
    setSending(false);
  }

  function onSubmit(event) {
    event.preventDefault();
    ask(draft);
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask(draft);
    }
  }

  return (
    <>
      <style>{styles}</style>
      {!open && (
        <button ref={launchRef} type="button" className="ma-launch" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="ma-dot" aria-hidden="true" />
          {t.open}
        </button>
      )}
      {open && (
        <div className="ma-panel" role="dialog" aria-label={t.title} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
          <div className="ma-head">
            <img src="/monah-mark-512.png" alt="" />
            <div>
              <b>{t.title}</b>
              <small>{t.subtitle}</small>
            </div>
            <button type="button" className="ma-close" onClick={closePanel} aria-label={t.close}>×</button>
          </div>

          <div className="ma-body" ref={bodyRef} aria-live="polite">
            <div className="ma-msg bot">{t.intro}</div>
            {messages.length === 0 && (
              <div className="ma-chips">
                {t.suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" className="ma-chip" onClick={() => ask(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={"ma-msg " + (message.role === "user" ? "user" : message.role === "error" ? "error" : "bot")}>
                {message.content}
              </div>
            ))}
            {sending && <div className="ma-typing">{t.typing}</div>}
          </div>

          <div className="ma-actions">
            <a className="ma-cta" href="#start-store">{t.startStore}</a>
            <a className="ma-wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>
          </div>
          <form className="ma-form" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={800}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
            />
            <button className="ma-send" type="submit" disabled={sending || !draft.trim()}>{t.send}</button>
          </form>
          <div className="ma-note">{t.disclaimer}</div>
        </div>
      )}
    </>
  );
}
