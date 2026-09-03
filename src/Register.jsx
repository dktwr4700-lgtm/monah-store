import React from "react";

const styles = `
  .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;padding:20px;font-family:'Cairo',sans-serif}.auth-card{width:100%;max-width:380px;background:#fff;border:1px solid #EDEAE0;border-radius:20px;padding:28px 24px;text-align:center}.auth-brand{font-family:'Almarai',sans-serif;font-weight:800;font-size:19px;color:#0B0B0C;margin-bottom:8px}.auth-title{font-family:'Almarai',sans-serif;font-weight:800;font-size:17px;color:#0B0B0C;margin-bottom:10px}.auth-text{font-size:12.5px;line-height:1.9;color:#625F55;margin:0 auto 18px;max-width:290px}.auth-btn{display:block;background:#0B0B0C;color:#fff;font-weight:700;font-size:13px;padding:12px;border-radius:100px;text-decoration:none}.auth-back{display:block;margin-top:14px;color:#3D4A66;font-size:12px;font-weight:700;text-decoration:none}
`;

export default function Register() {
  return (
    <div className="auth-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="auth-card">
        <div className="auth-brand">مُونة</div>
        <div className="auth-title">التسجيل بدعوة خاصة</div>
        <p className="auth-text">تُفعَّل متاجر التجار عبر رابط دعوة خاص يرسله لك صاحب المنصة. افتح الرابط الذي وصلك وحدد كلمة مرورك بنفسك.</p>
        <a className="auth-btn" href="#login">عندي حساب، تسجيل الدخول</a>
        <a className="auth-back" href="#">العودة للموقع</a>
      </main>
    </div>
  );
}
