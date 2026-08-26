import React, { useState, useRef, useEffect } from "react";

function formatText(text) {
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} style={{ margin: "6px 0", paddingInlineStart: 20 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function formatInline(str) {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === "---" || trimmed === "") {
      flushList();
      if (trimmed === "") elements.push(<div key={elements.length} style={{ height: 6 }} />);
      return;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h4 key={elements.length} style={{ margin: "10px 0 4px", fontSize: 15 }}>{formatInline(trimmed.slice(4))}</h4>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h3 key={elements.length} style={{ margin: "12px 0 6px", fontSize: 16 }}>{formatInline(trimmed.slice(3))}</h3>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<h3 key={elements.length} style={{ margin: "12px 0 6px", fontSize: 17 }}>{formatInline(trimmed.slice(2))}</h3>);
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
      return;
    }
    flushList();
    elements.push(<p key={elements.length} style={{ margin: "4px 0", lineHeight: 1.7 }}>{formatInline(trimmed)}</p>);
  });
  flushList();
  return elements;
}

const QUICK_ACTIONS = [
  { id: "improve-product", label: "حسّن هذا المنتج" },
  { id: "caption", label: "اكتب لي كابشن" },
  { id: "reel-idea", label: "فكرة ريلز" },
  { id: "audit-store", label: "افحص متجري" },
  { id: "coupon-idea", label: "أنشئ كود خصم" },
  { id: "what-today", label: "ماذا أفعل اليوم؟" },
];

// الباقة الوحيدة المسموح لها باستخدام المساعد فعليًا (تحكّم بالتكلفة)
const REQUIRED_PLAN = "full";

