import React, { useState } from 'react';

export default function TestAssistant() {
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setReply('');
    try {
      const res = await fetch('/api/growth-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, storeData: {} })
      });
      const data = await res.json();
      setReply(data.reply || data.error || 'ما وصل رد');
    } catch (err) {
      setReply('صار خطأ بالاتصال');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 20, fontFamily: 'sans-serif', direction: 'rtl' }}>
      <h2>اختبار مساعد نمو المتجر</h2>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="اكتب سؤالك هنا..."
        style={{ width: '100%', minHeight: 100, padding: 10, fontSize: 15 }}
      />
      <button
        onClick={handleAsk}
        disabled={loading}
        style={{ marginTop: 10, padding: '10px 20px', background: '#16233F', color: '#fff', border: 'none', borderRadius: 8 }}
      >
        {loading ? 'جاري التفكير...' : 'اسأل المساعد'}
      </button>
      {reply && (
        <div style={{ marginTop: 20, padding: 15, background: '#F6F3EC', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {reply}
        </div>
      )}
    </div>
  );
}
