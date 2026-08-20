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

// أزرار الإجراءات الجاهزة — محجوزة للمرحلة القادمة، تفعّل لاحقًا بإضافتها هنا
const QUICK_ACTIONS = [
  // { id: "improve-product", label: "حسّن هذا المنتج" },
  // { id: "caption", label: "اكتب لي كابشن" },
  // { id: "reel-idea", label: "فكرة ريلز" },
  // { id: "audit-store", label: "افحص متجري" },
  // { id: "coupon-idea", label: "أنشئ كود خصم" },
  // { id: "what-today", label: "ماذا أفعل اليوم؟" },
];

export default function GrowthAssistant({ storeData }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendToAssistant(q, actionType) {
    if (!q || loading) return;
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
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || data.error || "ما وصل رد" }]);
      // data.suggestion محجوز لمرحلة "تطبيق التعديل" القادمة
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
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            insetInlineStart: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#16233F",
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            fontSize: 24,
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          ✦
        </button>
      )}

      {/* نافذة المحادثة */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            insetInlineStart: 0,
            width: "100%",
            maxWidth: 380,
            height: "min(560px, 85vh)",
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          {/* الهيدر */}
          <div
            style={{
              padding: "14px 16px",
              background: "#16233F",
              color: "#fff",
              borderRadius: "16px 16px 0 0",
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

          {/* الرسائل */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: "#FAFAF7" }}>
            {messages.length === 0 && (
              <>
                <p style={{ color: "#8A8677", fontSize: 13.5, textAlign: "center", marginTop: 20, marginBottom: 16 }}>
                  اسألني عن أي شي يخص تطوير متجرك ومبيعاتك 👋
                </p>
                {QUICK_ACTIONS.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 100,
                          border: "1px solid #E4E0D3",
                          background: "#fff",
                          color: "#16233F",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: m.role === "user" ? "#E4E0D3" : "#EAF0EB",
                    color: "#16233F",
                    fontSize: 13.5,
                  }}
                >
                  {m.role === "assistant" ? formatText(m.text) : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: "end", color: "#8A8677", fontSize: 13 }}>جاري التفكير...</div>
            )}
          </div>

          {/* خانة الكتابة */}
          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #E4E0D3" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="اكتب سؤالك..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #E4E0D3",
                fontSize: 13.5,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading}
              style={{
                padding: "0 16px",
                borderRadius: 10,
                background: "#16233F",
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