function SuggestionCard({ suggestion, storeData, onApply }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    if (!onApply || applying || applied) return;
    setApplying(true);
    setError("");
    try {
      await onApply(suggestion);
      setApplied(true);
    } catch (err) {
      setError("تعذر تطبيق التعديل، حاول مرة ثانية.");
    }
    setApplying(false);
  }

  if (suggestion.kind === "improve-product") {
    const product = (storeData?.products || []).find((p) => p.id === suggestion.productId);
    return (
      <div style={{ marginTop: 6, marginBottom: 10, background: "#fff", border: "1px solid #EDEAE0", borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8677", fontWeight: 700, marginBottom: 6 }}>
          اقتراح تعديل{product ? ` — ${product.name}` : ""}
        </div>
        {applied ? (
          <div style={{ color: "#4B6152", fontSize: 12.5, fontWeight: 700 }}>✓ تم التطبيق على المنتج</div>
        ) : (
          <>
            <button
              onClick={handleApply}
              disabled={applying}
              style={{ width: "100%", background: "#0B0B0C", color: "#fff", border: "none", padding: "9px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {applying ? "جاري التطبيق..." : `تطبيق على ${product ? product.name : "المنتج"}`}
            </button>
            {error && <div style={{ color: "#B24C3A", fontSize: 11, marginTop: 6 }}>{error}</div>}
          </>
        )}
      </div>
    );
  }

  if (suggestion.kind === "coupon-idea") {
    return (
      <div style={{ marginTop: 6, marginBottom: 10, background: "#fff", border: "1px solid #EDEAE0", borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8677", fontWeight: 700, marginBottom: 6 }}>
          اقتراح كود خصم — {suggestion.code} ({suggestion.percent}٪)
        </div>
        {applied ? (
          <div style={{ color: "#4B6152", fontSize: 12.5, fontWeight: 700 }}>✓ تم إنشاء الكود</div>
        ) : (
          <>
            <button
              onClick={handleApply}
              disabled={applying}
              style={{ width: "100%", background: "#0B0B0C", color: "#fff", border: "none", padding: "9px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {applying ? "جاري الإنشاء..." : `إنشاء كود ${suggestion.code}`}
            </button>
            {error && <div style={{ color: "#B24C3A", fontSize: 11, marginTop: 6 }}>{error}</div>}
          </>
        )}
      </div>
    );
  }

  return null;
}

export default function GrowthAssistant({ storeData, plan, onUpgradeClick, onApplySuggestion, nextStep }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const panelRef = useRef(null);

  // ===== زنبرك قابل للمقاطعة — نفس منطق مهارة apple-design =====
  const currentY = useRef(0);
  const targetY = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(null);
  const panelHeight = useRef(560);

  function renderSheet() {
    if (panelRef.current) panelRef.current.style.transform = `translateY(${currentY.current}px)`;
  }
  function springStep(damping, response) {
    const stiffness = (2 * Math.PI / response) ** 2;
    const dampingCoef = 2 * damping * Math.sqrt(stiffness);
    function step() {
      const displacement = currentY.current - targetY.current;
      const accel = -stiffness * displacement - dampingCoef * velocity.current;
      velocity.current += accel * (1 / 60);
      currentY.current += velocity.current * (1 / 60);
      renderSheet();
      if (Math.abs(velocity.current) > 0.5 || Math.abs(currentY.current - targetY.current) > 0.5) {
        rafId.current = requestAnimationFrame(step);
      } else {
        currentY.current = targetY.current;
        velocity.current = 0;
        renderSheet();
        rafId.current = null;
        if (targetY.current > 0) setOpen(false);
      }
    }
    return step;
  }
  function animateTo(target, opts = {}) {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    targetY.current = target;
    if (opts.velocity !== undefined) velocity.current = opts.velocity;
    rafId.current = requestAnimationFrame(springStep(opts.damping ?? 1.0, opts.response ?? 0.4));
  }
  function openPanel() {
    setOpen(true);
    requestAnimationFrame(() => {
      if (panelRef.current) panelHeight.current = panelRef.current.offsetHeight;
      currentY.current = panelHeight.current;
      renderSheet();
      animateTo(0, { damping: 0.86, response: 0.42 });
    });
  }
  function closePanel(withVelocity) {
    animateTo(panelHeight.current, { damping: 1.0, response: 0.35, velocity: withVelocity || 0 });
  }

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;
    let dragging = false, startY = 0, startCurrentY = 0, lastMoveY = 0, lastMoveT = 0, pointerVelocity = 0;
    function onDown(e) {
      if (e.target.closest("button") || e.target.closest("input")) return;
      dragging = true;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      panel.setPointerCapture(e.pointerId);
      startY = e.clientY; startCurrentY = currentY.current;
      lastMoveY = e.clientY; lastMoveT = performance.now(); pointerVelocity = 0;
    }
    function onMove(e) {
      if (!dragging) return;
      let newY = startCurrentY + (e.clientY - startY);
      if (newY < 0) {
        const over = -newY;
        newY = -((over * panelHeight.current * 0.55) / (panelHeight.current + 0.55 * Math.abs(over)));
      }
      currentY.current = newY;
      renderSheet();
      const now = performance.now();
      const dt = now - lastMoveT;
      if (dt > 0) pointerVelocity = ((e.clientY - lastMoveY) / dt) * 1000;
      lastMoveY = e.clientY; lastMoveT = now;
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      const projected = currentY.current + (pointerVelocity / 1000) * 0.998 / (1 - 0.998);
      if (projected > panelHeight.current * 0.35) closePanel(pointerVelocity);
      else animateTo(0, { damping: 0.9, response: 0.35, velocity: pointerVelocity });
    }
    panel.addEventListener("pointerdown", onDown);
    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerup", onUp);
    return () => {
      panel.removeEventListener("pointerdown", onDown);
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerup", onUp);
    };
  }, [open]);

  const hasAccess = plan === REQUIRED_PLAN;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendToAssistant(q, actionType) {
    if (!q || loading || !hasAccess) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/growth-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          storeData: storeData || {},
          actionType: actionType || "chat",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || data.error || "ما وصل رد", suggestion: data.suggestion || null },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "صار خطأ بالاتصال، حاول مرة ثانية" }]);
    }
    setLoading(false);
  }

  function handleAsk() {
    sendToAssistant(question.trim(), "chat");
  }

  function handleQuickAction(action) {
    sendToAssistant(action.label, action.id);
  }

  return (
    <div style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}>
      {/* الزر العائم */}
      {!open && (
        <button
          onClick={openPanel}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          style={{
            position: "fixed",
            bottom: 24,
            insetInlineStart: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#0B0B0C",
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            fontSize: 24,
            cursor: "pointer",
            zIndex: 1000,
            transform: "scale(1)",
            transition: "transform 100ms ease-out",
          }}
        >
          ✦
        </button>
      )}

      {/* نافذة قفل الميزة — لغير المشتركين بباقة متجر متكامل */}
      {open && !hasAccess && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            insetInlineStart: 0,
            width: "100%",
            maxWidth: 380,
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              background: "#0B0B0C",
              color: "#fff",
              borderRadius: "20px 20px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>مساعد نمو متجرك ✦</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <div style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 800, color: "#0B0B0C", fontSize: 15, marginBottom: 8 }}>
              مساعد نمو متجرك حصري لباقة متجر متكامل
            </div>
            <div style={{ color: "#8A8677", fontSize: 12.5, lineHeight: 1.8, marginBottom: 18 }}>
              رقّي باقتك عشان تقدر تستخدم المساعد الذكي لتحسين منتجاتك وكتابة المحتوى وأفكار التسويق.
            </div>
            <button
              onClick={() => {
                setOpen(false);
                if (onUpgradeClick) onUpgradeClick();
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              style={{
                width: "100%",
                background: "#0B0B0C",
                color: "#fff",
                border: "none",
                padding: 13,
                borderRadius: 100,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transform: "scale(1)",
                transition: "transform 100ms ease-out",
              }}
            >
              شوف باقة متجر متكامل
            </button>
          </div>
        </div>
      )}

      {/* نافذة المحادثة — فقط لمشتركي باقة متجر متكامل */}
      {open && hasAccess && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: 0,
            insetInlineStart: 0,
            width: "100%",
            maxWidth: 380,
            height: "min(560px, 85vh)",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            touchAction: "none",
          }}
        >
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.3)", margin: "8px auto 0" }} />
          <div
            style={{
              padding: "10px 16px 14px",
              background: "#0B0B0C",
              color: "#fff",
              borderRadius: "20px 20px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>مساعد نمو متجرك ✦</span>
            <button
              onClick={() => closePanel()}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: "rgba(251,250,247,0.4)", touchAction: "pan-y" }}>
            {messages.length === 0 && (
              <>
                <p style={{ color: "#8A8677", fontSize: 13.5, textAlign: "center", marginTop: 20, marginBottom: 16 }}>
                  {nextStep
                    ? `${nextStep.title} — اسألني وأساعدك فيها، أو اختر من الأزرار تحت 👇`
                    : "اسألني عن أي شي يخص تطوير متجرك ومبيعاتك 👋"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 100,
                        border: "1px solid #EDEAE0",
                        background: "#fff",
                        color: "#0B0B0C",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: 14,
                      background: m.role === "user" ? "#F1F0EA" : "#EAF0EB",
                      color: "#0B0B0C",
                      fontSize: 13.5,
                    }}
                  >
                    {m.role === "assistant" ? formatText(m.text) : m.text}
                  </div>
                </div>
                {m.role === "assistant" && m.suggestion && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: "85%", width: "85%" }}>
                      <SuggestionCard suggestion={m.suggestion} storeData={storeData} onApply={onApplySuggestion} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: "end", color: "#8A8677", fontSize: 13 }}>جاري التفكير...</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #EDEAE0" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="اكتب سؤالك..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 100,
                border: "1px solid #EDEAE0",
                fontSize: 13.5,
                fontFamily: "inherit",
                background: "#FBFAF7",
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading}
              style={{
                padding: "0 16px",
                borderRadius: 100,
                background: "#0B0B0C",
                color: "#fff",
                border: "none",
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
