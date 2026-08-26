import React, { useState, useRef, useEffect } from "react";

export default function CustomerAssistant({ productData }) {
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
  const panelHeight = useRef(480);

  function render() {
    if (panelRef.current) {
      panelRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  }

  function springStep(damping, response) {
    const stiffness = (2 * Math.PI / response) ** 2;
    const dampingCoef = 2 * damping * Math.sqrt(stiffness);
    function step() {
      const displacement = currentY.current - targetY.current;
      const accel = -stiffness * displacement - dampingCoef * velocity.current;
      velocity.current += accel * (1 / 60);
      currentY.current += velocity.current * (1 / 60);
      render();
      if (Math.abs(velocity.current) > 0.5 || Math.abs(currentY.current - targetY.current) > 0.5) {
        rafId.current = requestAnimationFrame(step);
      } else {
        currentY.current = targetY.current;
        velocity.current = 0;
        render();
        rafId.current = null;
        if (targetY.current > 0) setOpen(false); // خلص الإغلاق فعليًا، شيل العنصر من الشاشة
      }
    }
    return step;
  }

  function animateTo(target, opts = {}) {
    if (rafId.current) cancelAnimationFrame(rafId.current); // مقاطعة فورية، تبدأ من القيمة الحالية بالشاشة
    targetY.current = target;
    if (opts.velocity !== undefined) velocity.current = opts.velocity;
    rafId.current = requestAnimationFrame(springStep(opts.damping ?? 1.0, opts.response ?? 0.4));
  }

  function openPanel() {
    setOpen(true);
    requestAnimationFrame(() => {
      if (panelRef.current) panelHeight.current = panelRef.current.offsetHeight;
      currentY.current = panelHeight.current;
      render();
      animateTo(0, { damping: 0.86, response: 0.42 });
    });
  }
  function closePanel(withVelocity) {
    animateTo(panelHeight.current, { damping: 1.0, response: 0.35, velocity: withVelocity || 0 });
  }

  // ===== سحب بإصبع واحد لإغلاق النافذة =====
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;
    let dragging = false;
    let startY = 0;
    let startCurrentY = 0;
    let lastMoveY = 0;
    let lastMoveT = 0;
    let pointerVelocity = 0;

    function onDown(e) {
      if (e.target.closest("button") || e.target.closest("input")) return;
      dragging = true;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      panel.setPointerCapture(e.pointerId);
      startY = e.clientY;
      startCurrentY = currentY.current;
      lastMoveY = e.clientY;
      lastMoveT = performance.now();
      pointerVelocity = 0;
    }
    function onMove(e) {
      if (!dragging) return;
      let delta = e.clientY - startY;
      let newY = startCurrentY + delta;
      if (newY < 0) {
        const over = -newY;
        newY = -((over * panelHeight.current * 0.55) / (panelHeight.current + 0.55 * Math.abs(over)));
      }
      currentY.current = newY;
      render();
      const now = performance.now();
      const dt = now - lastMoveT;
      if (dt > 0) pointerVelocity = ((e.clientY - lastMoveY) / dt) * 1000;
      lastMoveY = e.clientY;
      lastMoveT = now;
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      const projected = currentY.current + (pointerVelocity / 1000) * 0.998 / (1 - 0.998);
      if (projected > panelHeight.current * 0.35) {
        closePanel(pointerVelocity);
      } else {
        animateTo(0, { damping: 0.9, response: 0.35, velocity: pointerVelocity });
      }
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendQuestion(q) {
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/customer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, productData: productData || {} }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || data.error || "ما وصل رد" },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "صار خطأ بالاتصال، حاول مرة ثانية" }]);
    }
    setLoading(false);
  }

  function handleAsk() {
    sendQuestion(question.trim());
  }

  return (
    <div style={{ direction: "rtl", fontFamily: "'Cairo', sans-serif" }}>
      {!open && (
        <button
          onClick={openPanel}
          style={{
            position: "fixed",
            bottom: 24,
            insetInlineEnd: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 18px",
            borderRadius: 100,
            background: "#0B0B0C",
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Cairo', sans-serif",
            cursor: "pointer",
            zIndex: 1000,
            transform: "scale(1)",
            transition: "transform 100ms ease-out",
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span>💬</span> عندك سؤال عن المنتج؟
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: 0,
            insetInlineEnd: 0,
            width: "100%",
            maxWidth: 380,
            height: "min(480px, 80vh)",
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
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "#D9D5C6", margin: "8px auto 4px" }} />
          <div
            style={{
              padding: "8px 16px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0B0B0C" }}>اسأل عن المنتج 💬</span>
            <button
              onClick={() => closePanel()}
              style={{ background: "none", border: "none", color: "#8A8677", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, touchAction: "pan-y" }}>
            {messages.length === 0 && (
              <p style={{ color: "#8A8677", fontSize: 13, textAlign: "center", marginTop: 24, lineHeight: 1.8 }}>
                عندك سؤال عن هذا المنتج قبل ما تشتري؟ اسأل هنا وبجاوبك من تفاصيل المنتج مباشرة.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end", marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: m.role === "user" ? "#F1F0EA" : "#EAF0EB",
                    color: "#0B0B0C",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ textAlign: "end", color: "#8A8677", fontSize: 12.5 }}>جاري الرد...</div>}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #EDEAE0" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="مثال: هل الملف يفتح على آيفون؟"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 100,
                border: "1px solid #EDEAE0",
                fontSize: 13,
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
                fontSize: 13,
                cursor: "pointer",
                transform: "scale(1)",
                transition: "transform 100ms ease-out",
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
