import React, { useState, useRef, useEffect } from "react";

export default function CustomerAssistant({ productData }) {
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
          onClick={() => setOpen(true)}
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
          }}
        >
          <span>💬</span> عندك سؤال عن المنتج؟
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            insetInlineEnd: 0,
            width: "100%",
            maxWidth: 380,
            height: "min(480px, 80vh)",
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
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
            <span style={{ fontWeight: 700, fontSize: 14 }}>اسأل عن المنتج 💬</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: "#FBFAF7" }}>
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

