import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase.js";
import { storage } from "./firebase-storage.js";
import { onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth";
import {
  collection, addDoc, query, where, onSnapshot,
  serverTimestamp, doc, setDoc, getDoc, getDocs, writeBatch,
  deleteDoc, updateDoc, increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { QRCodeSVG } from "qrcode.react";
import Orders from "./Orders.jsx";
import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE, PRO_MONTHLY_PRICE, CUSTOM_DOMAIN_MONTHLY_PRICE, productLimitForPlan } from "./subscriptionCatalog.js";
import { useLang, LangToggle } from "./i18n.jsx";

class DebugErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
          <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, direction: "rtl", fontFamily: "Cairo, sans-serif", color: "#B24C3A", background: "#fff" }}>
            <div style={{ maxWidth: 380, textAlign: "center", border: "1px solid #F0D9D3", borderRadius: 18, padding: 24 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>تعذّر فتح لوحة التحكم الآن</strong>
              <span style={{ fontSize: 13, lineHeight: 1.8 }}>جرّب تحديث الصفحة. إذا استمرت المشكلة، تواصل مع دعم مُونَة.</span>
            </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STORE_STYLES = [
  { color: "#16233F", name: "كلاسيكي", nameEn: "Classic", hint: "هادئ ورسمي", hintEn: "Calm and formal" },
  { color: "#4B6152", name: "طبيعي", nameEn: "Natural", hint: "ناعم وقريب", hintEn: "Soft and approachable" },
  { color: "#8B3A3A", name: "جريء", nameEn: "Bold", hint: "دافئ ولافت", hintEn: "Warm and striking" },
  { color: "#5B4A8A", name: "إبداعي", nameEn: "Creative", hint: "مناسب للمحتوى", hintEn: "Great for content" },
  { color: "#B9832F", name: "ذهبي", nameEn: "Golden", hint: "أنِق وفاخر", hintEn: "Elegant and premium" },
];
const COLORS = STORE_STYLES.map((style) => style.color);
const ADMIN_EMAIL = "k1997551@gmail.com";
const MAX_PRODUCT_FILE_MB = 5120;
const STORE_TYPE_LABELS = {
  ar: { books: "كتب رقمية", videos: "فيديوهات ودورات", codes: "أكواد وتراخيص", files: "ملفات وقوالب" },
  en: { books: "Digital books", videos: "Videos & courses", codes: "Codes & licenses", files: "Files & templates" },
};

const styles = `
  .dh-page{ min-height:100vh; background:#FFFFFF; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .dh-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:#FFFFFF; border-bottom:1px solid #EDEAE0; }
  .dh-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:16px; }
  .dh-brand span{ color:#5A5648; font-weight:600; font-size:11.5px; margin-right:6px; }
  .dh-logout{ border:1px solid #EDEAE0; padding:7px 13px; border-radius:100px; font-size:11px; color:#3D4A66; background:none; font-family:'Cairo',sans-serif; cursor:pointer; }
  .dh-admin-btn{ border:1px solid #B9832F; padding:7px 13px; border-radius:100px; font-size:11px; color:#B9832F; background:none; font-family:'Cairo',sans-serif; cursor:pointer; font-weight:700; margin-left:8px; }
  .dh-lang{ border:1px solid #EDEAE0; padding:7px 11px; border-radius:100px; font-size:11px; color:#3D4A66; background:none; font-family:'Cairo',sans-serif; cursor:pointer; font-weight:800; margin-left:8px; }
  .dh-verify-banner{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; background:#FFF8E9; border-bottom:1px solid #EFD9AB; padding:11px 16px; font-size:12px; color:#7A5A17; line-height:1.7; }
  .dh-verify-banner button{ border:0; border-radius:100px; padding:7px 13px; font-size:11px; font-weight:800; background:#0B0B0C; color:#fff; font-family:'Cairo',sans-serif; cursor:pointer; white-space:nowrap; }
  .dh-verify-banner button:disabled{ opacity:.6; cursor:not-allowed; }

  .dh-tabs{ display:flex; gap:18px; padding:0 16px; overflow-x:auto; background:#FFFFFF; border-bottom:1px solid #EDEAE0; }
  .dh-tab{ white-space:nowrap; padding:0 0 11px; margin-bottom:-1px; font-size:12.5px; font-weight:700; border:0; border-bottom:2px solid transparent; background:none; color:#0B0B0C; cursor:pointer; }
  .dh-tab.active{ color:#0B0B0C; border-color:#163F2E; }
  .dh-settings-row{ display:flex; align-items:center; justify-content:space-between; padding:15px 0; border-bottom:1px solid #EDEAE0; cursor:pointer; background:none; border-left:0; border-right:0; border-top:0; width:100%; text-align:right; font-family:'Cairo',sans-serif; }
  .dh-settings-row:first-child{ padding-top:0; }
  .dh-settings-row:last-child{ border-bottom:0; }
  .dh-settings-row b{ display:block; font-size:12.5px; font-weight:700; color:#0B0B0C; margin-bottom:3px; }
  .dh-settings-row span{ font-size:10.5px; color:#5A5648; }
  .dh-settings-chev{ color:#7A766A; font-size:14px; }
  .dh-back{ display:inline-flex; align-items:center; gap:5px; border:0; background:none; color:#3D4A66; font-family:'Cairo',sans-serif; font-size:11.5px; font-weight:700; cursor:pointer; padding:0; margin-bottom:16px; }
  .dh-flag{ position:relative; padding:12px 0 12px 4px; padding-right:14px; margin-bottom:16px; border-right:3px solid #9C6D1F; }
  .dh-flag b{ display:block; font-size:12.5px; font-weight:700; margin-bottom:3px; }
  .dh-flag span{ font-size:11px; color:#5A5648; line-height:1.7; }
  .dh-flag a{ display:inline-block; margin-top:6px; font-size:11px; font-weight:800; color:#9C6D1F; text-decoration:underline; cursor:pointer; background:none; border:0; padding:0; font-family:'Cairo',sans-serif; }

  .dh-wrap{ padding:18px; max-width:560px; margin:0 auto; }

  .dh-stats{ display:flex; gap:1px; background:#EDEAE0; border-radius:16px; overflow:hidden; margin-bottom:16px; }

  .dh-next{ position:relative; overflow:hidden; background:linear-gradient(150deg, #163F2E, #0E3B2C 60%, #0A2E22); border-radius:20px; padding:22px 20px; margin-bottom:16px; color:#fff; }
  .dh-next-badge{ display:inline-flex; align-items:center; gap:6px; background:rgba(244,241,232,0.1); color:#D6F35C; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; margin-bottom:14px; }
  .dh-next-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:16px; line-height:1.6; margin-bottom:8px; }
  .dh-next-text{ color:rgba(244,241,232,0.72); font-size:12.5px; line-height:1.8; max-width:280px; margin-bottom:16px; }
  .dh-next-bar{ height:6px; background:rgba(244,241,232,0.12); border-radius:100px; overflow:hidden; margin-bottom:6px; }
  .dh-next-bar-fill{ height:100%; background:#D6F35C; border-radius:100px; }
  .dh-next-step{ color:rgba(244,241,232,0.55); font-size:11px; margin-bottom:16px; }
  .dh-next-btn{ display:inline-flex; align-items:center; gap:6px; background:#fff; color:#0B0B0C; border:none; padding:11px 18px; border-radius:100px; font-weight:700; font-size:13px; cursor:pointer; }

  .dh-quick{ display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
  .dh-quick-btn{ flex:1; min-width:130px; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:14px; padding:14px; text-align:center; font-size:12px; font-weight:700; color:#0B0B0C; cursor:pointer; }
  .dh-quick-btn:hover{ background:#FBFAF7; }

  .dh-studio{ position:relative; overflow:hidden; border-radius:22px; padding:20px; margin-bottom:16px; color:#fff; background:linear-gradient(135deg,var(--studio-color,#163F2E),#10281E); box-shadow:0 16px 30px rgba(15,51,37,.15); }
  .dh-studio::after{ content:""; position:absolute; width:180px; height:180px; border:1px solid rgba(255,255,255,.16); border-radius:50%; left:-70px; top:-92px; }
  .dh-studio-kicker{ position:relative; z-index:1; display:inline-flex; padding:5px 10px; border-radius:100px; background:rgba(255,255,255,.12); color:#D6F35C; font-size:10px; font-weight:800; }
  .dh-studio-head{ position:relative; z-index:1; display:flex; align-items:center; gap:12px; margin-top:13px; }.dh-studio-logo{ width:52px; height:52px; flex:0 0 52px; border-radius:16px; background:#fff; color:var(--studio-color,#163F2E); overflow:hidden; display:flex; align-items:center; justify-content:center; font-family:'Almarai',sans-serif; font-size:18px; font-weight:800; box-shadow:0 8px 16px rgba(0,0,0,.18); }.dh-studio-logo img{width:100%;height:100%;object-fit:cover}.dh-studio-name{font-family:'Almarai',sans-serif;font-size:16px;font-weight:800}.dh-studio-tag{font-size:11px;line-height:1.6;color:rgba(255,255,255,.7);margin-top:4px;max-width:300px}.dh-studio-meta{font-size:10px;color:rgba(255,255,255,.65);margin-top:5px}
  .dh-studio-actions{ position:relative; z-index:1; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:18px; }.dh-studio-action{ min-height:56px; border:1px solid rgba(255,255,255,.13); border-radius:13px; background:rgba(255,255,255,.1); color:#fff; padding:8px 6px; font-family:'Cairo',sans-serif; font-size:10.5px; font-weight:700; cursor:pointer; text-decoration:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; }.dh-studio-action span{font-size:16px;line-height:1}.dh-studio-action.primary{background:#D6F35C;color:#143226;border-color:#D6F35C}
  .dh-share-card{ background:#fff; border:1px solid #EDEAE0; border-radius:17px; padding:16px; margin-bottom:14px; }.dh-share-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.dh-share-title{font-family:'Almarai',sans-serif;font-size:13px;font-weight:800}.dh-share-sub{font-size:10.5px;color:#5A5648;line-height:1.7}.dh-share-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.dh-share-btn{border:1px solid #EDEAE0;background:#FBFAF7;border-radius:12px;padding:10px 6px;color:#22372C;font-family:'Cairo',sans-serif;font-size:10.5px;font-weight:800;cursor:pointer;text-decoration:none;text-align:center}.dh-share-btn.primary{background:#0E3B2C;color:#fff;border-color:#0E3B2C}
  .dh-qr{background:#fff;border:1px solid #EDEAE0;border-radius:17px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:14px}.dh-qr-code{width:86px;height:86px;background:#fff;border:1px solid #EDEAE0;border-radius:12px;padding:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.dh-qr-title{font-family:'Almarai',sans-serif;font-size:13px;font-weight:800}.dh-qr-sub{font-size:10.5px;color:#4A564C;line-height:1.75;margin-top:6px}.dh-qr-actions{display:flex;gap:7px;margin-top:10px}.dh-mini-btn{border:1px solid #EDEAE0;background:#FBFAF7;border-radius:100px;padding:7px 10px;font-family:'Cairo',sans-serif;color:#163F2E;font-weight:800;font-size:10px;cursor:pointer}
  .dh-product-health{background:#fff;border:1px solid #EDEAE0;border-radius:17px;padding:16px;margin-bottom:14px}.dh-health-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}.dh-health-number{border-radius:12px;background:#F4F7F2;padding:11px}.dh-health-number b{display:block;font-family:'JetBrains Mono',monospace;font-size:18px;color:#163F2E}.dh-health-number span{font-size:10px;color:#4A564C}.dh-health-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px dashed #EDEAE0}.dh-health-name{font-size:11.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}.dh-health-state{font-size:9.5px;font-weight:800;border-radius:100px;padding:4px 8px}.dh-health-state.live{background:#EAF0EB;color:#37724B}.dh-health-state.hidden{background:#F3EBDD;color:#9C6D1F}.dh-health-manage{border:0;background:none;color:#163F2E;font-family:'Cairo',sans-serif;font-size:10.5px;font-weight:800;cursor:pointer;padding:4px}
  .dh-featured-tag{display:inline-flex;background:#F3EBDD;color:#9C6D1F;border-radius:100px;padding:3px 7px;font-size:9px;font-weight:800;margin-right:6px}.dh-sort-actions{display:flex;gap:5px;margin-top:8px}.dh-sort-btn{border:1px solid #EDEAE0;background:#FBFAF7;border-radius:9px;padding:6px 8px;font-family:'Cairo',sans-serif;font-size:10px;font-weight:800;color:#163F2E;cursor:pointer}

  .pv-overlay{ position:fixed; inset:0; background:rgba(11,11,12,0.55); z-index:100; display:flex; align-items:flex-end; justify-content:center; }
  .pv-sheet{ background:#FFFFFF; width:100%; max-width:460px; max-height:90vh; overflow-y:auto; border-radius:22px 22px 0 0; position:relative; }
  .pv-close{ position:sticky; top:0; z-index:2; display:flex; justify-content:space-between; align-items:center; background:#FFFFFF; padding:14px 18px; border-bottom:1px solid #EDEAE0; }
  .pv-close-label{ font-family:'Almarai', sans-serif; font-weight:800; font-size:13px; color:#0B0B0C; }
  .pv-close-btn{ background:#F1F0EA; border:none; width:30px; height:30px; border-radius:50%; color:#0B0B0C; font-size:14px; cursor:pointer; }
  .pv-body{ padding:20px; }
  .pv-cover{ height:150px; border-radius:16px; background:linear-gradient(135deg, #0E3B2C, #1C4632); display:flex; align-items:center; justify-content:center; margin-bottom:18px; overflow:hidden; }
  .pv-cover img{ width:100%; height:100%; object-fit:cover; }
  .pv-cat{ display:inline-flex; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; margin-bottom:12px; }
  .pv-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#0B0B0C; margin-bottom:14px; }
  .pv-card{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; overflow:hidden; margin-bottom:14px; }
  .pv-price-row{ display:flex; justify-content:space-between; padding:16px 18px; border-bottom:1px dashed #EDEAE0; }
  .pv-desc{ padding:16px 18px; color:#3D4A66; font-size:13px; line-height:1.9; }
  .pv-btn{ width:100%; background:#0B0B0C; color:#fff; border:none; padding:15px; border-radius:100px; font-weight:700; font-size:13.5px; text-align:center; }
  .pv-note{ text-align:center; color:#7A766A; font-size:11px; margin-top:14px; }
  .dh-stat{ flex:1; background:#0E3B2C; padding:16px 10px; text-align:center; }
  .dh-stat:nth-child(2){ background:#163F2E; }
  .dh-stat:nth-child(3){ background:#0A2E22; }
  .dh-stat b{ display:block; font-family:'JetBrains Mono',monospace; font-weight:700; color:#fff; font-size:18px; }
  .dh-stat span{ display:block; color:#B9C9BC; font-size:11px; margin-top:4px; }

  .dh-figures{ display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:16px; margin-bottom:16px; border-bottom:1px solid #EDEAE0; }
  .dh-figure-main b{ display:block; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:24px; color:#0B0B0C; line-height:1; }
  .dh-figure-main span{ display:block; font-size:10.5px; color:#5A5648; margin-top:6px; }
  .dh-figure-side{ display:flex; gap:16px; text-align:left; }
  .dh-figure-side div b{ display:block; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:14px; color:#0B0B0C; }
  .dh-figure-side div span{ display:block; font-size:9.5px; color:#7A766A; margin-top:3px; }

  .dh-quicklinks{ font-size:11.5px; color:#163F2E; margin-bottom:16px; line-height:2.3; }
  .dh-quicklinks button{ background:none; border:0; padding:0; color:#163F2E; font-weight:700; font-family:'Cairo',sans-serif; font-size:11.5px; cursor:pointer; }
  .dh-quicklinks span{ color:#D7D2C4; margin:0 8px; }

  .dh-store-link{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:14px; padding:14px 16px; margin-bottom:14px; }
  .dh-store-label{ color:#5A5648; font-size:10.5px; margin-bottom:7px; font-weight:600; }
  .dh-store-row{ display:flex; align-items:center; gap:8px; }
  .dh-store-url{ flex:1; color:#0B0B0C; font-size:11.5px; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dh-copy{ background:#0B0B0C; color:#fff; border:none; padding:7px 12px; border-radius:100px; font-size:10.5px; font-weight:700; white-space:nowrap; cursor:pointer; }

  .dh-card{ background:#FFFFFF; border-radius:16px; padding:18px; margin-bottom:14px; border:1px solid #EDEAE0; }
  .dh-title-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .dh-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14.5px; color:#0B0B0C; }
  .dh-title-count{ font-family:'JetBrains Mono',monospace; color:#5A5648; font-size:11px; }

  .dh-field{ margin-bottom:12px; }
  .dh-field label{ display:block; font-size:12.5px; color:#403D35; margin-bottom:6px; font-weight:600; }
  .dh-field input:not([type="checkbox"]):not([type="radio"]), .dh-field textarea, .dh-field select{ width:100%; padding:11px 13px; border:1px solid #EDEAE0; border-radius:10px; font-size:13px; background:#FBFAF7; font-family:'Cairo', sans-serif; box-sizing:border-box; }
  .dh-field input[type="checkbox"], .dh-field input[type="radio"]{ width:16px; height:16px; flex-shrink:0; }
  .dh-hint{ color:#403D35; font-size:12px; margin-top:6px; line-height:1.7; }
  .dh-btn{ width:100%; background:#0B0B0C; color:#fff; border:none; padding:13px; border-radius:100px; font-weight:700; font-size:13px; cursor:pointer; }
  .dh-btn:disabled{ opacity:.6; }
  .dh-type-toggle{ display:flex; gap:8px; }
  .dh-type-btn{ flex:1; padding:11px; border:1px solid #EDEAE0; background:#FBFAF7; border-radius:10px; font-size:12.5px; font-weight:700; color:#3D4A66; cursor:pointer; }
  .dh-type-btn.active{ background:#0B0B0C; color:#fff; border-color:#0B0B0C; }
  .dh-item-stock{ color:#5A5648; font-size:11px; margin-bottom:8px; }
  .dh-images-row{ display:flex; gap:10px; }
  .dh-image-thumb-wrap{ position:relative; width:64px; height:64px; }
  .dh-image-thumb{ width:64px; height:64px; border-radius:12px; object-fit:cover; display:block; }
  .dh-image-remove{ position:absolute; top:-6px; left:-6px; width:20px; height:20px; border-radius:50%; background:#B24C3A; color:#fff; border:2px solid #FFFFFF; font-size:10px; line-height:1; cursor:pointer; }
  .dh-image-add{ width:64px; height:64px; border-radius:12px; border:1.5px dashed #EDEAE0; background:#FBFAF7; display:flex; align-items:center; justify-content:center; font-size:22px; color:#5A5648; cursor:pointer; flex-shrink:0; }
  .dh-item-actions{ display:flex; gap:8px; margin-top:8px; }
  .dh-item-action{ flex:1; text-align:center; padding:8px; border-radius:100px; font-size:11px; font-weight:700; border:1px solid #EDEAE0; background:#FBFAF7; color:#3D4A66; cursor:pointer; }
  .dh-item-action.primary{ background:#0B0B0C; color:#fff; border-color:#0B0B0C; }
  .dh-item-action.danger{ color:#B24C3A; border-color:#F0D9D3; }
  .dh-item-action:disabled{ opacity:.6; }
  .dh-edit-form .dh-field{ margin-bottom:10px; }
  .dh-edit-actions{ display:flex; gap:8px; margin-top:4px; }
  .dh-error{ background:#F6E9E5; color:#B24C3A; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:12px; }
  .dh-success{ background:#EAF0EB; color:#4B6152; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:12px; }
  .dh-toast{ position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#163F2E; color:#fff; padding:12px 22px; border-radius:100px; font-size:13px; font-weight:700; box-shadow:0 10px 26px rgba(22,63,46,.35); z-index:9999; animation:dh-toast-in .2s ease-out; }
  @keyframes dh-toast-in{ from{ opacity:0; transform:translateX(-50%) translateY(10px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }
  .dh-file-picked{ background:#EAF0EB; color:#4B6152; font-size:11.5px; padding:9px 12px; border-radius:10px; margin-top:8px; }
  .dh-section{background:#FFFFFF;border:1px solid #EDEAE0;border-radius:16px;margin-bottom:14px;overflow:hidden}.dh-section>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;cursor:pointer}.dh-section>summary::-webkit-details-marker{display:none}.dh-section>summary::after{content:'⌄';font-size:19px;line-height:1;color:#5A5648;transition:transform .18s ease-out}.dh-section[open]>summary{border-bottom:1px solid #EDEAE0}.dh-section[open]>summary::after{transform:rotate(180deg)}.dh-section-body{padding:16px 18px 18px}.dh-section-summary{min-width:0}.dh-section-summary b{display:block;font-family:'Almarai',sans-serif;font-size:14px;color:#0B0B0C}.dh-section-summary span{display:block;margin-top:4px;font-size:10.5px;line-height:1.6;color:#5A5648}
  .dh-ai-draft{margin-top:9px;border:1px solid #D6E5D8;background:#F5F9F4;border-radius:12px;padding:12px}.dh-ai-draft-title{font-size:11px;font-weight:800;color:#163F2E;margin-bottom:6px}.dh-ai-draft p{font-size:12px;line-height:1.9;color:#3D4A66;margin:0;white-space:pre-line}.dh-ai-actions{display:flex;gap:8px;margin-top:10px}.dh-ai-btn{border:1px solid #C9DBC9;background:#fff;color:#163F2E;border-radius:100px;padding:8px 11px;font-family:'Cairo',sans-serif;font-size:10.5px;font-weight:800;cursor:pointer}.dh-ai-btn.primary{background:#163F2E;border-color:#163F2E;color:#fff}

  .dh-item{ padding:12px 0; border-top:1px dashed #EDEAE0; }
  .dh-item:first-child{ border-top:none; }
  .dh-item-top{ display:flex; justify-content:space-between; margin-bottom:8px; }
  .dh-item-name{ font-weight:700; color:#0B0B0C; font-size:13px; }
  .dh-item-price{ color:#B9832F; font-weight:700; font-size:12.5px; font-family:'JetBrains Mono',monospace; }
  .dh-item-link{ display:flex; gap:8px; align-items:center; background:#FBFAF7; border:1px solid #EDEAE0; border-radius:8px; padding:7px 9px; }
  .dh-item-link-text{ flex:1; font-size:10px; color:#5A5648; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dh-item-link-btn{ background:#0B0B0C; color:#fff; border:none; padding:5px 10px; border-radius:100px; font-size:10px; cursor:pointer; }
  .empty-note{ color:#5A5648; font-size:13px; text-align:center; padding:32px 16px; background:#FBFAF7; border:1px dashed #EDEAE0; border-radius:14px; line-height:1.8; }

  .ds-preview{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; overflow:hidden; margin-bottom:16px; }
  .ds-preview-bar{ padding:10px 14px; background:#FBFAF7; border-bottom:1px solid #EDEAE0; font-size:10px; color:#5A5648; font-weight:700; font-family:'JetBrains Mono',monospace; }
  .ds-preview-body{ padding:22px 18px; text-align:center; }
  .ds-preview-logo{ width:52px; height:52px; border-radius:16px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; font-family:'Almarai',sans-serif; font-weight:800; color:#fff; font-size:20px; }
  .ds-preview-logo-img{ width:52px; height:52px; border-radius:16px; margin:0 auto 10px; display:block; object-fit:cover; }
  .ds-preview-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:14px; margin-bottom:4px; }
  .ds-preview-tag{ font-size:11px; color:#5A5648; }
  .dh-logo-row{ display:flex; align-items:center; gap:12px; }
  .dh-logo-thumb{ width:52px; height:52px; border-radius:14px; object-fit:cover; flex-shrink:0; }
  .dh-logo-placeholder{ width:52px; height:52px; border-radius:14px; background:#FBFAF7; border:1.5px dashed #EDEAE0; display:flex; align-items:center; justify-content:center; color:#5A5648; font-family:'Almarai',sans-serif; font-weight:800; flex-shrink:0; }
  .dh-logo-btn{ border:1px solid #EDEAE0; background:#FFFFFF; padding:9px 14px; border-radius:100px; font-size:11.5px; font-weight:700; color:#0B0B0C; cursor:pointer; }
  .ds-swatches{ display:flex; gap:10px; margin-bottom:16px; }
  .ds-swatch{ width:38px; height:38px; border-radius:12px; position:relative; border:2px solid transparent; cursor:pointer; }
  .ds-swatch.selected{ border-color:#0B0B0C; }
  .ds-swatch.selected::after{ content:"✓"; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; }

  .ds-cover-preview{ height:80px; position:relative; overflow:hidden; }
  .ds-cover-preview img{ width:100%; height:100%; object-fit:cover; display:block; }
  .ds-preview-body{ position:relative; margin-top:-30px; }
  .ds-cover-row{ display:flex; align-items:center; gap:12px; }
  .ds-cover-thumb{ width:80px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; }
  .ds-cover-placeholder{ width:80px; height:44px; border-radius:10px; background:#FBFAF7; border:1.5px dashed #EDEAE0; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#7A766A; font-size:10px; }
  .ds-faq{border:1px solid #EDEAE0;background:#FBFAF7;border-radius:13px;padding:12px;margin-bottom:9px}.ds-faq input,.ds-faq textarea{background:#fff}.ds-faq-actions{display:flex;justify-content:space-between;align-items:center;margin-top:7px}.ds-remove{border:0;background:none;color:#B24C3A;font-family:'Cairo',sans-serif;font-size:10px;font-weight:800;cursor:pointer}.ds-add{width:100%;border:1.5px dashed #C9C3B7;background:#fff;border-radius:11px;padding:10px;color:#163F2E;font-family:'Cairo',sans-serif;font-size:11px;font-weight:800;cursor:pointer}

  .ds-view-btn{ display:inline-flex; align-items:center; gap:6px; color:#0B0B0C; font-size:11.5px; font-weight:700; text-decoration:none; border:1px solid #EDEAE0; padding:8px 14px; border-radius:100px; background:#FFFFFF; }

  .ds-save-bar{ position:sticky; bottom:0; background:#FFFFFF; border-top:1px solid #EDEAE0; padding:12px 18px; margin:0 -18px; display:flex; align-items:center; gap:12px; }
  .ds-save-status{ flex:1; font-size:11.5px; color:#5A5648; }
  .ds-save-status.unsaved{ color:#B9832F; font-weight:700; }
  .ds-save-btn{ background:#0B0B0C; color:#fff; border:none; padding:11px 22px; border-radius:100px; font-weight:700; font-size:13px; cursor:pointer; white-space:nowrap; }
  .ds-save-btn:disabled{ opacity:.6; }

  .pk-card{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; padding:18px; margin-bottom:12px; position:relative; }
  .pk-card.current{ border:2px solid #0B0B0C; }
  .pk-badge{ position:absolute; top:-9px; right:16px; background:#B9832F; color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:100px; }
  .pk-name{ font-family:'Almarai',sans-serif; font-weight:800; color:#0B0B0C; font-size:14px; margin-bottom:4px; }
  .pk-price{ font-family:'JetBrains Mono',monospace; font-weight:700; color:#0B0B0C; font-size:20px; margin-bottom:10px; }
  .pk-price span{ font-size:11px; color:#5A5648; font-family:'Cairo',sans-serif; }
  .pk-features div{ font-size:12px; color:#3D4A66; padding:3px 0; }
  .pk-current-tag{ display:inline-block; margin-top:10px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; }

  .cp-item{ padding:12px 0; border-top:1px dashed #EDEAE0; }
  .cp-item:first-child{ border-top:none; }
  .cp-item-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .cp-code{ font-family:'JetBrains Mono',monospace; font-weight:800; color:#0B0B0C; font-size:14px; letter-spacing:.02em; }
  .cp-percent{ background:#F3EBDD; color:#B9832F; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; }
  .cp-scope{ color:#5A5648; font-size:11px; margin-bottom:8px; }

  /* استجابة فورية للضغط — نفس مبدأ apple-design */
  .dh-page button{ transition:transform 100ms ease-out; }
  .dh-page button:active{ transform:scale(0.96); }

  /* بطاقات المنتجات: تُقرأ بسهولة حتى على شاشة الجوال الضيقة */
  .dh-item{ padding:16px 0; }
  .dh-item-top{ align-items:flex-start; gap:12px; margin-bottom:9px; }
  .dh-item-name{ min-width:0; font-size:14px; font-weight:800; line-height:1.65; }
  .dh-item-price{ flex-shrink:0; color:#9C6D1F; font-weight:800; padding-top:2px; }
  .dh-item-link{ gap:10px; min-width:0; border-radius:12px; padding:9px 10px; }
  .dh-item-link-text{ min-width:0; display:flex; flex:1; flex-direction:column; gap:2px; color:#403D35; overflow:hidden; }
  .dh-item-link-label{ color:#22372C; font-family:'Cairo',sans-serif; font-size:10px; font-weight:800; }
  .dh-item-link-code{ overflow:hidden; color:#403D35; direction:ltr; font-family:'JetBrains Mono',monospace; font-size:9.5px; text-align:right; text-overflow:ellipsis; white-space:nowrap; }
  .dh-item-link-btn{ flex-shrink:0; min-height:34px; border-radius:10px; padding:6px 11px; font-family:'Cairo',sans-serif; font-weight:800; }
  .dh-item-actions{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:10px; }
  .dh-item-action{ min-width:0; min-height:40px; display:flex; align-items:center; justify-content:center; border-radius:12px; padding:8px 10px; font-weight:800; line-height:1.45; }
  .dh-sort-actions{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:8px; }
  .dh-sort-btn{ min-height:36px; border-radius:10px; font-size:10.5px; }

  /* ترتيب موحد للجوال الضيق في كل تبويبات لوحة التاجر */
  .dh-field label,.dh-section-summary span,.dh-title-count,.dh-store-label,.dh-share-sub,.dh-qr-sub,.dh-health-number span,.ds-preview-bar,.ds-preview-tag,.ds-save-status,.cp-scope{ color:#403D35; }
  .dh-next-text{ color:rgba(244,241,232,.86); }
  .dh-next-step{ color:rgba(244,241,232,.76); }
  .dh-studio-tag{ color:rgba(255,255,255,.86); }
  .dh-studio-meta{ color:rgba(255,255,255,.78); }
  .dh-stat span{ color:#D5E2D6; }
  @media (max-width:480px){
    .dh-header{ align-items:flex-start; gap:10px; padding:13px 14px; }
    .dh-header>div:last-child{ flex-shrink:0; gap:6px !important; }
    .dh-brand{ min-width:0; font-size:14px; line-height:1.55; }
    .dh-brand span{ display:block; margin:1px 0 0; font-size:10px; }
    .dh-logout,.dh-admin-btn{ min-height:34px; padding:7px 9px; font-size:10px; margin-left:0; }
    .dh-tabs{ gap:7px; padding:10px 14px 0; scroll-padding-inline:14px; }
    .dh-tab{ padding:8px 12px; font-size:11px; }
    .dh-wrap{ padding:14px; }
    .dh-studio{ padding:17px; }
    .dh-studio-head{ align-items:flex-start; }
    .dh-studio-name{ font-size:15px; line-height:1.5; }
    .dh-studio-tag{ font-size:10.5px; }
    .dh-studio-actions,.dh-share-actions{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .dh-studio-action{ min-height:42px; padding:8px; }
    .dh-studio-action.primary,.dh-share-btn.primary{ grid-column:1/-1; min-height:42px; }
    .dh-studio-action.primary{ flex-direction:row; gap:6px; }
    .dh-studio-action span{ font-size:14px; }
    .dh-quick{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .dh-quick-btn{ min-width:0; padding:12px 8px; font-size:11px; }
    .dh-share-head,.dh-title-row{ align-items:flex-start; }
    .dh-share-head>div,.dh-title-row>div:first-child{ min-width:0; }
    .dh-qr{ align-items:flex-start; gap:10px; padding:14px; }
    .dh-qr-code{ width:74px; height:74px; padding:5px; }
    .dh-qr>div:last-child{ min-width:0; flex:1; }
    .dh-qr-actions{ flex-wrap:wrap; margin-top:8px; }
    .dh-mini-btn{ min-height:34px; padding:7px 10px; }
    .dh-health-name{ min-width:0; max-width:none; flex:1; font-size:11px; }
    .dh-health-state{ flex-shrink:0; }
    .dh-store-link,.dh-card{ padding:14px; }
    .dh-store-row{ min-width:0; }
    .dh-store-url{ font-size:10px; }
    .dh-copy{ min-height:34px; padding:7px 10px; }
    .dh-section>summary{ gap:10px; padding:15px 14px; }
    .dh-section-body{ padding:14px; }
    .dh-section-summary b{ font-size:13.5px; }
    .dh-field input:not([type="checkbox"]):not([type="radio"]),.dh-field textarea,.dh-field select{ min-height:44px; font-size:14px; }
    .dh-type-toggle,.dh-ai-actions,.dh-edit-actions{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .dh-ai-btn{ min-height:38px; padding:8px 9px; }
    .dh-item-top{ gap:8px; }
    .ds-preview-bar{ gap:8px; }
    .ds-preview-bar>span{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ds-view-btn{ flex-shrink:0; }
    .ds-cover-row,.dh-logo-row{ flex-wrap:wrap; }
    .dh-logo-btn{ min-height:40px; }
    .ds-swatches{ flex-wrap:wrap; gap:8px; margin-bottom:8px; }
    .ds-save-bar{ align-items:stretch; flex-direction:column; gap:8px; padding:10px 14px; margin:0 -14px; }
    .ds-save-btn{ width:100%; min-height:44px; }
    .dh-subscription-base{ align-items:flex-start !important; flex-direction:column; gap:10px !important; padding:14px !important; }
    .dh-subscription-base>.mono{ align-self:flex-start; }
    .dh-subscription-ready{ flex-shrink:0; }
  }
`;

const DASH_T = {
  ar: {
    fileTooLarge: (mb) => `حجم الملف أكبر من ${mb} ميجا. تواصل معنا لو تحتاج رفع ملف أكبر.`,
    writeNameForDraft: "اكتب اسم المنتج أولًا، ثم اطلب المسودة.",
    loginRetry: "سجّل دخولك ثم حاول مرة ثانية.",
    draftError: "تعذر تجهيز المسودة الآن. حاول بعد قليل.",
    adDraftError: "تعذر تجهيز نص الإعلان الآن. حاول بعد قليل.",
    copyDraftError: "تعذر نسخ المسودة. انسخها يدويًا.",
    trialLimitError: "التجربة المجانية تسمح بمنتج واحد فقط. رقّي اشتراكك لإضافة المزيد.",
    planLimitError: (limit) => `وصلت الحد الأقصى (${limit} منتج) لباقتك الحالية. رقّي اشتراكك لإضافة المزيد.`,
    nameAndPriceRequired: "اكتب اسم المنتج وسعرًا صحيحًا أو اكتب 0 للمنتج المجاني.",
    freeOnlyFiles: "المنتج المجاني حاليًا متاح للملفات فقط.",
    fillNamePriceFile: "عبّي اسم المنتج والسعر واختر ملف المنتج.",
    fillNamePriceCodes: "عبّي اسم المنتج والسعر، وألصقي الأكواد (كود بكل سطر).",
    genericTryAgain: "صار خطأ، حاول مرة ثانية.",
    editNameAndPriceRequired: "عبّي اسم المنتج وسعرًا صحيحًا أو اكتب 0 للمنتج المجاني.",
    saveEditError: "تعذر حفظ التعديل، حاول مرة ثانية.",
    pasteOneCode: "الصقي كود واحد على الأقل.",
    addCodesError: "تعذر إضافة الأكواد، حاول مرة ثانية.",
    deleteProductError: "تعذر حذف المنتج، حاول مرة ثانية.",
    toggleHiddenError: "تعذر تحديث حالة المنتج، حاول مرة ثانية.",
    toggleFeaturedError: "تعذر تثبيت المنتج الآن، حاول مرة ثانية.",
    reorderError: "تعذر ترتيب المنتجات الآن، حاول مرة ثانية.",
    bundleNamePriceRequired: "اكتب اسم الحزمة وسعرًا صحيحًا أكبر من صفر.",
    bundleTwoProducts: "اختر منتجين على الأقل داخل الحزمة.",
    saveBundleError: "تعذر حفظ الحزمة، حاول مرة ثانية.",
    bundleUnarchived: "تم إخراج الحزمة من الأرشيف. ستجدها ضمن الحزم المحفوظة.",
    bundleArchived: "تم نقل الحزمة للأرشيف. ستجدها ضمن الحزم المؤرشفة.",
    bundleArchiveError: "تعذر تحديث حالة الحزمة، حاول مرة ثانية.",
    bundlePublished: "الحزمة صارت منشورة، وعملاؤك يقدرون يطلبونها من رابطها.",
    bundleUnpublished: "تم إخفاء الحزمة عن الزوار. رابطها ما يفتح لحد تنشرها ثانية.",
    bundlePublishError: "تعذر تحديث حالة النشر، حاول مرة ثانية.",
    copyBundleLinkError: "تعذر نسخ الرابط. انسخه يدويًا من شريط العنوان.",
    bundleDeleted: "تم حذف الحزمة فقط. منتجاتك بقيت كما هي.",
    deleteBundleError: "تعذر حذف الحزمة، حاول مرة ثانية.",
    maxTwoImages: "حد أقصى صورتين لكل منتج.",
    maxTwoImagesPartial: "حد أقصى صورتين لكل منتج — رفعنا أول صورتين بس.",
    invalidImageFiles: "اختر ملفات صور صالحة.",
    imageTooLargeSkipped: "حجم إحدى الصور أكبر من 5 ميجا، تجاوزناها.",
    uploadImageError: "تعذر رفع إحدى الصور، حاول مرة ثانية.",
    invalidImageFile: "اختر ملف صورة صالحًا.",
    imageTooLargeSingle: "حجم الصورة أكبر من 5 ميجا، اختاري صورة أصغر.",
    uploadPhotoError: "تعذر رفع الصورة، حاول مرة ثانية.",
    writeStoreNameBeforeSave: "اكتب اسم متجرك قبل الحفظ.",
    slugMinLength: "اكتب رابطًا من 3 أحرف إنجليزية أو أرقام على الأقل.",
    invalidContactEmail: "إيميل التواصل غير صحيح، تأكد منه أو اتركه فاضي.",
    slugTaken: "هذا الرابط مستخدم من متجر ثاني، جربي رابط مختلف.",
    designSavedToast: "تم حفظ تصميم متجرك ✓",
    saveDesignError: "تعذر حفظ التصميم، حاول مرة ثانية.",
    writeCouponCode: "اكتب كود الخصم.",
    couponPercentRange: "نسبة الخصم لازم تكون بين 1 و 90.",
    couponCodeExists: "عندك كود بنفس الاسم من قبل، اختر اسم ثاني.",
    saveSettingError: "تعذر حفظ الإعداد الآن.",
    savedShort: "تم الحفظ.",
    writePaymentInstructions: "اكتب تعليمات التحويل بوضوح قبل الحفظ.",
    savePaymentError: "تعذر حفظ التعليمات الآن.",
    paymentInstructionsSaved: "تم حفظ تعليمات التحويل. تظهر للمشتري بعد بدء الطلب فقط.",
    paymentInstructionsSavedToast: "تم حفظ تعليمات التحويل ✓",
    gatewayKeysRequired: "اكتب مفتاح API وسر API صحيحين من حسابك في OmPay قبل الحفظ.",
    connectGatewayError: "تعذر ربط بوابة الدفع الآن.",
    gatewayConnectedMsg: "تم الربط. عملاؤك الآن يقدرون يدفعون بالبطاقة مباشرة لحسابك.",
    disconnectGatewayError: "تعذر إلغاء الربط الآن.",
    gatewayDisconnectedMsg: "تم إلغاء الربط. العملاء الآن يحوّلون يدويًا فقط.",
    genericOperationError: "تعذر تنفيذ العملية الآن.",
    domainNameMinLength: "اكتب اسمًا من 3 أحرف إنجليزية أو أرقام على الأقل.",
    domainAvailableMsg: "متاح! تقدر تكمل الشراء.",
    domainTakenMsg: "هذا الاسم محجوز.",
    domainCheckError: "تعذر التحقق الآن.",
    paymentPrepError: "تعذر تجهيز صفحة الدفع الآن.",
    couponScopeAll: "على كل منتجاتك",
    couponScopeProduct: (name) => `على منتج: ${name}`,
    couponScopeDeleted: "على منتج محذوف",
    selectProductFirst: "اختر المنتج أولًا.",
    linkNameLength: "اكتب اسمًا للرابط بين حرفين و60 حرفًا.",
    trackingLinkCreated: "تم إنشاء رابط التتبع. انسخه وشاركه في المكان الذي اخترته.",
    createTrackingLinkError: "تعذر إنشاء رابط التتبع، حاول مرة ثانية.",
    copyLinkErrorAlt: "تعذر نسخ الرابط. انسخه من شريط المتصفح.",
    deleteTrackingLinkError: "تعذر حذف رابط التتبع، حاول مرة ثانية.",
    myStore: "متجري",
    browseProductsText: (name) => `تصفح منتجات ${name}`,
    shareError: "تعذرت المشاركة الآن، جرب نسخ الرابط.",
    showBundlesError: "تعذر عرض الحزم المحفوظة الآن.",
    showCampaignLinksError: "تعذر عرض روابط التتبع الآن.",
    copySuffix: " (نسخة)",
    initialFallback: "م",
    mbUnit: "م.ب",
    whatsappShareText: (name, url) => `تصفح منتجات ${name}: ${url}`,

    pendingPaymentTitle: "عندك عملية دفع لسه ما تأكدت",
    pendingPaymentText: "حسابك بدأ فتح متجر ودفع، بس ما تأكدنا من نجاح الدفع بعد. اضغط تحقق قبل لا تجرب تدفع مرة ثانية — تجنبًا لأي خصم مكرر.",
    checkPaymentStatus: "تحقق من حالة دفعتي",
    storeSetupIncompleteTitle: "ما أكملت فتح متجرك بعد",
    storeSetupIncompleteText: "هذا الحساب ما عنده اشتراك مفعّل. لو كنت بدأت تفتح متجرًا وما أكملت الدفع، تقدر تكمل من هنا.",
    continueStoreSetup: "أكمل فتح متجرك",
    logoutCta: "تسجيل الخروج",

    yourStore: "متجرك",
    sellerDashboard: "لوحة التاجر",
    genericProducts: "منتجات رقمية",
    adminPanel: "لوحة الأدمن",
    logoutBtn: "تسجيل خروج",
    verificationResent: "أرسلنا رابط تأكيد جديد لبريدك. افتح بريدك واضغط الرابط.",
    emailNotVerified: "بريدك الإلكتروني غير مؤكد بعد. تأكيد بريدك يضمن وصولك لحسابك لو نسيت كلمة المرور.",
    sendingEllipsis: "جاري الإرسال...",
    resend: "إعادة الإرسال",
    sendVerificationLink: "إرسال رابط التأكيد",
    subscriptionExpired: "انتهى اشتراك متجرك. جدده الآن حتى يرجع يستقبل طلبات.",
    subscriptionExpiringSoon: (days) => `اشتراك متجرك بينتهي خلال ${days} يوم. جدده الآن بدون انقطاع.`,
    preparingPayment: "جاري تجهيز الدفع...",
    renewNow: "جدّد الاشتراك الآن",
    trialUsedUp: "أنت على التجربة المجانية واستخدمت منتجك الوحيد. رقّي اشتراكك لإضافة منتجات بلا حدود.",
    trialActive: "أنت على التجربة المجانية — منتج واحد مجانًا بدون بطاقة.",
    upgradeSubscription: "رقّي اشتراكك",
    homeTab: "الرئيسية",
    productsTab: "المنتجات",
    ordersTab: "الطلبات",
    couponsTab: "الكوبونات",
    settingsTab: "الإعدادات",

    yourSpace: "مساحتك الخاصة",
    yourStoreNamePlaceholder: "اسم متجرك",
    addSimpleDescription: "أضف وصفًا بسيطًا ليعرف الزائر وش تبيع.",
    styleMeta: (name) => `مظهر ${name} · متجر بهويتك`,
    openYourStore: "افتح متجرك",
    copiedShort: "تم النسخ",
    shareStoreBtn: "شارك المتجر",
    editAppearance: "عدّل المظهر",
    nextStepBadgeStart: "✦ خطوة البداية",
    nextStepBadgeNext: "✦ خطوتك التالية",
    nextStepBadgeReady: "✦ جاهز للانطلاق",
    firstProductTitle: "منتجك الأول أقرب مما تتوقع",
    firstProductText: "أضف منتجاً، راجعه، ثم شارك الرابط مع جمهورك.",
    firstProductCta: "+ أضف أول منتج",
    taglineStepTitle: "عرّف الزوار بمتجرك",
    taglineStepText: "جملة وصف بسيطة تزيد ثقة العملاء وتوضح لهم وش تبيع.",
    taglineStepCta: "أضف وصف المتجر",
    contactStepTitle: "خلّ عملاءك يقدرون يتواصلون معك",
    contactStepText: "أضف رقم واتساب أو حساب إنستغرام في تصميم متجرك.",
    contactStepCta: "أضف وسيلة تواصل",
    describeStepTitle: "منتجاتك تستاهل وصف أوضح",
    describeStepText: "وصف جيد يرفع ثقة المشتري ويزيد فرص البيع.",
    describeStepCta: "حسّن وصف منتج",
    couponStepTitle: "جرب أول كود خصم لك",
    couponStepText: "كوبونات الخصم تشجع الزوار يسوون قرار الشراء بسرعة أكبر.",
    couponStepCta: "أنشئ كود خصم",
    shareStepTitle: "متجرك جاهز، حان وقت المشاركة",
    shareStepText: "شارك رابط متجرك على واتساب وإنستغرام لتبدأ استقبال الزيارات والمبيعات.",
    shareStepCta: "نسخ رابط المتجر",
    stepsOf5: (n) => `${n} من 5 خطوات مكتملة`,
    stalledOrderSingle: "طلب متوقف منذ أكثر من 30 دقيقة",
    stalledOrdersMulti: (n) => `${n} طلبات متوقفة منذ أكثر من 30 دقيقة`,
    stalledOrdersHint: "عملاء بدأوا الطلب وما أكملوا الدفع أو رفع الإثبات.",
    openFromOrdersTab: "افتحهم من تبويب الطلبات",
    confirmedSalesLabel: "ر.ع مبيعات مؤكدة",
    orderSentLabel: "طلب مُرسل",
    activeProductLabel: "منتج نشط",
    addProductQuick: "+ أضف منتج",
    storeDesignQuick: "تصميم المتجر",
    linkCopiedFull: "تم نسخ الرابط",
    copyStoreLinkBtn: "نسخ رابط المتجر",
    shareStoreQuick: "مشاركة المتجر",
    shareCenterTitle: "مركز مشاركة المتجر",
    shareCenterSub: "انشر رابط متجرك في المكان الذي فيه عملاؤك.",
    shareBtn: "مشاركة",
    whatsapp: "واتساب",
    copyLinkBtn: "نسخ الرابط",
    storeCodeTitle: "رمز متجرك",
    storeCodeSub: "خله عندك في المعرض أو المطبوعات، والعميل يفتحه بكاميرا جواله.",
    productHealthTitle: "حالة منتجاتك",
    productHealthSub: "تعرف مباشرة ما الذي يراه الزائر وما يحتاج منك مراجعة.",
    manageProducts: "إدارة المنتجات",
    publishedProductsLabel: "منتجات منشورة",
    hiddenDraftsLabel: "مسودات أو مخفية",
    addFirstProduct: "أضف أول منتج",
    hidden: "مخفي",
    published: "منشور",
    featuredTag: "مميز",
    publicStoreLinkLabel: "رابط متجرك العام",
    copiedTiny: "تم",
    copyTiny: "نسخ",
    lastOrdersTitle: "آخر الطلبات",
    emptyOrdersHint: "أضف منتجك الأول، ثم شارك رابطه على واتساب أو إنستغرام لتبدأ استقبال المبيعات.",

    trialLimitTitle: "وصلت لحد التجربة المجانية",
    trialLimitHint: "التجربة المجانية تسمح بمنتج واحد. رقّي اشتراكك عشان تضيف منتجات بلا حدود وتفتح باقي ميزات مونة.",
    upgradeNow: "رقّي اشتراكك الآن",
    addNewProduct: "أضف منتج جديد",
    openFormHint: "افتح النموذج فقط عندما تكون جاهزًا لإضافة منتج.",
    productNameLabel: "اسم المنتج",
    priceLabel: "السعر (ر.ع)",
    freeFileHint: "اكتب 0 إذا تريد تجعل هذا الملف مجانيًا للزوار.",
    categoryLabel: "التصنيف (مثل: قوالب، أيقونات، عروض تقديمية)",
    categoryLabelShort: "التصنيف",
    shortDescLabel: "وصف مختصر (اختياري)",
    shortDescLabelShort: "وصف مختصر",
    preparingDraft: "جاري تجهيز المسودة...",
    writeDescriptionDraft: "اكتب لي مسودة وصف",
    aiToolsUpsellPrefix: "✨ فعّل إضافة \"أدوات الذكاء\" (١ ر.ع شهريًا) من تبويب",
    aiToolsUpsellSuffix: "عشان يكتب لك الذكاء الاصطناعي مسودة وصف.",
    subscriptionLinkLabel: "اشتراك متجرك",
    draftOnlyEditable: "مسودة فقط — عدّلها أو استخدمها إذا ناسبتك",
    useThisDraft: "استخدم هذه المسودة",
    cancel: "إلغاء",
    productImagesLabel: "صور المنتج (حتى صورتين، اختياري)",
    productTypeLabel: "نوع المنتج",
    fileType: "ملف",
    codeType: "كود / ترخيص",
    productFileLabel: "ملف المنتج",
    fileSecureHint: (mb) => `الملف يُرفع ويُحفظ بشكل محمي. للمنتج المدفوع، يفتح للعميل بعد أن تؤكد استلام التحويل من تبويب الطلبات. الحد الأقصى لحجم الملف ${mb} ميجابايت.`,
    interactiveFileLabel: "ملف يشتغل داخل الموقع فقط (فيديو، لعبة، أو أي محتوى) — يفتح بزر \"تشغيل الآن\" بدل ما يُنزَّل، عشان يشتغل مضمون على أي جهاز وما ينسخه أحد غير المشتري",
    interactiveFileLabelShort: "ملف يشتغل داخل الموقع فقط (فيديو، لعبة، أو أي محتوى) — يفتح بزر \"تشغيل الآن\" بدل ما يُنزَّل",
    pasteCodesLabel: "الصقي الأكواد (كود بكل سطر)",
    eachCustomerCodeHint: "كل زبون ياخذ كود مختلف تلقائيًا. عدد الأسطر = عدد الأكواد المتوفرة.",
    previewProduct: "معاينة المنتج",
    saveAsDraft: "حفظ كمسودة",
    uploadingFileMsg: "جاري رفع الملف...",
    publishingMsg: "جاري النشر...",
    publishProduct: "نشر المنتج",
    draftHintBottom: "\"حفظ كمسودة\" يحفظ المنتج مخفيًا عن الزوار — تقدر تنشره بعدين من قائمة منتجاتك.",
    yourProductsTitle: "منتجاتك",
    productCountUnit: "منتج",
    searchByName: "ابحث باسم المنتج",
    allFilter: "الكل",
    visibleFilter: "منشور",
    hiddenFilter: "مخفي",
    noProductsYet: "ما أضفت أي منتج بعد.",
    noMatchFilter: "ما فيه منتج يطابق البحث أو الفلتر.",
    editNoteChangeFile: "لتغيير الملف نفسه، احذفي هذا المنتج وأضيفيه من جديد مؤقتًا.",
    savingEllipsis: "جاري الحفظ...",
    save: "حفظ",
    stockLabel: "مخزون:",
    codeUnit: "كود",
    outOfStock: " — نفذ المخزون",
    pasteNewCodesLabel: "الصقي الأكواد الجديدة (كود بكل سطر)",
    addingEllipsis: "جاري الإضافة...",
    addCodes: "إضافة الأكواد",
    productLinkLabel: "رابط المنتج",
    copyLink: "نسخ الرابط",
    preparingAd: "جاري تجهيز الإعلان...",
    writeAdDraft: "اكتب لي مسودة إعلان",
    adDraftOnly: "مسودة فقط — لن تُنشر من مُونَة",
    copiedText: "تم النسخ",
    copyTextBtn: "نسخ النص",
    close: "إغلاق",
    edit: "تعديل",
    duplicateAsNew: "نسخ كمنتج جديد",
    addCodesBtn: "إضافة أكواد",
    deletingEllipsis: "جاري الحذف...",
    show: "إظهار",
    unhide: "إخفاء",
    unfeature: "إلغاء التثبيت",
    feature: "تثبيت",
    confirmDeleteQuestion: "تأكيد الحذف؟",
    delete: "حذف",
    moveUp: "↑ قدّمه",
    moveDown: "↓ أخّره",
    editDraftOnlyNoAutoSave: "مسودة فقط — لا تُحفظ إلا إذا ضغطت حفظ المنتج",

    trackingLinksTitle: "روابط التتبع",
    trackingLinksSummary: (visits, count) => `${visits} زيارة من ${count} روابط`,
    trackingLinksEmpty: "أنشئ رابطًا مختلفًا لكل مكان نشر.",
    trackingLinksHint: "أنشئ رابطًا مختلفًا لكل مكان تنشر فيه، مثل واتساب أو إنستغرام. نعرض عدد فتحات الرابط فقط، بدون جمع معلومات شخصية عن الزوار.",
    visitsSummaryTitle: "ملخص الزيارات",
    totalVisits: "إجمالي الزيارات",
    yourCreatedLinks: "روابطك المنشأة",
    mostVisitedLink: (label) => `أكثر رابط تمت زيارته: ${label}`,
    visitUnit: "زيارة",
    trackingLinksNote: "هذه الأرقام لفتحات روابط التتبع فقط، وليست مبيعات أو معلومات عن الزوار.",
    publishProductFirst: "انشر منتجًا أولًا حتى تنشئ له رابط تتبع.",
    productLabel: "المنتج",
    choosePublishedProduct: "اختر منتجًا منشورًا",
    publishLocationLabel: "اسم مكان النشر",
    publishLocationPlaceholder: "مثال: إنستغرام",
    creatingEllipsis: "جاري الإنشاء...",
    createTrackingLink: "إنشاء رابط تتبع",
    productUnavailable: "منتج غير متاح",
    trackingLinkLabel: "رابط التتبع",
    deleteLinkBtn: "حذف الرابط",

    bundlesTitle: "حزم المنتجات",
    bundlesSummary: (n) => `${n} حزم محفوظة`,
    bundlesEmpty: "جهّز الحزمة الآن، وانشرها لعملائك متى ما جهزت.",
    bundlesHint: "جهّز عرضًا من منتجين أو أكثر بسعر واحد. تُحفظ الحزمة كمسودة أول ما تنشئها، وما يقدر عملاؤك يطلبونها إلا بعد ما تضغط \"نشر الحزمة\".",
    bundleSavedDraft: "تم حفظ الحزمة كمسودة. اضغط \"نشر الحزمة\" تحت لما تجهز.",
    needTwoProducts: "تحتاج منتجين على الأقل قبل تجهيز حزمة.",
    bundleNameLabel: "اسم الحزمة",
    bundleNamePlaceholder: "مثال: حزمة قوالب البداية",
    bundlePriceLabel: "سعر الحزمة المتوقع (ر.ع)",
    bundleDescPlaceholder: "وش الذي يحصل عليه العميل داخل الحزمة؟",
    chooseBundleProducts: "اختر منتجات الحزمة",
    saveBundleAsDraft: "حفظ الحزمة كمسودة",
    savedBundlesTitle: "الحزم المحفوظة",
    draftStatus: "مسودة",
    publishedStatus: "منشورة",
    productsUnit: "منتجات",
    willNotShowUntilPublished: "لن تظهر للزوار أو تسمح بالطلب حتى تنشرها.",
    publishedCanOrder: "منشورة، وعملاؤك يقدرون يطلبونها من رابطها.",
    confirmDeleteBundleQuestion: "نعم، احذف الحزمة",
    updatingEllipsis: "جاري التحديث...",
    publishBundle: "نشر الحزمة",
    unpublish: "إلغاء النشر",
    copyBundleLink: "نسخ رابط الحزمة",
    archiveBundle: "أرشفة الحزمة",
    archivingEllipsis: "جاري الأرشفة...",
    deletePermanently: "حذف نهائيًا",
    archivedBundlesTitle: "الحزم المؤرشفة",
    archiveTag: "أرشيف",
    savedForYouOnly: "محفوظة عندك فقط. منتجات الحزمة لم تتغير.",
    unarchiving: "جاري الإخراج...",
    unarchiveBundle: "إخراج من الأرشيف",

    autoWelcomeCouponHint: "كوبون الترحيب التلقائي للعملاء الجدد يتفعّل ويتغيّر من",
    settingsWord: "الإعدادات",
    addNewCouponTitle: "أضف كود خصم جديد",
    couponCodeLabel: "كود الخصم",
    couponCodePlaceholder: "مثال: EID20",
    couponCodeHint: "أحرف إنجليزية وأرقام، بدون مسافات. العميل يكتب هذا الكود وقت الشراء.",
    discountPercentLabel: "نسبة الخصم (%)",
    appliesTo: "ينطبق على",
    allYourProducts: "كل منتجاتك",
    createCode: "إنشاء الكود",
    yourCurrentCodesTitle: "أكوادك الحالية",
    noCouponsYet: "ما أضفت أي كود خصم بعد.",
    discountLabel: (percent) => `خصم ${percent}٪`,
    deleteCode: "حذف الكود",

    transferInstructions: "تعليمات التحويل",
    transferInstructionsSub: "تظهر للعميل وقت الطلب",
    yourPaymentGateway: "بوابة الدفع الخاصة بك",
    gatewayConnectedSub: "مربوطة · العملاء يدفعون مباشرة لحسابك",
    gatewayNotConnectedSub: "غير مربوطة · حاليًا تحويل يدوي فقط",
    autoWelcomeCoupon: "كوبون الترحيب التلقائي",
    activePercentLabel: (percent) => `مفعّل · خصم ${percent}٪`,
    stoppedNow: "متوقف حاليًا",
    storeIdentity: "هوية المتجر",
    storeIdentitySub: "الاسم، الشعار، اللون، الأسئلة الشائعة",
    yourLinkAndDomain: "رابط متجرك ودومينك الخاص",
    freeLinkActive: "الرابط المجاني مفعّل · دومين خاص اختياري",
    subscriptionAndPlan: "الاشتراك والباقة",
    basicPlanLabel: (price) => `باقة أساسية · ${price} ر.ع شهريًا`,

    backToSettings: "‹ الإعدادات",
    transferInstructionsForCustomers: "تعليمات التحويل لعملائك",
    transferInstructionsHint: "اكتب ملاحظة عامة للمشتري، ثم بيانات الحساب البنكي بشكل منظم أسفلها حتى يقدر ينسخها بسهولة. لا تضع كلمة مرور أو رمز تحقق.",
    generalNoteLabel: "ملاحظة عامة",
    generalNotePlaceholder: "مثال: حوّل المبلغ بنفس اسمك الظاهر في تطبيق البنك، ثم ارفع إثبات التحويل هنا.",
    bankNameLabel: "اسم البنك",
    bankNamePlaceholder: "بنك مسقط",
    accountHolderLabel: "اسم صاحب الحساب",
    accountHolderPlaceholder: "كما يظهر في حسابك البنكي",
    accountNumberLabel: "رقم الحساب",
    accountNumberPlaceholder: "مثال: 0123456789",
    phoneNumberLabel: "رقم الجوال (للتحويل عبر الهاتف)",
    phoneNumberHint: "اختياري — يظهر للمشتري مع رقم الحساب حتى ينسخه بسهولة.",
    notifyEmailLabel: "إيميل إشعارات الطلبات",
    notifyEmailPlaceholder: "مثال: store@outlook.com",
    notifyEmailHint: "نرسل لك إيميل تلقائي على هذا العنوان كل ما عميل يرفع إثبات تحويل. اتركه فاضي لاستخدام إيميل تسجيل دخولك بدلًا منه.",
    spamWarning: "⚠️ أول إيميل يوصلك ممكن يوصل مجلد \"الرسائل غير المرغوب فيها/Spam\" بدل الرئيسي — افتحيه واضغطي \"ليس بريدًا مزعجًا\" عشان الإيميلات الجاية توصل صح تلقائيًا.",
    saveTransferInstructions: "حفظ تعليمات التحويل",

    yourPaymentGatewayTitle: "بوابة الدفع الخاصة بك",
    gatewayIntro: "اربط حساب OmPay الخاص فيك (لازم يكون عندك حساب تاجر مفعّل عندهم باسمك) عشان عملاؤك يدفعون بالبطاقة مباشرة لحسابك أنت — مُونة ما تلمس هالفلوس أبدًا. بدون ربط، يبقى التحويل اليدوي هو الخيار الوحيد.",
    gatewayUpsellPrefix: "مهم: ربط البوابة وحده ما يكفي — لازم تفعّل إضافة \"البيع الرقمي\" (٢ ر.ع شهريًا) من تبويب",
    gatewayUpsellSuffix: "حتى تشتغل الميزة فعليًا لعملائك.",
    gatewayConnectedNowWorking: "بوابتك مربوطة الآن وشغالة.",
    cancelingEllipsis: "جاري الإلغاء...",
    cancelLinking: "إلغاء الربط",
    apiKeyLabel: "مفتاح API (OMPAY-API-Key)",
    apiKeyPlaceholder: "من حسابك في OmPay",
    apiSecretLabel: "سر API (OMPAY-API-Secret)",
    linkingEllipsis: "جاري الربط...",
    linkGateway: "اربط بوابة الدفع",

    freeOptionTitle: "الخيار المجاني — رابط متجرك",
    freeOptionText: "هذا الرابط شغال دائمًا ومجانًا، وتقدر تغيّر جزءه الأخير من تبويب \"هوية المتجر\".",
    paidOptionTitle: "الخيار المدفوع — رابط فرعي مخصص باسم متجرك",
    paidOptionText: "عنوان أقصر وأنظف من الرابط المجاني، يُضاف كسطر إضافي على اشتراكك الشهري وليس دفعة منفصلة.",
    monthlySuffix: "/ شهريًا",
    domainClarification: "مهم توضيحه: هذا رابط فرعي تابع لمنصة مونة (مثل",
    domainClarificationSuffix: ")، وليس دومينًا مستقلًا بالكامل — اسم مونة يبقى ظاهر في آخر الرابط دائمًا.",
    currentDomainLabel: "دومينك الحالي",
    domainValidUntil: (date) => `ساري حتى ${date}، يتجدد مع اشتراكك الشهري.`,
    chooseDomainName: "اختر اسم دومينك",
    checkingEllipsis: "جاري التحقق...",
    checkAvailability: "تحقق من التوفر",
    payAndActivateLink: (price) => `ادفع ${price} ر.ع وفعّل الرابط`,

    autoWelcomeCouponTitle: "كوبون ترحيبي تلقائي للعملاء",
    autoWelcomeCouponHint2: "لو فعّلته، كل عميل يكمل أول طلب منه ياخذ كود خصم شخصي تلقائي لطلبه الجاي من متجرك، بدون أي جهد منك. تقدر توقفه أي وقت.",
    enableAutoWelcomeCoupon: "فعّل كوبون الترحيب التلقائي",
    saveSetting: "حفظ الإعداد",

    viewStore: "عرض المتجر ↗",
    storeCoverAlt: "غلاف المتجر",
    storeLogoAlt: "شعار المتجر",
    designSavedMsg: "تم حفظ تصميم متجرك.",
    storeCoverLabel: "غلاف المتجر (اختياري)",
    noCover: "بدون غلاف",
    uploadingEllipsis: "جاري الرفع...",
    uploadCoverPhoto: "رفع صورة غلاف",
    coverHint: "صورة عريضة تظهر أعلى صفحة متجرك، فوق الشعار.",
    storeLogoLabel: "شعار المتجر",
    uploadNewLogo: "رفع شعار جديد",
    storeNameLabel: "اسم المتجر",
    taglineFieldLabel: "عرّف الزوار بمتجرك في جملة واحدة",
    taglinePlaceholder: "مثال: قوالب وتصاميم تساعدك تنجز شغلك بشكل أسرع",
    chooseStoreLink: "اختر رابط متجرك",
    slugPlaceholder: "hind",
    slugWillAppear: (slugOrName) => `سيظهر متجرك على: monah-app.com/#store/${slugOrName}`,
    yourNamePlaceholder: "اسمك",
    whatsappFieldLabel: "رقم واتساب (اختياري)",
    instagramFieldLabel: "حساب إنستغرام (اختياري)",
    supportEmailLabel: "إيميل خدمة العملاء (اختياري)",
    supportEmailHint: "يظهر للعميل بجانب رقم الواتساب كطريقة تواصل ثانية، لو حاب متجرك يستخدم إيميل مخصص لخدمة العملاء.",
    storeAboutLabel: "نبذة عن المتجر (اختياري)",
    storeAboutPlaceholder: "عرّف الزوار عن منتجاتك أو أسلوب عملك.",
    faqLabel: "أسئلة وأجوبة للزائر (اختياري)",
    faqHint: "أضف حتى 5 أسئلة تساعد العميل قبل ما يتواصل معك.",
    questionPlaceholder: "السؤال",
    answerPlaceholder: "الإجابة",
    questionNumber: (n) => `سؤال ${n}`,
    remove: "إزالة",
    addQuestion: "+ أضف سؤالًا",
    chooseStoreStyle: "اختر مظهر متجرك",
    storeStyleHint: "خلّ متجرك بالأصلي أو اختر مظهرًا يناسب علامتك. الشعار والاسم والغلاف يبقون باسمك أنت.",
    storeStyleFallback: "مظهر المتجر",
    paymentLabel: "الدفع",
    paymentHint: "عميلك يقدر يدفع ببطاقته مباشرة، أو يحوّل يدويًا ويرفع إثبات التحويل. تعليمات التحويل تُدار من الإعدادات، ولا تظهر في صفحة متجرك العامة لحمايتها.",
    unsavedChanges: "عندك تغييرات غير محفوظة",
    allSaved: "كل شي محفوظ",
    saveAndPublish: "حفظ ونشر التغييرات",
    genericProductsFallback: "منتجات رقمية عبر Monah",

    yourStoreSubscription: "اشتراك متجرك",
    subscriptionHint: (price) => `متجر أساسي ${price} ر.ع شهريًا، ثم إضافات تختارها وتُحتسب معه.`,
    freeTrialBadge: "تجربة مجانية",
    activeBadge: "مفعّل",
    trialSubscriptionHint: "أنت على التجربة المجانية — منتج واحد فقط، بدون حد زمني. رقّي اشتراكك عشان تضيف منتجات بلا حدود وتفتح باقي الميزات (الإضافات، الدومين الخاص، وغيرها).",
    baseStoreLabel: "المتجر الأساسي",
    baseStoreDesc: "الهوية والمنتجات والمشاركة وQR والمنتجات المجانية وتتبع الزيارات.",
    subscriptionActiveUntil: (date, daysPart) => `الاشتراك ساري حتى ${date}${daysPart}.`,
    daysRemaining: (n) => ` (${n} يوم متبقي)`,
    expiredSuffix: " — منتهي",
    renewalDateUnavailable: "تاريخ التجديد غير متوفر.",
    upgradeAmount: "مبلغ الترقية",
    nextRenewalAmount: "مبلغ التجديد القادم",
    baseAndActiveAddOns: (n) => `الأساسي + إضافاتك المفعّلة (${n})`,
    payAndUpgrade: (price) => `ادفع ${price} ر.ع ورقّي اشتراكك`,
    payAndRenew: (price) => `ادفع ${price} ر.ع وجدّد الاشتراك`,
    notActive: "غير مفعّل",
    connectGatewayFirstPrefix: "اربط",
    yourPaymentGatewayLink: "بوابة الدفع الخاصة بك",
    connectGatewayFirstSuffix: "أولًا لتقدر تفعّلها",
    addOnsSelectedCount: (n) => `${n} إضافة مختارة`,
    payAndActivateAddOns: (price) => `ادفع ${price} ر.ع وفعّل الإضافات`,
    addOnBillingNote: "لما تفعّل إضافة، تدفع سعرها كاملًا الآن، ثم تدخل ضمن مبلغ تجديدك الشهري القادم تلقائيًا.",

    previewTitle: "معاينة — هكذا يشوفها العميل",
    generalCategory: "عام",
    productNamePlaceholder: "اسم المنتج",
    priceWord: "السعر",
    noExtraDescription: "ما فيه وصف إضافي لهذا المنتج.",
    sellingOptionsOnActivation: "خيارات البيع عند التفعيل",
    previewOnlyNote: "هذي معاينة فقط — المنتج ما انحفظ بعد، وتظهر خيارات البيع الإلكتروني عند تشغيلها",
  },
  en: {
    fileTooLarge: (mb) => `The file is larger than ${mb} MB. Contact us if you need to upload a larger file.`,
    writeNameForDraft: "Write the product name first, then request the draft.",
    loginRetry: "Log in, then try again.",
    draftError: "Couldn't prepare the draft right now. Try again shortly.",
    adDraftError: "Couldn't prepare the ad text right now. Try again shortly.",
    copyDraftError: "Couldn't copy the draft. Copy it manually.",
    trialLimitError: "The free trial allows one product only. Upgrade your subscription to add more.",
    planLimitError: (limit) => `You've reached your plan's limit (${limit} products). Upgrade your subscription to add more.`,
    nameAndPriceRequired: "Write the product name and a valid price, or write 0 for a free product.",
    freeOnlyFiles: "Free products are currently available for files only.",
    fillNamePriceFile: "Fill in the product name and price, and choose the product file.",
    fillNamePriceCodes: "Fill in the product name and price, and paste the codes (one per line).",
    genericTryAgain: "Something went wrong, try again.",
    editNameAndPriceRequired: "Fill in the product name and a valid price, or write 0 for a free product.",
    saveEditError: "Couldn't save the edit, try again.",
    pasteOneCode: "Paste at least one code.",
    addCodesError: "Couldn't add the codes, try again.",
    deleteProductError: "Couldn't delete the product, try again.",
    toggleHiddenError: "Couldn't update the product's status, try again.",
    toggleFeaturedError: "Couldn't pin the product right now, try again.",
    reorderError: "Couldn't reorder the products right now, try again.",
    bundleNamePriceRequired: "Write the bundle name and a valid price greater than zero.",
    bundleTwoProducts: "Choose at least two products for the bundle.",
    saveBundleError: "Couldn't save the bundle, try again.",
    bundleUnarchived: "The bundle was taken out of the archive. You'll find it under your saved bundles.",
    bundleArchived: "The bundle was moved to the archive. You'll find it under your archived bundles.",
    bundleArchiveError: "Couldn't update the bundle's status, try again.",
    bundlePublished: "The bundle is now published, and your customers can order it from its link.",
    bundleUnpublished: "The bundle is now hidden from visitors. Its link won't open until you publish it again.",
    bundlePublishError: "Couldn't update the publish status, try again.",
    copyBundleLinkError: "Couldn't copy the link. Copy it manually from the address bar.",
    bundleDeleted: "Only the bundle was deleted. Your products stayed as they were.",
    deleteBundleError: "Couldn't delete the bundle, try again.",
    maxTwoImages: "Maximum two images per product.",
    maxTwoImagesPartial: "Maximum two images per product — we uploaded the first two only.",
    invalidImageFiles: "Choose valid image files.",
    imageTooLargeSkipped: "One of the images is larger than 5 MB, we skipped it.",
    uploadImageError: "Couldn't upload one of the images, try again.",
    invalidImageFile: "Choose a valid image file.",
    imageTooLargeSingle: "The image is larger than 5 MB, choose a smaller image.",
    uploadPhotoError: "Couldn't upload the image, try again.",
    writeStoreNameBeforeSave: "Write your store name before saving.",
    slugMinLength: "Write a link of at least 3 English letters or digits.",
    invalidContactEmail: "The contact email isn't valid — check it or leave it empty.",
    slugTaken: "This link is used by another store, try a different link.",
    designSavedToast: "Your store design was saved ✓",
    saveDesignError: "Couldn't save the design, try again.",
    writeCouponCode: "Write the discount code.",
    couponPercentRange: "The discount percentage must be between 1 and 90.",
    couponCodeExists: "You already have a code with this name, choose a different name.",
    saveSettingError: "Couldn't save the setting right now.",
    savedShort: "Saved.",
    writePaymentInstructions: "Write the transfer instructions clearly before saving.",
    savePaymentError: "Couldn't save the instructions right now.",
    paymentInstructionsSaved: "Transfer instructions saved. They appear to the buyer only after they start an order.",
    paymentInstructionsSavedToast: "Transfer instructions saved ✓",
    gatewayKeysRequired: "Write a valid API key and API secret from your OmPay account before saving.",
    connectGatewayError: "Couldn't connect the payment gateway right now.",
    gatewayConnectedMsg: "Connected. Your customers can now pay by card directly to your account.",
    disconnectGatewayError: "Couldn't disconnect right now.",
    gatewayDisconnectedMsg: "Disconnected. Customers now transfer manually only.",
    genericOperationError: "Couldn't complete the operation right now.",
    domainNameMinLength: "Write a name of at least 3 English letters or digits.",
    domainAvailableMsg: "Available! You can complete the purchase.",
    domainTakenMsg: "This name is taken.",
    domainCheckError: "Couldn't check right now.",
    paymentPrepError: "Couldn't prepare the payment page right now.",
    couponScopeAll: "On all your products",
    couponScopeProduct: (name) => `On product: ${name}`,
    couponScopeDeleted: "On a deleted product",
    selectProductFirst: "Choose the product first.",
    linkNameLength: "Write a link name between 2 and 60 characters.",
    trackingLinkCreated: "The tracking link was created. Copy it and share it wherever you chose.",
    createTrackingLinkError: "Couldn't create the tracking link, try again.",
    copyLinkErrorAlt: "Couldn't copy the link. Copy it from the browser bar.",
    deleteTrackingLinkError: "Couldn't delete the tracking link, try again.",
    myStore: "My store",
    browseProductsText: (name) => `Browse ${name}'s products`,
    shareError: "Couldn't share right now, try copying the link.",
    showBundlesError: "Couldn't show your saved bundles right now.",
    showCampaignLinksError: "Couldn't show your tracking links right now.",
    copySuffix: " (copy)",
    initialFallback: "M",
    mbUnit: "MB",
    whatsappShareText: (name, url) => `Browse ${name}'s products: ${url}`,

    pendingPaymentTitle: "You have an unconfirmed payment",
    pendingPaymentText: "Your account started opening a store and paying, but we haven't confirmed the payment succeeded yet. Click check before trying to pay again — to avoid a duplicate charge.",
    checkPaymentStatus: "Check my payment status",
    storeSetupIncompleteTitle: "You haven't finished opening your store yet",
    storeSetupIncompleteText: "This account doesn't have an active subscription. If you started opening a store and didn't complete payment, you can continue from here.",
    continueStoreSetup: "Continue opening your store",
    logoutCta: "Log out",

    yourStore: "Your store",
    sellerDashboard: "Seller dashboard",
    genericProducts: "Digital products",
    adminPanel: "Admin panel",
    logoutBtn: "Log out",
    verificationResent: "We sent a new confirmation link to your email. Open your email and click the link.",
    emailNotVerified: "Your email isn't confirmed yet. Confirming your email ensures you can access your account if you forget your password.",
    sendingEllipsis: "Sending...",
    resend: "Resend",
    sendVerificationLink: "Send confirmation link",
    subscriptionExpired: "Your store's subscription has ended. Renew it now so it can receive orders again.",
    subscriptionExpiringSoon: (days) => `Your store's subscription ends in ${days} days. Renew now without interruption.`,
    preparingPayment: "Preparing payment...",
    renewNow: "Renew subscription now",
    trialUsedUp: "You're on the free trial and used your only product. Upgrade your subscription to add unlimited products.",
    trialActive: "You're on the free trial — one product free, no card.",
    upgradeSubscription: "Upgrade your subscription",
    homeTab: "Home",
    productsTab: "Products",
    ordersTab: "Orders",
    couponsTab: "Coupons",
    settingsTab: "Settings",

    yourSpace: "Your own space",
    yourStoreNamePlaceholder: "Your store name",
    addSimpleDescription: "Add a simple description so visitors know what you sell.",
    styleMeta: (name) => `${name} style · Store with your identity`,
    openYourStore: "Open your store",
    copiedShort: "Copied",
    shareStoreBtn: "Share store",
    editAppearance: "Edit appearance",
    nextStepBadgeStart: "✦ Getting started",
    nextStepBadgeNext: "✦ Your next step",
    nextStepBadgeReady: "✦ Ready to launch",
    firstProductTitle: "Your first product is closer than you think",
    firstProductText: "Add a product, review it, then share the link with your audience.",
    firstProductCta: "+ Add your first product",
    taglineStepTitle: "Introduce your store to visitors",
    taglineStepText: "A simple description line builds customer trust and clarifies what you sell.",
    taglineStepCta: "Add store description",
    contactStepTitle: "Let your customers reach you",
    contactStepText: "Add a WhatsApp number or Instagram account in your store design.",
    contactStepCta: "Add a contact method",
    describeStepTitle: "Your products deserve a clearer description",
    describeStepText: "A good description builds buyer trust and increases sales chances.",
    describeStepCta: "Improve a product's description",
    couponStepTitle: "Try your first discount code",
    couponStepText: "Discount coupons encourage visitors to decide to buy faster.",
    couponStepCta: "Create a discount code",
    shareStepTitle: "Your store is ready, time to share it",
    shareStepText: "Share your store link on WhatsApp and Instagram to start getting visits and sales.",
    shareStepCta: "Copy store link",
    stepsOf5: (n) => `${n} of 5 steps completed`,
    stalledOrderSingle: "1 order stalled for over 30 minutes",
    stalledOrdersMulti: (n) => `${n} orders stalled for over 30 minutes`,
    stalledOrdersHint: "Customers started an order but didn't complete payment or upload proof.",
    openFromOrdersTab: "Open them from the Orders tab",
    confirmedSalesLabel: "OMR confirmed sales",
    orderSentLabel: "order sent",
    activeProductLabel: "active product",
    addProductQuick: "+ Add product",
    storeDesignQuick: "Store design",
    linkCopiedFull: "Link copied",
    copyStoreLinkBtn: "Copy store link",
    shareStoreQuick: "Share store",
    shareCenterTitle: "Store sharing center",
    shareCenterSub: "Publish your store link wherever your customers are.",
    shareBtn: "Share",
    whatsapp: "WhatsApp",
    copyLinkBtn: "Copy link",
    storeCodeTitle: "Your store code",
    storeCodeSub: "Keep it in your gallery or printed materials — customers scan it with their phone camera.",
    productHealthTitle: "Your products' status",
    productHealthSub: "See directly what visitors see and what needs your review.",
    manageProducts: "Manage products",
    publishedProductsLabel: "published products",
    hiddenDraftsLabel: "drafts or hidden",
    addFirstProduct: "Add your first product",
    hidden: "Hidden",
    published: "Published",
    featuredTag: "Featured",
    publicStoreLinkLabel: "Your public store link",
    copiedTiny: "Copied",
    copyTiny: "Copy",
    lastOrdersTitle: "Latest orders",
    emptyOrdersHint: "Add your first product, then share its link on WhatsApp or Instagram to start getting sales.",

    trialLimitTitle: "You've reached the free trial limit",
    trialLimitHint: "The free trial allows one product. Upgrade your subscription to add unlimited products and unlock the rest of Monah's features.",
    upgradeNow: "Upgrade your subscription now",
    addNewProduct: "Add a new product",
    openFormHint: "Only open the form when you're ready to add a product.",
    productNameLabel: "Product name",
    priceLabel: "Price (OMR)",
    freeFileHint: "Write 0 if you want to make this file free for visitors.",
    categoryLabel: "Category (e.g. templates, icons, presentations)",
    categoryLabelShort: "Category",
    shortDescLabel: "Short description (optional)",
    shortDescLabelShort: "Short description",
    preparingDraft: "Preparing the draft...",
    writeDescriptionDraft: "Write me a description draft",
    aiToolsUpsellPrefix: "✨ Activate the \"AI Tools\" add-on (1 OMR/month) from the",
    aiToolsUpsellSuffix: "tab so AI can write you a description draft.",
    subscriptionLinkLabel: "your store subscription",
    draftOnlyEditable: "Draft only — edit it or use it if it suits you",
    useThisDraft: "Use this draft",
    cancel: "Cancel",
    productImagesLabel: "Product images (up to two, optional)",
    productTypeLabel: "Product type",
    fileType: "File",
    codeType: "Code / license",
    productFileLabel: "Product file",
    fileSecureHint: (mb) => `The file is uploaded and stored securely. For a paid product, it opens for the customer after you confirm receiving the transfer from the Orders tab. Maximum file size ${mb} MB.`,
    interactiveFileLabel: "Play-only file (video, game, or any content) — opens with a \"Play now\" button instead of downloading, so it's guaranteed to work on any device and can't be copied by anyone but the buyer",
    interactiveFileLabelShort: "Play-only file (video, game, or any content) — opens with a \"Play now\" button instead of downloading",
    pasteCodesLabel: "Paste the codes (one per line)",
    eachCustomerCodeHint: "Each customer automatically gets a different code. Number of lines = number of available codes.",
    previewProduct: "Preview product",
    saveAsDraft: "Save as draft",
    uploadingFileMsg: "Uploading the file...",
    publishingMsg: "Publishing...",
    publishProduct: "Publish product",
    draftHintBottom: "\"Save as draft\" saves the product hidden from visitors — you can publish it later from your products list.",
    yourProductsTitle: "Your products",
    productCountUnit: "products",
    searchByName: "Search by product name",
    allFilter: "All",
    visibleFilter: "Published",
    hiddenFilter: "Hidden",
    noProductsYet: "You haven't added any products yet.",
    noMatchFilter: "No product matches the search or filter.",
    editNoteChangeFile: "To change the file itself, delete this product and add it again temporarily.",
    savingEllipsis: "Saving...",
    save: "Save",
    stockLabel: "Stock:",
    codeUnit: "codes",
    outOfStock: " — out of stock",
    pasteNewCodesLabel: "Paste the new codes (one per line)",
    addingEllipsis: "Adding...",
    addCodes: "Add codes",
    productLinkLabel: "Product link",
    copyLink: "Copy link",
    preparingAd: "Preparing the ad...",
    writeAdDraft: "Write me an ad draft",
    adDraftOnly: "Draft only — won't be published by Monah",
    copiedText: "Copied",
    copyTextBtn: "Copy text",
    close: "Close",
    edit: "Edit",
    duplicateAsNew: "Duplicate as new product",
    addCodesBtn: "Add codes",
    deletingEllipsis: "Deleting...",
    show: "Show",
    unhide: "Hide",
    unfeature: "Unpin",
    feature: "Pin",
    confirmDeleteQuestion: "Confirm delete?",
    delete: "Delete",
    moveUp: "↑ Move up",
    moveDown: "↓ Move down",
    editDraftOnlyNoAutoSave: "Draft only — won't be saved unless you click save product",

    trackingLinksTitle: "Tracking links",
    trackingLinksSummary: (visits, count) => `${visits} visits from ${count} links`,
    trackingLinksEmpty: "Create a different link for each place you publish.",
    trackingLinksHint: "Create a different link for each place you publish, like WhatsApp or Instagram. We only show the number of link opens, without collecting personal visitor information.",
    visitsSummaryTitle: "Visits summary",
    totalVisits: "Total visits",
    yourCreatedLinks: "Your created links",
    mostVisitedLink: (label) => `Most visited link: ${label}`,
    visitUnit: "visits",
    trackingLinksNote: "These numbers are for tracking link opens only, not sales or visitor information.",
    publishProductFirst: "Publish a product first to create a tracking link for it.",
    productLabel: "Product",
    choosePublishedProduct: "Choose a published product",
    publishLocationLabel: "Publishing location name",
    publishLocationPlaceholder: "e.g. Instagram",
    creatingEllipsis: "Creating...",
    createTrackingLink: "Create tracking link",
    productUnavailable: "Product unavailable",
    trackingLinkLabel: "Tracking link",
    deleteLinkBtn: "Delete link",

    bundlesTitle: "Product bundles",
    bundlesSummary: (n) => `${n} saved bundles`,
    bundlesEmpty: "Prepare the bundle now, and publish it to your customers whenever it's ready.",
    bundlesHint: "Prepare an offer of two or more products at one price. The bundle is saved as a draft as soon as you create it, and customers can't order it until you click \"Publish bundle\".",
    bundleSavedDraft: "The bundle was saved as a draft. Click \"Publish bundle\" below when ready.",
    needTwoProducts: "You need at least two products before preparing a bundle.",
    bundleNameLabel: "Bundle name",
    bundleNamePlaceholder: "e.g. Starter template bundle",
    bundlePriceLabel: "Expected bundle price (OMR)",
    bundleDescPlaceholder: "What does the customer get inside the bundle?",
    chooseBundleProducts: "Choose the bundle's products",
    saveBundleAsDraft: "Save bundle as draft",
    savedBundlesTitle: "Saved bundles",
    draftStatus: "Draft",
    publishedStatus: "Published",
    productsUnit: "products",
    willNotShowUntilPublished: "Won't appear to visitors or allow ordering until you publish it.",
    publishedCanOrder: "Published, and your customers can order it from its link.",
    confirmDeleteBundleQuestion: "Yes, delete the bundle",
    updatingEllipsis: "Updating...",
    publishBundle: "Publish bundle",
    unpublish: "Unpublish",
    copyBundleLink: "Copy bundle link",
    archiveBundle: "Archive bundle",
    archivingEllipsis: "Archiving...",
    deletePermanently: "Delete permanently",
    archivedBundlesTitle: "Archived bundles",
    archiveTag: "Archived",
    savedForYouOnly: "Saved for you only. The bundle's products haven't changed.",
    unarchiving: "Unarchiving...",
    unarchiveBundle: "Take out of archive",

    autoWelcomeCouponHint: "The automatic welcome coupon for new customers is activated and changed from",
    settingsWord: "Settings",
    addNewCouponTitle: "Add a new discount code",
    couponCodeLabel: "Discount code",
    couponCodePlaceholder: "e.g. EID20",
    couponCodeHint: "English letters and digits, no spaces. The customer types this code at checkout.",
    discountPercentLabel: "Discount percentage (%)",
    appliesTo: "Applies to",
    allYourProducts: "All your products",
    createCode: "Create code",
    yourCurrentCodesTitle: "Your current codes",
    noCouponsYet: "You haven't added any discount code yet.",
    discountLabel: (percent) => `${percent}% off`,
    deleteCode: "Delete code",

    transferInstructions: "Transfer instructions",
    transferInstructionsSub: "Shown to the customer at checkout",
    yourPaymentGateway: "Your payment gateway",
    gatewayConnectedSub: "Connected · Customers pay directly to your account",
    gatewayNotConnectedSub: "Not connected · Manual transfer only for now",
    autoWelcomeCoupon: "Automatic welcome coupon",
    activePercentLabel: (percent) => `Active · ${percent}% off`,
    stoppedNow: "Currently stopped",
    storeIdentity: "Store identity",
    storeIdentitySub: "Name, logo, color, FAQs",
    yourLinkAndDomain: "Your store link and custom domain",
    freeLinkActive: "Free link active · Optional custom domain",
    subscriptionAndPlan: "Subscription and plan",
    basicPlanLabel: (price) => `Basic plan · ${price} OMR/month`,

    backToSettings: "‹ Settings",
    transferInstructionsForCustomers: "Transfer instructions for your customers",
    transferInstructionsHint: "Write a general note for the buyer, then your bank account details organized below so they can copy them easily. Don't include a password or verification code.",
    generalNoteLabel: "General note",
    generalNotePlaceholder: "e.g. Transfer the amount using the same name shown in your banking app, then upload proof of transfer here.",
    bankNameLabel: "Bank name",
    bankNamePlaceholder: "Bank Muscat",
    accountHolderLabel: "Account holder name",
    accountHolderPlaceholder: "As it appears on your bank account",
    accountNumberLabel: "Account number",
    accountNumberPlaceholder: "e.g. 0123456789",
    phoneNumberLabel: "Phone number (for transfer via phone)",
    phoneNumberHint: "Optional — shown to the buyer alongside the account number so they can copy it easily.",
    notifyEmailLabel: "Order notification email",
    notifyEmailPlaceholder: "e.g. store@outlook.com",
    notifyEmailHint: "We send you an automatic email to this address whenever a customer uploads a transfer proof. Leave it empty to use your login email instead.",
    spamWarning: "⚠️ The first email you receive might land in your \"Spam/Junk\" folder instead of the inbox — open it and click \"Not spam\" so future emails arrive correctly automatically.",
    saveTransferInstructions: "Save transfer instructions",

    yourPaymentGatewayTitle: "Your payment gateway",
    gatewayIntro: "Connect your own OmPay account (you need an active merchant account with them in your name) so your customers pay by card directly to your account — Monah never touches this money. Without connecting, manual transfer remains the only option.",
    gatewayUpsellPrefix: "Important: connecting the gateway alone isn't enough — you need to activate the \"Digital selling\" add-on (2 OMR/month) from the",
    gatewayUpsellSuffix: "tab for the feature to actually work for your customers.",
    gatewayConnectedNowWorking: "Your gateway is connected now and working.",
    cancelingEllipsis: "Canceling...",
    cancelLinking: "Disconnect",
    apiKeyLabel: "API key (OMPAY-API-Key)",
    apiKeyPlaceholder: "From your OmPay account",
    apiSecretLabel: "API secret (OMPAY-API-Secret)",
    linkingEllipsis: "Connecting...",
    linkGateway: "Connect payment gateway",

    freeOptionTitle: "Free option — your store link",
    freeOptionText: "This link always works for free, and you can change its last part from the \"Store identity\" tab.",
    paidOptionTitle: "Paid option — custom subdomain with your store name",
    paidOptionText: "A shorter, cleaner address than the free link, added as an extra line to your monthly subscription, not a separate charge.",
    monthlySuffix: "/ month",
    domainClarification: "Worth clarifying: this is a subdomain of the Monah platform (like",
    domainClarificationSuffix: "), not a fully independent domain — the Monah name always stays visible at the end of the link.",
    currentDomainLabel: "Your current domain",
    domainValidUntil: (date) => `Valid until ${date}, renews with your monthly subscription.`,
    chooseDomainName: "Choose your domain name",
    checkingEllipsis: "Checking...",
    checkAvailability: "Check availability",
    payAndActivateLink: (price) => `Pay ${price} OMR and activate the link`,

    autoWelcomeCouponTitle: "Automatic welcome coupon for customers",
    autoWelcomeCouponHint2: "If enabled, every customer who completes their first order gets an automatic personal discount code for their next order from your store, with no effort from you. You can turn it off anytime.",
    enableAutoWelcomeCoupon: "Enable the automatic welcome coupon",
    saveSetting: "Save setting",

    viewStore: "View store ↗",
    storeCoverAlt: "Store cover",
    storeLogoAlt: "Store logo",
    designSavedMsg: "Your store design was saved.",
    storeCoverLabel: "Store cover (optional)",
    noCover: "No cover",
    uploadingEllipsis: "Uploading...",
    uploadCoverPhoto: "Upload cover photo",
    coverHint: "A wide image shown at the top of your store page, above the logo.",
    storeLogoLabel: "Store logo",
    uploadNewLogo: "Upload new logo",
    storeNameLabel: "Store name",
    taglineFieldLabel: "Introduce your store to visitors in one sentence",
    taglinePlaceholder: "e.g. Templates and designs that help you get your work done faster",
    chooseStoreLink: "Choose your store link",
    slugPlaceholder: "hind",
    slugWillAppear: (slugOrName) => `Your store will appear at: monah-app.com/#store/${slugOrName}`,
    yourNamePlaceholder: "your-name",
    whatsappFieldLabel: "WhatsApp number (optional)",
    instagramFieldLabel: "Instagram account (optional)",
    supportEmailLabel: "Customer service email (optional)",
    supportEmailHint: "Shown to the customer next to the WhatsApp number as a second contact method, if you'd like your store to use a dedicated customer service email.",
    storeAboutLabel: "About the store (optional)",
    storeAboutPlaceholder: "Tell visitors about your products or way of working.",
    faqLabel: "Visitor FAQs (optional)",
    faqHint: "Add up to 5 questions that help the customer before they contact you.",
    questionPlaceholder: "Question",
    answerPlaceholder: "Answer",
    questionNumber: (n) => `Question ${n}`,
    remove: "Remove",
    addQuestion: "+ Add a question",
    chooseStoreStyle: "Choose your store's style",
    storeStyleHint: "Keep your store as-is or choose a style that suits your brand. The logo, name, and cover stay in your own name.",
    storeStyleFallback: "Store style",
    paymentLabel: "Payment",
    paymentHint: "Your customer can pay by card directly, or transfer manually and upload proof of transfer. Transfer instructions are managed from Settings, and don't appear on your public store page to protect them.",
    unsavedChanges: "You have unsaved changes",
    allSaved: "Everything is saved",
    saveAndPublish: "Save and publish changes",
    genericProductsFallback: "Digital products via Monah",

    yourStoreSubscription: "Your store subscription",
    subscriptionHint: (price) => `Basic store ${price} OMR/month, plus add-ons you choose that are billed with it.`,
    freeTrialBadge: "Free trial",
    activeBadge: "Active",
    trialSubscriptionHint: "You're on the free trial — one product only, no time limit. Upgrade your subscription to add unlimited products and unlock the rest of the features (add-ons, custom domain, and more).",
    baseStoreLabel: "Base store",
    baseStoreDesc: "Identity, products, sharing, QR, free products, and visit tracking.",
    subscriptionActiveUntil: (date, daysPart) => `Subscription active until ${date}${daysPart}.`,
    daysRemaining: (n) => ` (${n} days left)`,
    expiredSuffix: " — expired",
    renewalDateUnavailable: "Renewal date unavailable.",
    upgradeAmount: "Upgrade amount",
    nextRenewalAmount: "Next renewal amount",
    baseAndActiveAddOns: (n) => `Base + your active add-ons (${n})`,
    payAndUpgrade: (price) => `Pay ${price} OMR and upgrade your subscription`,
    payAndRenew: (price) => `Pay ${price} OMR and renew subscription`,
    notActive: "Not active",
    connectGatewayFirstPrefix: "Connect",
    yourPaymentGatewayLink: "your payment gateway",
    connectGatewayFirstSuffix: "first to activate it",
    addOnsSelectedCount: (n) => `${n} add-ons selected`,
    payAndActivateAddOns: (price) => `Pay ${price} OMR and activate the add-ons`,
    addOnBillingNote: "When you activate an add-on, you pay its full price now, then it's automatically included in your next monthly renewal amount.",

    previewTitle: "Preview — this is what the customer sees",
    generalCategory: "General",
    productNamePlaceholder: "Product name",
    priceWord: "Price",
    noExtraDescription: "No extra description for this product.",
    sellingOptionsOnActivation: "Selling options once activated",
    previewOnlyNote: "This is a preview only — the product hasn't been saved yet, and online selling options appear once turned on",
  },
};

export default function Dashboard() {
  const [lang, setLang] = useLang();
  const t = DASH_T[lang];
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sellerAccess, setSellerAccess] = useState("checking");
  const addProductRef = useRef(null);
  const [hasPendingSignupPayment, setHasPendingSignupPayment] = useState(false);
  const [sellerStoreType, setSellerStoreType] = useState("files");
  function getTabFromHash() {
    const parts = window.location.hash.replace("#", "").split("/");
    const t = parts[1];
    return ["overview", "products", "coupons", "orders", "settings", "payment", "gateway", "loyalty", "design", "subscription", "domain"].includes(t) ? t : "overview";
  }
  const [tab, setTabState] = useState(getTabFromHash);

  function setTab(newTab) {
    setTabState(newTab);
    const newHash = "#dashboard/" + newTab;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }

  // products
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [productFile, setProductFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("file");
  const [requiresActivation, setRequiresActivation] = useState(false);
  const [sellerPlan, setSellerPlan] = useState("basic");
  const [trialProductClaimed, setTrialProductClaimed] = useState(false);
  const [codesText, setCodesText] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editRequiresActivation, setEditRequiresActivation] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [restockingId, setRestockingId] = useState(null);
  const [restockText, setRestockText] = useState("");
  const [restockSaving, setRestockSaving] = useState(false);
  const [restockError, setRestockError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [copied, setCopied] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [togglingHiddenId, setTogglingHiddenId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [descriptionDraftTarget, setDescriptionDraftTarget] = useState("");
  const [descriptionDraftLoading, setDescriptionDraftLoading] = useState("");
  const [descriptionDraftError, setDescriptionDraftError] = useState("");
  const [adCopy, setAdCopy] = useState("");
  const [adCopyProductId, setAdCopyProductId] = useState("");
  const [adCopyLoadingId, setAdCopyLoadingId] = useState("");
  const [adCopyError, setAdCopyError] = useState("");
  const [bundles, setBundles] = useState([]);
  const [bundleName, setBundleName] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundleProductIds, setBundleProductIds] = useState([]);
  const [bundleSaving, setBundleSaving] = useState(false);
  const [bundleSaved, setBundleSaved] = useState(false);
  const [bundleError, setBundleError] = useState("");
  const [bundleActionNotice, setBundleActionNotice] = useState("");
  const [togglingBundleId, setTogglingBundleId] = useState(null);
  const [publishingBundleId, setPublishingBundleId] = useState(null);
  const [copiedBundleId, setCopiedBundleId] = useState(null);
  const [confirmBundleDeleteId, setConfirmBundleDeleteId] = useState(null);
  const [deletingBundleId, setDeletingBundleId] = useState(null);
  const [campaignLinks, setCampaignLinks] = useState([]);
  const [campaignProductId, setCampaignProductId] = useState("");
  const [campaignLabel, setCampaignLabel] = useState("");
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignNotice, setCampaignNotice] = useState("");
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  // store design
  const [storeName, setStoreName] = useState("");
  const [storeColor, setStoreColor] = useState(COLORS[0]);
  const [tagline, setTagline] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [designSaved, setDesignSaved] = useState(false);
  const [toast, setToast] = useState("");
  const [designSaving, setDesignSaving] = useState(false);
  const [designDirty, setDesignDirty] = useState(false);
  const [storeAbout, setStoreAbout] = useState("");
  const [storeFaqs, setStoreFaqs] = useState([]);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [paymentBankName, setPaymentBankName] = useState("");
  const [paymentAccountHolder, setPaymentAccountHolder] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");

  // coupons
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState("");
  const [couponScope, setCouponScope] = useState("all");
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [repeatCouponEnabled, setRepeatCouponEnabled] = useState(false);
  const [repeatCouponPercent, setRepeatCouponPercent] = useState(10);
  const [repeatCouponSaving, setRepeatCouponSaving] = useState(false);
  const [repeatCouponMessage, setRepeatCouponMessage] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [ompayApiKeyInput, setOmpayApiKeyInput] = useState("");
  const [ompayApiSecretInput, setOmpayApiSecretInput] = useState("");
  const [savingGateway, setSavingGateway] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState("");
  const [customDomainSlug, setCustomDomainSlug] = useState("");
  const [customDomainExpiresAt, setCustomDomainExpiresAt] = useState("");
  const [domainSlugInput, setDomainSlugInput] = useState("");
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState(null);
  const [domainBuying, setDomainBuying] = useState(false);
  const [domainMessage, setDomainMessage] = useState("");
  const [activeAddOns, setActiveAddOns] = useState([]);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState("");
  const [addOnSelection, setAddOnSelection] = useState([]);
  const [addOnBuying, setAddOnBuying] = useState(false);
  const [addOnMessage, setAddOnMessage] = useState("");
  const [renewalBuying, setRenewalBuying] = useState(false);
  const [renewalMessage, setRenewalMessage] = useState("");

  // overview: sales
  const [sellerOrders, setSellerOrders] = useState([]);

  useEffect(() => {
    function onHashChange() {
      setTabState(getTabFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.hash = "login";
      } else {
        setUser(u);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.email === ADMIN_EMAIL) {
      window.location.hash = "admin";
      return;
    }
    let cancelled = false;
    function applySellerData(data) {
      setSellerPlan(data.plan || "basic");
      setTrialProductClaimed(Boolean(data.trialProductClaimed));
      setSellerStoreType(data.storeType || "files");
      setPaymentInstructions(data.paymentInstructions || "");
      setGatewayConnected(data.paymentGateway?.provider === "ompay");
      setPaymentBankName(data.paymentBankName || "");
      setPaymentAccountHolder(data.paymentAccountHolder || "");
      setPaymentAccountNumber(data.paymentAccountNumber || "");
      setPaymentPhoneNumber(data.paymentPhoneNumber || "");
      // لو التاجر ما حدد إيميل إشعارات مخصص، نعبّي له الخانة بإيميل تسجيل
      // دخوله تلقائيًا — هذا أصلاً نفس الإيميل اللي يستخدمه السيرفر كافتراضي،
      // بس نخليه يبين بالخانة عشان يكون واضح ومو مخفي.
      setNotifyEmail(data.notifyEmail || user.email || "");
      setCustomDomainSlug(data.customDomainSlug || "");
      setCustomDomainExpiresAt(data.customDomainExpiresAt || "");
      setActiveAddOns(data.activeAddOns || []);
      setSubscriptionExpiresAt(data.subscriptionExpiresAt || "");
      setRepeatCouponEnabled(Boolean(data.repeatCouponEnabled));
      setRepeatCouponPercent(Number(data.repeatCouponPercent) || 10);
      setSellerAccess("active");
    }
    async function merchantSignupAction(action) {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/merchant-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action }),
      });
      return response.json().catch(() => ({}));
    }
    // لو فيه دفعة إضافة/دومين/تجديد سابقة ما تأكدت وقت حصولها (مثلاً OmPay رجعت
    // حالة مؤقتة غير واضحة)، نعيد التحقق منها تلقائيًا كل ما يفتح التاجر لوحته —
    // بدون ما يحتاج يعيد الدفع بنفسه أو يتواصل معنا.
    async function autoVerifyPendingPurchases(data) {
      const checks = [
        ["pendingAddOnReferenceNumber", "verify_addon_charge"],
        ["pendingDomainReferenceNumber", "verify_domain_charge"],
        ["pendingRenewalReferenceNumber", "verify_renewal_charge"],
      ];
      for (const [field, action] of checks) {
        if (cancelled || !data[field]) continue;
        try {
          const result = await merchantSignupAction(action);
          if (cancelled) return;
          if (result?.paid) {
            const retrySnap = await getDoc(doc(db, "sellers", user.uid));
            if (!cancelled && retrySnap.exists()) {
              data = retrySnap.data();
              applySellerData(data);
            }
          }
        } catch (autoVerifyErr) {
          console.error(autoVerifyErr);
        }
      }
    }
    async function verifySellerAccess() {
      try {
        const snap = await getDoc(doc(db, "sellers", user.uid));
        if (cancelled) return;
        if (snap.exists()) {
          applySellerData(snap.data());
          return autoVerifyPendingPurchases(snap.data());
        }

        // ما فيه حساب تاجر بعد — لو صار دفع سابق ما تأكد، نتحقق منه ونفعّل تلقائيًا
        // بدون ما نطلب من التاجر يسوي أي خطوة يدوية (رابط، إعادة تسجيل، إلخ).
        try {
          const statusData = await merchantSignupAction("status");
          if (cancelled) return;
          const pending = Boolean(statusData?.signup?.hasPendingPayment);
          setHasPendingSignupPayment(pending);
          if (pending) {
            const verifyData = await merchantSignupAction("verify_card_charge");
            if (cancelled) return;
            if (verifyData?.paid) {
              const retrySnap = await getDoc(doc(db, "sellers", user.uid));
              if (!cancelled && retrySnap.exists()) return applySellerData(retrySnap.data());
            }
          }
        } catch (autoVerifyErr) {
          console.error(autoVerifyErr);
        }
        if (!cancelled) setSellerAccess("denied");
      } catch (err) {
        console.error(err);
        if (!cancelled) setSellerAccess("denied");
      }
    }
    verifySellerAccess();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "bundles"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBundles(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, () => setBundleError(t.showBundlesError));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const campaignQuery = query(collection(db, "campaignLinks"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(campaignQuery, (snap) => {
      const links = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      links.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setCampaignLinks(links);
    }, () => setCampaignError(t.showCampaignLinksError));
    return () => unsub();
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "coupons"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => !c.buyerUid));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        setSellerOrders(list);
      },
      () => setSellerOrders([])
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadStore() {
      const snap = await getDoc(doc(db, "stores", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setStoreName(data.name || "");
        setStoreColor(data.color || COLORS[0]);
        setTagline(data.tagline || "");
        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setContactEmail(data.contactEmail || "");
        setSlug(data.slug || "");
        setLogoUrl(data.logoUrl || "");
        setCoverUrl(data.coverUrl || "");
        setStoreAbout(data.about || "");
        setStoreFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      } else {
        setStoreName(user.email.split("@")[0]);
      }
    }
    loadStore();
  }, [user]);

  function handleFilePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_PRODUCT_FILE_MB * 1024 * 1024) {
      setError(t.fileTooLarge(MAX_PRODUCT_FILE_MB));
      setProductFile(null);
      return;
    }
    setProductFile(file);
  }

  async function generateDescriptionDraft(target, product = null) {
    const isNewProduct = target === "new";
    const productName = isNewProduct ? name : product?.name;
    const productCategory = isNewProduct ? category : product?.category;
    const productNotes = isNewProduct ? description : editDescription;
    const type = isNewProduct ? productType : product?.type;
    if (!productName?.trim()) {
      setDescriptionDraftError(t.writeNameForDraft);
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDescriptionDraftError(t.loginRetry);
      return;
    }
    setDescriptionDraftError("");
    setDescriptionDraftLoading(target);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/ai-product-description", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: isNewProduct ? "" : product?.id,
          name: productName,
          category: productCategory,
          notes: productNotes,
          productType: type,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.description) throw new Error(data?.error || "draft unavailable");
      setDescriptionDraft(data.description);
      setDescriptionDraftTarget(target);
    } catch (draftError) {
      setDescriptionDraftError(draftError.message && draftError.message !== "draft unavailable" ? draftError.message : t.draftError);
    }
    setDescriptionDraftLoading("");
  }

  function useDescriptionDraft(target) {
    if (!descriptionDraft || descriptionDraftTarget !== target) return;
    if (target === "new") setDescription(descriptionDraft);
    else setEditDescription(descriptionDraft);
    setDescriptionDraft("");
    setDescriptionDraftTarget("");
  }

  async function generateAdCopy(product) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setAdCopyError(t.loginRetry);
      return;
    }
    setAdCopyError("");
    setAdCopyLoadingId(product.id);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/ai-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      if (!response.ok || !data?.copy) throw new Error(data?.error || "ad draft unavailable");
      setAdCopy(data.copy);
      setAdCopyProductId(product.id);
    } catch (adError) {
      setAdCopyError(t.adDraftError);
    }
    setAdCopyLoadingId("");
  }

  function copyAdDraft() {
    if (!adCopy) return;
    navigator.clipboard.writeText(adCopy).then(() => setCopied("ad-copy")).catch(() => setAdCopyError(t.copyDraftError));
  }

  async function handleAddProduct(e, publish) {
    e.preventDefault();
    setError("");

    if (trialLimitReached) {
      setError(t.trialLimitError);
      return;
    }
    if (planLimitReached) {
      setError(t.planLimitError(planProductLimit));
      return;
    }

    const cleanName = name.trim();
    const numericPrice = Number(price);
    if (!cleanName || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setError(t.nameAndPriceRequired);
      return;
    }
    if (numericPrice === 0 && productType !== "file") {
      setError(t.freeOnlyFiles);
      return;
    }

    if (productType === "file") {
      if (!productFile) {
        setError(t.fillNamePriceFile);
        return;
      }
    } else {
      const codesList = codesText.split("\n").map((c) => c.trim()).filter(Boolean);
      if (!name || !price || codesList.length === 0) {
        setError(t.fillNamePriceCodes);
        return;
      }
    }

    setSaving(true);
    try {
      const codesList = codesText.split("\n").map((c) => c.trim()).filter(Boolean);
      const productRef = await addDoc(collection(db, "products"), {
        ownerId: user.uid,
        name: cleanName,
        price: numericPrice,
        description: description || "",
        category: category || "عام",
        type: productType,
        filePath: "",
        codesCount: productType === "code" ? codesList.length : 0,
        images: productImages,
        hidden: true,
        suspended: false,
        featured: false,
        sortOrder: Date.now(),
        createdAt: serverTimestamp(),
        requiresActivation: productType === "file" ? requiresActivation : false,
      });

      if (productType === "code" && codesList.length > 0) {
        const batch = writeBatch(db);
        codesList.forEach((code) => {
          const codeRef = doc(collection(db, "products", productRef.id, "codes"));
          batch.set(codeRef, { code, used: false, usedBy: null, usedAt: null });
        });
        await batch.commit();
      }

      try {
        if (productType === "file" && productFile) {
          setUploadingFile(true);
          const safeName = productFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `secure/${productRef.id}/${safeName}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, productFile);
          await updateDoc(doc(db, "products", productRef.id), { filePath });
        }
        await updateDoc(doc(db, "products", productRef.id), { hidden: !publish });
      } catch (uploadError) {
        await deleteDoc(doc(db, "products", productRef.id));
        throw uploadError;
      } finally {
        setUploadingFile(false);
      }

      setName("");
      setPrice("");
      setDescription("");
      setProductFile(null);
      setFileInputKey((k) => k + 1);
      setCategory("");
      setCodesText("");
      setProductType("file");
      setRequiresActivation(false);
      setProductImages([]);

      if (isTrial && !trialProductClaimed) {
        await updateDoc(doc(db, "sellers", user.uid), { trialProductClaimed: true }).catch(() => {});
        setTrialProductClaimed(true);
      }
    } catch (err) {
      setError(t.genericTryAgain);
      setUploadingFile(false);
    }
    setSaving(false);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description || "");
    setEditCategory(p.category || "");
    setEditRequiresActivation(Boolean(p.requiresActivation));
  }

  // تسريع رفع منتجات كثيرة متشابهة (زي حزم PLR) — ننسخ النص والسعر والتصنيف
  // كنقطة بداية، ونترك الصور والملف فارغين لأنها الجزء المختلف فعليًا بكل منتج.
  function duplicateProduct(p) {
    setName(`${p.name}${t.copySuffix}`);
    setPrice(String(p.price));
    setDescription(p.description || "");
    setCategory(p.category || "");
    setProductType(p.type === "code" ? "code" : "file");
    setRequiresActivation(Boolean(p.requiresActivation));
    setProductImages([]);
    setProductFile(null);
    setFileInputKey((k) => k + 1);
    setCodesText("");
    setError("");
    if (addProductRef.current) {
      addProductRef.current.open = true;
      addProductRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(productId) {
    const cleanName = editName.trim();
    const numericPrice = Number(editPrice);
    const product = products.find((item) => item.id === productId);
    if (!cleanName || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setError(t.editNameAndPriceRequired);
      return;
    }
    if (numericPrice === 0 && product?.type !== "file") {
      setError(t.freeOnlyFiles);
      return;
    }
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "products", productId), {
        name: cleanName,
        price: numericPrice,
        description: editDescription || "",
        category: editCategory || "عام",
        ...(product?.type === "file" ? { requiresActivation: editRequiresActivation } : {}),
      });
      setEditingId(null);
    } catch (err) {
      setError(t.saveEditError);
    }
    setEditSaving(false);
  }

  function startRestock(productId) {
    setRestockingId(productId);
    setRestockText("");
    setRestockError("");
  }

  function cancelRestock() {
    setRestockingId(null);
    setRestockText("");
    setRestockError("");
  }

  async function saveRestock(productId) {
    const codesList = restockText.split("\n").map((c) => c.trim()).filter(Boolean);
    if (codesList.length === 0) {
      setRestockError(t.pasteOneCode);
      return;
    }
    setRestockError("");
    setRestockSaving(true);
    try {
      const batch = writeBatch(db);
      codesList.forEach((code) => {
        const codeRef = doc(collection(db, "products", productId, "codes"));
        batch.set(codeRef, { code, used: false, usedBy: null, usedAt: null });
      });
      batch.update(doc(db, "products", productId), { codesCount: increment(codesList.length) });
      await batch.commit();
      setRestockingId(null);
      setRestockText("");
    } catch (err) {
      setRestockError(t.addCodesError);
    }
    setRestockSaving(false);
  }

  async function confirmDelete(productId) {
    setDeletingId(productId);
    try {
      await deleteDoc(doc(db, "products", productId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(t.deleteProductError);
    }
    setDeletingId(null);
  }

  async function toggleHidden(productId, currentlyHidden) {
    setTogglingHiddenId(productId);
    try {
      await updateDoc(doc(db, "products", productId), { hidden: !currentlyHidden });
    } catch (err) {
      setError(t.toggleHiddenError);
    }
    setTogglingHiddenId(null);
  }

  async function toggleFeatured(productId, currentlyFeatured) {
    setTogglingHiddenId(productId);
    try {
      await updateDoc(doc(db, "products", productId), { featured: !currentlyFeatured });
    } catch (err) {
      setError(t.toggleFeaturedError);
    }
    setTogglingHiddenId(null);
  }

  async function moveProduct(productId, direction) {
    const ordered = [...products].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = ordered.findIndex((product) => product.id === productId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    const current = ordered[index];
    const target = ordered[targetIndex];
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "products", current.id), { sortOrder: target.sortOrder || Date.now() + targetIndex });
      batch.update(doc(db, "products", target.id), { sortOrder: current.sortOrder || Date.now() + index });
      await batch.commit();
    } catch (err) {
      setError(t.reorderError);
    }
  }

  function toggleBundleProduct(productId) {
    setBundleProductIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  }

  async function handleCreateBundle() {
    const cleanName = bundleName.trim();
    const numericPrice = Number(bundlePrice);
    setBundleSaved(false);
    setBundleError("");
    setBundleActionNotice("");
    if (!cleanName || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setBundleError(t.bundleNamePriceRequired);
      return;
    }
    if (bundleProductIds.length < 2) {
      setBundleError(t.bundleTwoProducts);
      return;
    }
    setBundleSaving(true);
    try {
      await addDoc(collection(db, "bundles"), {
        ownerId: user.uid,
        name: cleanName,
        price: numericPrice,
        description: bundleDescription.trim().slice(0, 500),
        productIds: bundleProductIds,
        hidden: true,
        suspended: false,
        archived: false,
        createdAt: serverTimestamp(),
      });
      setBundleName("");
      setBundlePrice("");
      setBundleDescription("");
      setBundleProductIds([]);
      setBundleSaved(true);
    } catch (err) {
      setBundleError(t.saveBundleError);
    }
    setBundleSaving(false);
  }

  async function toggleBundleArchived(bundle) {
    setBundleError("");
    setBundleSaved(false);
    setBundleActionNotice("");
    setTogglingBundleId(bundle.id);
    try {
      await updateDoc(doc(db, "bundles", bundle.id), { archived: !bundle.archived });
      setBundleActionNotice(bundle.archived
        ? t.bundleUnarchived
        : t.bundleArchived);
    } catch (err) {
      setBundleError(t.bundleArchiveError);
    }
    setTogglingBundleId(null);
  }

  async function toggleBundlePublished(bundle) {
    setBundleError("");
    setBundleSaved(false);
    setBundleActionNotice("");
    setPublishingBundleId(bundle.id);
    try {
      await updateDoc(doc(db, "bundles", bundle.id), { hidden: !bundle.hidden });
      setBundleActionNotice(bundle.hidden
        ? t.bundlePublished
        : t.bundleUnpublished);
    } catch (err) {
      setBundleError(t.bundlePublishError);
    }
    setPublishingBundleId(null);
  }

  async function copyBundleLink(bundleId) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#bundle/${bundleId}`);
      setCopiedBundleId(bundleId);
      window.setTimeout(() => setCopiedBundleId(null), 1600);
    } catch {
      setBundleError(t.copyBundleLinkError);
    }
  }

  async function confirmDeleteBundle(bundleId) {
    setBundleError("");
    setBundleSaved(false);
    setBundleActionNotice("");
    setDeletingBundleId(bundleId);
    try {
      await deleteDoc(doc(db, "bundles", bundleId));
      setConfirmBundleDeleteId(null);
      setBundleActionNotice(t.bundleDeleted);
    } catch (err) {
      setBundleError(t.deleteBundleError);
    }
    setDeletingBundleId(null);
  }

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(productQuery.trim().toLowerCase());
    const matchesFilter =
      productFilter === "all" ||
      (productFilter === "visible" && !p.hidden) ||
      (productFilter === "hidden" && p.hidden);
    return matchesQuery && matchesFilter;
  });
  const orderedProducts = [...filteredProducts].sort((a, b) => Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0));
  const activeBundles = bundles.filter((bundle) => !bundle.archived);
  const archivedBundles = bundles.filter((bundle) => bundle.archived);

  async function handleProductImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImagesError("");
    const remainingSlots = 2 - productImages.length;
    if (remainingSlots <= 0) {
      setImagesError(t.maxTwoImages);
      return;
    }
    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > filesToUpload.length) {
      setImagesError(t.maxTwoImagesPartial);
    }
    setImagesUploading(true);
    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        setImagesError(t.invalidImageFiles);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImagesError(t.imageTooLargeSkipped);
        continue;
      }
      try {
        const fileRef = ref(storage, `product-images/${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setProductImages((prev) => [...prev, url]);
      } catch (err) {
        setImagesError(t.uploadImageError);
      }
    }
    setImagesUploading(false);
  }

  function removeProductImage(url) {
    setProductImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoError("");
    if (!file.type.startsWith("image/")) {
      setLogoError(t.invalidImageFile);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError(t.imageTooLargeSingle);
      return;
    }
    setLogoUploading(true);
    try {
      const fileRef = ref(storage, `logos/${user.uid}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setLogoUrl(url);
    } catch (err) {
      setLogoError(t.uploadPhotoError);
    }
    setLogoUploading(false);
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverError("");
    if (!file.type.startsWith("image/")) {
      setCoverError(t.invalidImageFile);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError(t.imageTooLargeSingle);
      return;
    }
    setCoverUploading(true);
    try {
      const fileRef = ref(storage, `covers/${user.uid}-${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setCoverUrl(url);
      setDesignDirty(true);
    } catch (err) {
      setCoverError(t.uploadPhotoError);
    }
    setCoverUploading(false);
  }

  // إشعار "تم الحفظ" يطلع ثابت أسفل الشاشة (مش جوا الصفحة نفسها)، عشان يبين
  // فورًا حتى لو زر الحفظ تحت وباقي محتوى الصفحة فوق — بدون ما التاجر يحتاج
  // يسحب لفوق عشان يتأكد إن الحفظ صار.
  function flashToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleSaveDesign() {
    setDesignSaving(true);
    setDesignSaved(false);
    setSlugError("");
    try {
      const cleanStoreName = storeName.trim();
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!cleanStoreName) {
        setError(t.writeStoreNameBeforeSave);
        setDesignSaving(false);
        return;
      }
      if (!cleanSlug || cleanSlug.length < 3) {
        setSlugError(t.slugMinLength);
        setDesignSaving(false);
        return;
      }
      const cleanContactEmail = contactEmail.trim();
      if (cleanContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContactEmail)) {
        setError(t.invalidContactEmail);
        setDesignSaving(false);
        return;
      }
      {
        const q = query(collection(db, "stores"), where("slug", "==", cleanSlug));
        const snap = await getDocs(q);
        const takenByOther = snap.docs.some((d) => d.id !== user.uid);
        if (takenByOther) {
          setSlugError(t.slugTaken);
          setDesignSaving(false);
          return;
        }
      }
      await setDoc(doc(db, "stores", user.uid), {
        name: cleanStoreName,
        color: storeColor,
        tagline: tagline || "",
        whatsapp: whatsapp || "",
        instagram: instagram || "",
        contactEmail: cleanContactEmail || "",
        slug: cleanSlug || "",
        logoUrl: logoUrl || "",
        coverUrl: coverUrl || "",
        about: storeAbout.trim(),
        faqs: storeFaqs.filter((faq) => faq.question?.trim() && faq.answer?.trim()).slice(0, 5),
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      try {
        await setDoc(doc(db, "sellers", user.uid), { storeName: cleanStoreName }, { merge: true });
      } catch (e) {
        console.error(e);
      }
      setSlug(cleanSlug);
      setDesignSaved(true);
      setDesignDirty(false);
      setTimeout(() => setDesignSaved(false), 2000);
      flashToast(t.designSavedToast);
    } catch (err) {
      setError(t.saveDesignError);
    }
    setDesignSaving(false);
  }

  async function handleAddCoupon(e) {
    e.preventDefault();
    setCouponError("");
    const cleanCode = couponCode.trim().toUpperCase().replace(/\s+/g, "");
    const percentNum = Number(couponPercent);

    if (!cleanCode) {
      setCouponError(t.writeCouponCode);
      return;
    }
    if (!percentNum || percentNum <= 0 || percentNum > 90) {
      setCouponError(t.couponPercentRange);
      return;
    }
    const exists = coupons.some((c) => c.code === cleanCode);
    if (exists) {
      setCouponError(t.couponCodeExists);
      return;
    }

    setCouponSaving(true);
    try {
      await addDoc(collection(db, "coupons"), {
        ownerId: user.uid,
        code: cleanCode,
        discountPercent: percentNum,
        productId: couponScope === "all" ? null : couponScope,
        active: true,
        createdAt: serverTimestamp(),
      });
      setCouponCode("");
      setCouponPercent("");
      setCouponScope("all");
    } catch (err) {
      setCouponError(t.genericTryAgain);
    }
    setCouponSaving(false);
  }

  async function saveRepeatCouponSettings() {
    setRepeatCouponSaving(true);
    setRepeatCouponMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "save_repeat_coupon_settings",
          enabled: repeatCouponEnabled,
          discountPercent: Number(repeatCouponPercent) || 10,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.saveSettingError);
      setRepeatCouponEnabled(data.enabled);
      setRepeatCouponPercent(data.discountPercent);
      setRepeatCouponMessage(t.savedShort);
    } catch (err) {
      setRepeatCouponMessage(err.message || t.saveSettingError);
    }
    setRepeatCouponSaving(false);
  }

  async function savePaymentInstructions() {
    if (paymentInstructions.trim().length < 6) {
      setPaymentMessage(t.writePaymentInstructions);
      return;
    }
    setSavingPayment(true);
    setPaymentMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: "save_payment_instructions",
          paymentInstructions,
          paymentBankName,
          paymentAccountHolder,
          paymentAccountNumber,
          paymentPhoneNumber,
          notifyEmail,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.savePaymentError);
      setPaymentInstructions(data.paymentInstructions);
      setPaymentBankName(data.paymentBankName || "");
      setPaymentAccountHolder(data.paymentAccountHolder || "");
      setPaymentAccountNumber(data.paymentAccountNumber || "");
      setPaymentPhoneNumber(data.paymentPhoneNumber || "");
      setNotifyEmail(data.notifyEmail || "");
      setPaymentMessage(t.paymentInstructionsSaved);
      flashToast(t.paymentInstructionsSavedToast);
    } catch (err) {
      setPaymentMessage(err.message || t.savePaymentError);
    }
    setSavingPayment(false);
  }

  async function saveGateway() {
    if (ompayApiKeyInput.trim().length < 10 || ompayApiSecretInput.trim().length < 10) {
      setGatewayMessage(t.gatewayKeysRequired);
      return;
    }
    setSavingGateway(true);
    setGatewayMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action: "save_payment_gateway", provider: "ompay", ompayApiKey: ompayApiKeyInput.trim(), ompayApiSecret: ompayApiSecretInput.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.connectGatewayError);
      setGatewayConnected(true);
      setOmpayApiKeyInput("");
      setOmpayApiSecretInput("");
      setGatewayMessage(t.gatewayConnectedMsg);
    } catch (err) {
      setGatewayMessage(err.message || t.connectGatewayError);
    }
    setSavingGateway(false);
  }

  async function disconnectGateway() {
    setSavingGateway(true);
    setGatewayMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action: "save_payment_gateway", disconnect: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.disconnectGatewayError);
      setGatewayConnected(false);
      setGatewayMessage(t.gatewayDisconnectedMsg);
    } catch (err) {
      setGatewayMessage(err.message || t.disconnectGatewayError);
    }
    setSavingGateway(false);
  }

  async function domainSignupRequest(action, extra) {
    const idToken = await user.getIdToken();
    const response = await fetch("/api/merchant-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t.genericOperationError);
    return data;
  }

  async function checkDomainSlug() {
    const cleanSlug = domainSlugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanSlug.length < 3) {
      setDomainAvailable(false);
      setDomainMessage(t.domainNameMinLength);
      return;
    }
    setDomainChecking(true);
    setDomainMessage("");
    try {
      const data = await domainSignupRequest("check_domain_slug", { slug: cleanSlug });
      setDomainAvailable(data.available);
      setDomainMessage(data.available ? t.domainAvailableMsg : (data.reason || t.domainTakenMsg));
    } catch (err) {
      setDomainAvailable(null);
      setDomainMessage(err.message || t.domainCheckError);
    }
    setDomainChecking(false);
  }

  async function buyDomain() {
    const cleanSlug = domainSlugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanSlug.length < 3) {
      setDomainMessage(t.domainNameMinLength);
      return;
    }
    setDomainBuying(true);
    setDomainMessage("");
    try {
      const data = await domainSignupRequest("create_domain_charge", { slug: cleanSlug });
      // دفعة سابقة على نفس الطلب تأكدت الحين بدل ما تُنشأ شحنة جديدة — نحدّث
      // الصفحة عشان تظهر حالتك الجديدة، بدون خصم إضافي أو الرجوع لبوابة الدفع.
      if (data.activated) {
        window.location.reload();
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      setDomainMessage(err.message || t.paymentPrepError);
      setDomainBuying(false);
    }
  }

  function toggleAddOnSelection(key) {
    setAddOnSelection((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  async function buyAddOns() {
    if (addOnSelection.length === 0) return;
    setAddOnBuying(true);
    setAddOnMessage("");
    try {
      const data = await domainSignupRequest("create_addon_charge", { addOns: addOnSelection });
      if (data.activated) {
        window.location.reload();
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      setAddOnMessage(err.message || t.paymentPrepError);
      setAddOnBuying(false);
    }
  }

  async function renewSubscription() {
    setRenewalBuying(true);
    setRenewalMessage("");
    try {
      const data = await domainSignupRequest("create_renewal_charge", {});
      if (data.activated) {
        window.location.reload();
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      setRenewalMessage(err.message || t.paymentPrepError);
      setRenewalBuying(false);
    }
  }

  async function deleteCoupon(couponId) {
    setDeletingCouponId(couponId);
    try {
      await deleteDoc(doc(db, "coupons", couponId));
    } catch (err) {
      console.error(err);
    }
    setDeletingCouponId(null);
  }

  function couponScopeLabel(c) {
    if (!c.productId) return t.couponScopeAll;
    const p = products.find((pr) => pr.id === c.productId);
    return p ? t.couponScopeProduct(p.name) : t.couponScopeDeleted;
  }

  function handleLogout() {
    signOut(auth).then(() => {
      window.location.hash = "login";
    });
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
    } catch {
      setVerificationSent(false);
    }
    setSendingVerification(false);
  }

  function copyLink(id, kind) {
    const url = `${window.location.origin}${window.location.pathname}#${kind}/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(kind + id);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  function trackedLinkUrl(linkId) {
    return `${window.location.origin}/api/track-visit?link=${encodeURIComponent(linkId)}`;
  }
  async function createCampaignLink() {
    const cleanLabel = campaignLabel.trim();
    setCampaignError("");
    setCampaignNotice("");
    if (!campaignProductId) {
      setCampaignError(t.selectProductFirst);
      return;
    }
    if (cleanLabel.length < 2 || cleanLabel.length > 60) {
      setCampaignError(t.linkNameLength);
      return;
    }
    setCampaignSaving(true);
    try {
      await addDoc(collection(db, "campaignLinks"), {
        ownerId: user.uid,
        productId: campaignProductId,
        label: cleanLabel,
        visits: 0,
        createdAt: serverTimestamp(),
      });
      setCampaignLabel("");
      setCampaignNotice(t.trackingLinkCreated);
    } catch (error) {
      setCampaignError(t.createTrackingLinkError);
    }
    setCampaignSaving(false);
  }
  async function copyCampaignLink(linkId) {
    try {
      await navigator.clipboard.writeText(trackedLinkUrl(linkId));
      setCopied(`campaign${linkId}`);
      window.setTimeout(() => setCopied(""), 1500);
    } catch (error) {
      setCampaignError(t.copyLinkErrorAlt);
    }
  }
  async function deleteCampaignLink(linkId) {
    setDeletingCampaignId(linkId);
    setCampaignError("");
    try {
      await deleteDoc(doc(db, "campaignLinks", linkId));
    } catch (error) {
      setCampaignError(t.deleteTrackingLinkError);
    }
    setDeletingCampaignId(null);
  }
  async function shareStore() {
    const shareData = { title: storeName || t.myStore, text: t.browseProductsText(storeName || t.myStore), url: storeUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(storeUrl);
      setCopied("share-store");
      setTimeout(() => setCopied(""), 1500);
    } catch (err) {
      if (err?.name !== "AbortError") setError(t.shareError);
    }
  }

  function updateFaq(index, field, value) {
    setStoreFaqs((items) => items.map((faq, itemIndex) => itemIndex === index ? { ...faq, [field]: value } : faq));
    setDesignDirty(true);
  }

  function addFaq() {
    if (storeFaqs.length >= 5) return;
    setStoreFaqs((items) => [...items, { question: "", answer: "" }]);
    setDesignDirty(true);
  }

  function removeFaq(index) {
    setStoreFaqs((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setDesignDirty(true);
  }

  if (checking || !user || sellerAccess === "checking") return null;

  if (sellerAccess !== "active") {
    return <div className="dh-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}><style>{styles}</style><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}><section style={{ maxWidth: 380, textAlign: "center", border: "1px solid #EDEAE0", borderRadius: 18, padding: 24 }}>
      <LangToggle lang={lang} onChange={setLang} className="dh-lang" style={{ display: "block", margin: "0 auto 14px" }} />
      {hasPendingSignupPayment ? (<>
        <strong style={{ display: "block", fontFamily: "Almarai, sans-serif", marginBottom: 8 }}>{t.pendingPaymentTitle}</strong>
        <p style={{ color: "#403D35", fontSize: 13, lineHeight: 1.8, margin: "0 0 16px" }}>{t.pendingPaymentText}</p>
        <a className="dh-btn" href="#store-pay-result/x" style={{ display: "block", marginBottom: 10, textDecoration: "none" }}>{t.checkPaymentStatus}</a>
      </>) : (<>
        <strong style={{ display: "block", fontFamily: "Almarai, sans-serif", marginBottom: 8 }}>{t.storeSetupIncompleteTitle}</strong>
        <p style={{ color: "#403D35", fontSize: 13, lineHeight: 1.8, margin: "0 0 16px" }}>{t.storeSetupIncompleteText}</p>
        <a className="dh-btn" href="#start-store" style={{ display: "block", marginBottom: 10, textDecoration: "none" }}>{t.continueStoreSetup}</a>
      </>)}
      <button className="dh-logout" onClick={handleLogout}>{t.logoutCta}</button>
    </section></main></div>;
  }

  const storeUrl = `${window.location.origin}${window.location.pathname}#store/${slug || user.uid}`;
  const initial = (storeName || t.initialFallback).charAt(0);
  const isTrial = sellerPlan === "trial";
  const trialLimitReached = isTrial && (trialProductClaimed || products.length >= 1);
  const planProductLimit = productLimitForPlan(sellerPlan);
  const planLimitReached = !isTrial && products.length >= planProductLimit;
  const publishedProducts = products.filter((product) => !product.hidden && !product.suspended);
  const hiddenProducts = products.filter((product) => product.hidden || product.suspended);
  const campaignVisitTotal = campaignLinks.reduce((total, link) => total + (Number(link.visits) || 0), 0);
  const topCampaignLink = campaignLinks.reduce((top, link) => !top || (Number(link.visits) || 0) > (Number(top.visits) || 0) ? link : top, null);
  const selectedStoreStyle = STORE_STYLES.find((style) => style.color === storeColor) || STORE_STYLES[0];
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(t.whatsappShareText(storeName || t.myStore, storeUrl))}`;

  // يحدد أهم خطوة ناقصة بمتجر التاجر حاليًا — تُستخدم ببطاقة "خطوتك التالية"
  function getNextStep() {
    const hasProduct = products.length > 0;
    const hasTagline = !!tagline;
    const hasContact = !!(whatsapp || instagram);
    const allDescribed = products.every((p) => !!p.description);
    const hasCoupon = coupons.length > 0;
    const stepsDone = [hasProduct, hasTagline, hasContact, hasProduct ? allDescribed : false, sellerPlan === "basic" ? true : hasCoupon].filter(Boolean).length;

    if (!hasProduct) {
      return {
        key: "add-product",
        badge: t.nextStepBadgeStart,
        title: t.firstProductTitle,
        text: t.firstProductText,
        cta: t.firstProductCta,
        onClick: () => setTab("products"),
        progress: stepsDone,
      };
    }
    if (!hasTagline) {
      return {
        key: "add-tagline",
        badge: t.nextStepBadgeNext,
        title: t.taglineStepTitle,
        text: t.taglineStepText,
        cta: t.taglineStepCta,
        onClick: () => setTab("design"),
        progress: stepsDone,
      };
    }
    if (!hasContact) {
      return {
        key: "add-contact",
        badge: t.nextStepBadgeNext,
        title: t.contactStepTitle,
        text: t.contactStepText,
        cta: t.contactStepCta,
        onClick: () => setTab("design"),
        progress: stepsDone,
      };
    }
    if (!allDescribed) {
      return {
        key: "describe-product",
        badge: t.nextStepBadgeNext,
        title: t.describeStepTitle,
        text: t.describeStepText,
        cta: t.describeStepCta,
        onClick: () => setTab("products"),
        progress: stepsDone,
      };
    }
    if (!hasCoupon) {
      return {
        key: "add-coupon",
        badge: t.nextStepBadgeNext,
        title: t.couponStepTitle,
        text: t.couponStepText,
        cta: t.couponStepCta,
        onClick: () => setTab("coupons"),
        progress: stepsDone,
      };
    }
    return {
      key: "share-store",
      badge: t.nextStepBadgeReady,
      title: t.shareStepTitle,
      text: t.shareStepText,
      cta: t.shareStepCta,
      onClick: () => copyLink(slug || user.uid, "store"),
      progress: stepsDone,
    };
  }

  const nextStep = getNextStep();
  const isSettingsGroup = ["settings", "design", "subscription", "payment", "loyalty"].includes(tab);
  const subscriptionDaysLeft = subscriptionExpiresAt ? Math.ceil((new Date(subscriptionExpiresAt) - new Date()) / (24 * 60 * 60 * 1000)) : null;
  const stalledOrders = sellerOrders.filter((o) => {
    if (o.status !== "draft" || !o.buyerPhone) return false;
    const createdMs = o.createdAt?.toMillis?.();
    return createdMs && Date.now() - createdMs > 30 * 60 * 1000;
  });

  // يطبّق اقتراح المساعد الذكي بعد ما التاجر يضغط زر "تطبيق" — الكتابة الفعلية بقاعدة البيانات تصير هنا فقط
  async function handleApplySuggestion(suggestion) {
    if (suggestion.kind === "improve-product") {
      await updateDoc(doc(db, "products", suggestion.productId), {
        name: suggestion.name,
        description: suggestion.description,
      });
      return;
    }
    if (suggestion.kind === "coupon-idea") {
      const exists = coupons.some((c) => c.code === suggestion.code);
      if (exists) throw new Error("duplicate_code");
      await addDoc(collection(db, "coupons"), {
        ownerId: user.uid,
        code: suggestion.code,
        discountPercent: suggestion.percent,
        productId: null,
        active: true,
        createdAt: serverTimestamp(),
      });
      return;
    }
  }

  return (
    <DebugErrorBoundary>
    <div className="dh-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      {toast && <div className="dh-toast" role="status">{toast}</div>}
      <div className="dh-header">
        <div className="dh-brand">{storeName || t.yourStore} <span>· {t.sellerDashboard} · {STORE_TYPE_LABELS[lang][sellerStoreType] || t.genericProducts}</span></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user.email === ADMIN_EMAIL && (
            <a href="#admin" className="dh-admin-btn">{t.adminPanel}</a>
          )}
          <LangToggle lang={lang} onChange={setLang} className="dh-lang" />
          <button className="dh-logout" onClick={handleLogout}>{t.logoutBtn}</button>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="dh-verify-banner">
          <span>{verificationSent ? t.verificationResent : t.emailNotVerified}</span>
          <button type="button" onClick={resendVerificationEmail} disabled={sendingVerification}>{sendingVerification ? t.sendingEllipsis : verificationSent ? t.resend : t.sendVerificationLink}</button>
        </div>
      )}

      {subscriptionDaysLeft !== null && subscriptionDaysLeft <= 5 && (
        <div className="dh-verify-banner" style={{ background: subscriptionDaysLeft < 0 ? "#F6E9E5" : "#FFF8E9", borderBottomColor: subscriptionDaysLeft < 0 ? "#E3C3B8" : "#EFD9AB", color: subscriptionDaysLeft < 0 ? "#A34839" : "#7A5A17" }}>
          <span>{subscriptionDaysLeft < 0 ? t.subscriptionExpired : t.subscriptionExpiringSoon(subscriptionDaysLeft)}</span>
          <button type="button" onClick={renewSubscription} disabled={renewalBuying}>{renewalBuying ? t.preparingPayment : t.renewNow}</button>
        </div>
      )}

      {isTrial && (
        <div className="dh-verify-banner" style={{ background: "#FFF8E9", borderBottomColor: "#EFD9AB", color: "#7A5A17" }}>
          <span>{trialLimitReached ? t.trialUsedUp : t.trialActive}</span>
          <button type="button" onClick={() => setTab("subscription")}>{t.upgradeSubscription}</button>
        </div>
      )}

      {planLimitReached && (
        <div className="dh-verify-banner" style={{ background: "#FFF8E9", borderBottomColor: "#EFD9AB", color: "#7A5A17" }}>
          <span>{t.planLimitError(planProductLimit)}</span>
          <button type="button" onClick={() => setTab("subscription")}>{t.upgradeSubscription}</button>
        </div>
      )}

      <div className="dh-tabs">
        <button className={"dh-tab" + (tab === "overview" ? " active" : "")} onClick={() => setTab("overview")}>{t.homeTab}</button>
        <button className={"dh-tab" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>{t.productsTab}</button>
        <button className={"dh-tab" + (tab === "orders" ? " active" : "")} onClick={() => setTab("orders")}>{t.ordersTab}</button>
        <button className={"dh-tab" + (tab === "coupons" ? " active" : "")} onClick={() => setTab("coupons")}>{t.couponsTab}</button>
        <button className={"dh-tab" + (isSettingsGroup ? " active" : "")} onClick={() => setTab("settings")}>{t.settingsTab}</button>
      </div>

      <div className="dh-wrap">

        {tab === "overview" && (
          <>
            <section className="dh-studio" style={{ "--studio-color": storeColor }}>
              <div className="dh-studio-kicker">{t.yourSpace}</div>
              <div className="dh-studio-head">
                <div className="dh-studio-logo">{logoUrl ? <img src={logoUrl} alt="" /> : initial}</div>
                <div>
                  <div className="dh-studio-name">{storeName || t.yourStoreNamePlaceholder}</div>
                  <div className="dh-studio-tag">{tagline || t.addSimpleDescription}</div>
                  <div className="dh-studio-meta">{t.styleMeta(lang === "en" ? selectedStoreStyle.nameEn : selectedStoreStyle.name)}</div>
                </div>
              </div>
              <div className="dh-studio-actions">
                <a className="dh-studio-action primary" href={`#store/${slug || user.uid}`} target="_blank" rel="noopener noreferrer"><span>↗</span>{t.openYourStore}</a>
                <button className="dh-studio-action" onClick={shareStore}><span>⌁</span>{copied === "share-store" ? t.copiedShort : t.shareStoreBtn}</button>
                <button className="dh-studio-action" onClick={() => setTab("design")}><span>✦</span>{t.editAppearance}</button>
              </div>
            </section>

            <div className="dh-next">
              <span className="dh-next-badge">{nextStep.badge}</span>
              <div className="dh-next-title">{nextStep.title}</div>
              <div className="dh-next-text">{nextStep.text}</div>
              <div className="dh-next-bar"><div className="dh-next-bar-fill" style={{ width: `${(nextStep.progress / 5) * 100}%` }} /></div>
              <div className="dh-next-step">{t.stepsOf5(nextStep.progress)}</div>
              <button className="dh-next-btn" onClick={nextStep.onClick}>{nextStep.cta}</button>
            </div>

            {stalledOrders.length > 0 && (
              <div className="dh-flag">
                <b>{stalledOrders.length === 1 ? t.stalledOrderSingle : t.stalledOrdersMulti(stalledOrders.length)}</b>
                <span>{t.stalledOrdersHint}</span>
                <button type="button" onClick={() => setTab("orders")}>{t.openFromOrdersTab}</button>
              </div>
            )}

            <div className="dh-figures">
              <div className="dh-figure-main"><b className="mono">{sellerOrders.filter((o) => o.status === "confirmed").reduce((sum, o) => sum + (Number(o.price) || 0), 0).toFixed(2)}</b><span>{t.confirmedSalesLabel}</span></div>
              <div className="dh-figure-side">
                <div><b className="mono">{sellerOrders.filter((o) => o.status !== "draft").length}</b><span>{t.orderSentLabel}</span></div>
                <div><b className="mono">{products.length}</b><span>{t.activeProductLabel}</span></div>
              </div>
            </div>

            <div className="dh-quicklinks">
              <button type="button" onClick={() => setTab("products")}>{t.addProductQuick}</button>
              <span>·</span>
              <button type="button" onClick={() => setTab("design")}>{t.storeDesignQuick}</button>
              <span>·</span>
              <button type="button" onClick={() => copyLink(slug || user.uid, "store")}>
                {copied === "store" + (slug || user.uid) ? t.linkCopiedFull : t.copyStoreLinkBtn}
              </button>
              <span>·</span>
              <button type="button" onClick={shareStore}>
                {copied === "share-store" ? t.linkCopiedFull : t.shareStoreQuick}
              </button>
            </div>

            <section className="dh-share-card">
              <div className="dh-share-head">
                <div>
                  <div className="dh-share-title">{t.shareCenterTitle}</div>
                  <div className="dh-share-sub">{t.shareCenterSub}</div>
                </div>
                <span style={{ fontSize: 18 }}>↗</span>
              </div>
              <div className="dh-share-actions">
                <button className="dh-share-btn primary" onClick={shareStore}>{t.shareBtn}</button>
                <a className="dh-share-btn" href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>
                <button className="dh-share-btn" onClick={() => copyLink(slug || user.uid, "store")}>{copied === "store" + (slug || user.uid) ? t.copiedShort : t.copyLinkBtn}</button>
              </div>
            </section>

            <section className="dh-qr">
              <div className="dh-qr-code"><QRCodeSVG value={storeUrl} size={70} bgColor="#ffffff" fgColor={storeColor} level="M" /></div>
              <div>
                <div className="dh-qr-title">{t.storeCodeTitle}</div>
                <div className="dh-qr-sub">{t.storeCodeSub}</div>
                <div className="dh-qr-actions">
                  <button className="dh-mini-btn" onClick={() => copyLink(slug || user.uid, "store")}>{t.copyLinkBtn}</button>
                  <button className="dh-mini-btn" onClick={shareStore}>{t.shareBtn}</button>
                </div>
              </div>
            </section>

            <section className="dh-product-health">
              <div className="dh-share-head">
                <div>
                  <div className="dh-share-title">{t.productHealthTitle}</div>
                  <div className="dh-share-sub">{t.productHealthSub}</div>
                </div>
                <button className="dh-health-manage" onClick={() => setTab("products")}>{t.manageProducts}</button>
              </div>
              <div className="dh-health-summary">
                <div className="dh-health-number"><b>{publishedProducts.length}</b><span>{t.publishedProductsLabel}</span></div>
                <div className="dh-health-number"><b>{hiddenProducts.length}</b><span>{t.hiddenDraftsLabel}</span></div>
              </div>
              {products.length === 0 ? (
                <button className="dh-share-btn primary" style={{ width: "100%" }} onClick={() => setTab("products")}>{t.addFirstProduct}</button>
              ) : products.slice(0, 3).map((product) => (
                <div className="dh-health-row" key={product.id}>
                  <span className="dh-health-name">{product.name}</span>
                  <span className={`dh-health-state ${product.hidden || product.suspended ? "hidden" : "live"}`}>{product.hidden || product.suspended ? t.hidden : t.published}</span>
                </div>
              ))}
            </section>

            <div className="dh-store-link">
              <div className="dh-store-label">{t.publicStoreLinkLabel}</div>
              <div className="dh-store-row">
                <span className="dh-store-url">{storeUrl}</span>
                <button className="dh-copy" onClick={() => copyLink(slug || user.uid, "store")}>
                  {copied === "store" + (slug || user.uid) ? t.copiedTiny : t.copyTiny}
                </button>
              </div>
            </div>
            <div className="dh-card">
              <div className="dh-title">{t.lastOrdersTitle}</div>
              {sellerOrders.length === 0 && (
                <div className="empty-note">{t.emptyOrdersHint}</div>
              )}
              {sellerOrders.filter((o) => o.status !== "draft").slice(0, 5).map((o) => (
                <div className="dh-item" key={o.id}>
                  <div className="dh-item-top">
                    <span className="dh-item-name">{o.productName}</span>
                    <span className="dh-item-price">{Number(o.price).toFixed(2)} {curr}</span>
                  </div>
                  <div className="dh-item-stock">{o.buyerPhone}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            {trialLimitReached ? (
              <div className="dh-card" style={{ borderTop: "3px solid #9C6D1F", textAlign: "center" }}>
                <div className="dh-title" style={{ marginBottom: 6 }}>{t.trialLimitTitle}</div>
                <div className="dh-hint" style={{ marginBottom: 14 }}>{t.trialLimitHint}</div>
                <button className="dh-btn" type="button" onClick={() => setTab("subscription")}>{t.upgradeNow}</button>
              </div>
            ) : (
            <details className="dh-section" open={products.length === 0} ref={addProductRef}>
              <summary><div className="dh-section-summary"><b>{t.addNewProduct}</b><span>{t.openFormHint}</span></div></summary>
              <div className="dh-section-body">
              {error && <div className="dh-error">{error}</div>}
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="dh-field">
                  <label>{t.productNameLabel}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="dh-field">
                  <label>{t.priceLabel}</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <div className="dh-hint">{t.freeFileHint}</div>
                </div>
                <div className="dh-field">
                  <label>{t.categoryLabel}</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t.generalCategory} />
                </div>
                <div className="dh-field">
                  <label>{t.shortDescLabel}</label>
                  <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
                  {activeAddOns.includes("aiTools") ? (
                    <button className="dh-ai-btn" type="button" onClick={() => generateDescriptionDraft("new")} disabled={descriptionDraftLoading === "new"} style={{ marginTop: 8 }}>
                      {descriptionDraftLoading === "new" ? t.preparingDraft : t.writeDescriptionDraft}
                    </button>
                  ) : (
                    <div className="dh-hint" style={{ marginTop: 8, background: "#FFF8E9", borderRadius: 10, padding: "9px 12px" }}>
                      ✨ {t.aiToolsUpsellPrefix} <button type="button" onClick={() => setTab("subscription")} style={{ background: "none", border: 0, padding: 0, color: "#163F2E", fontWeight: 800, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>{t.subscriptionLinkLabel}</button> {t.aiToolsUpsellSuffix}
                    </div>
                  )}
                  {descriptionDraftError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{descriptionDraftError}</div>}
                  {descriptionDraftTarget === "new" && descriptionDraft && <div className="dh-ai-draft"><div className="dh-ai-draft-title">{t.draftOnlyEditable}</div><p>{descriptionDraft}</p><div className="dh-ai-actions"><button className="dh-ai-btn primary" type="button" onClick={() => useDescriptionDraft("new")}>{t.useThisDraft}</button><button className="dh-ai-btn" type="button" onClick={() => { setDescriptionDraft(""); setDescriptionDraftTarget(""); }}>{t.cancel}</button></div></div>}
                </div>
                <div className="dh-field">
                  <label>{t.productImagesLabel}</label>
                  <div className="dh-images-row">
                    {productImages.map((url) => (
                      <div className="dh-image-thumb-wrap" key={url}>
                        <img src={url} alt="" className="dh-image-thumb" />
                        <button type="button" className="dh-image-remove" onClick={() => removeProductImage(url)}>✕</button>
                      </div>
                    ))}
                    {productImages.length < 2 && (
                      <label className="dh-image-add">
                        {imagesUploading ? "..." : "+"}
                        <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleProductImageUpload} disabled={imagesUploading} />
                      </label>
                    )}
                  </div>
                  {imagesError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{imagesError}</div>}
                </div>
                <div className="dh-field">
                  <label>{t.productTypeLabel}</label>
                  <div className="dh-type-toggle">
                    <button
                      type="button"
                      className={"dh-type-btn" + (productType === "file" ? " active" : "")}
                      onClick={() => setProductType("file")}
                    >
                      {t.fileType}
                    </button>
                    <button
                      type="button"
                      className={"dh-type-btn" + (productType === "code" ? " active" : "")}
                      onClick={() => setProductType("code")}
                    >
                      {t.codeType}
                    </button>
                  </div>
                </div>
                {productType === "file" ? (
                  <div className="dh-field">
                    <label>{t.productFileLabel}</label>
                    <input key={fileInputKey} type="file" onChange={handleFilePick} />
                    {productFile && (
                      <div className="dh-file-picked">
                        ✓ {productFile.name} ({(productFile.size / 1024 / 1024).toFixed(1)} {t.mbUnit})
                      </div>
                    )}
                    <div className="dh-hint">{t.fileSecureHint(MAX_PRODUCT_FILE_MB)}</div>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, fontSize: 12.5, cursor: "pointer" }}>
                      <input type="checkbox" checked={requiresActivation} onChange={(e) => setRequiresActivation(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>{t.interactiveFileLabel}</span>
                    </label>
                  </div>
                ) : (
                  <div className="dh-field">
                    <label>{t.pasteCodesLabel}</label>
                    <textarea rows="5" value={codesText} onChange={(e) => setCodesText(e.target.value)} placeholder={"CODE-001\nCODE-002\nCODE-003"} style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace" }} />
                    <div className="dh-hint">{t.eachCustomerCodeHint}</div>
                  </div>
                )}
                <button className="dh-item-action" type="button" onClick={() => setPreviewOpen(true)} disabled={!name || price === ""} style={{ width: "100%", marginBottom: 8 }}>
                  {t.previewProduct}
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="dh-item-action" type="button" onClick={(e) => handleAddProduct(e, false)} disabled={saving} style={{ flex: 1 }}>
                    {saving ? "..." : t.saveAsDraft}
                  </button>
                  <button className="dh-btn" type="button" onClick={(e) => handleAddProduct(e, true)} disabled={saving} style={{ flex: 1 }}>
                    {saving ? (uploadingFile ? t.uploadingFileMsg : t.publishingMsg) : t.publishProduct}
                  </button>
                </div>
                <div className="dh-hint" style={{ marginTop: 8, textAlign: "center" }}>
                  {t.draftHintBottom}
                </div>
              </form>
              </div>
            </details>
            )}

            <div className="dh-card">
              <div className="dh-title-row">
                <div className="dh-title">{t.yourProductsTitle}</div>
                <div className="dh-title-count mono">{products.length} {t.productCountUnit}</div>
              </div>

              {products.length > 0 && (
                <>
                  <div className="dh-field">
                    <input type="text" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder={t.searchByName} />
                  </div>
                  <div className="dh-type-toggle" style={{ marginBottom: 14 }}>
                    <button type="button" className={"dh-type-btn" + (productFilter === "all" ? " active" : "")} onClick={() => setProductFilter("all")}>
                      {t.allFilter} ({products.length})
                    </button>
                    <button type="button" className={"dh-type-btn" + (productFilter === "visible" ? " active" : "")} onClick={() => setProductFilter("visible")}>
                      {t.visibleFilter} ({products.filter((p) => !p.hidden).length})
                    </button>
                    <button type="button" className={"dh-type-btn" + (productFilter === "hidden" ? " active" : "")} onClick={() => setProductFilter("hidden")}>
                      {t.hiddenFilter} ({products.filter((p) => p.hidden).length})
                    </button>
                  </div>
                </>
              )}

              {products.length === 0 && <div className="empty-note">{t.noProductsYet}</div>}
              {products.length > 0 && filteredProducts.length === 0 && <div className="empty-note">{t.noMatchFilter}</div>}
              {orderedProducts.map((p) => (
                <div className="dh-item" key={p.id}>
                  {editingId === p.id ? (
                    <div className="dh-edit-form">
                      <div className="dh-field">
                        <label>{t.productNameLabel}</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>{t.priceLabel}</label>
                        <input type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>{t.categoryLabelShort}</label>
                        <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                      </div>
                      <div className="dh-field">
                        <label>{t.shortDescLabelShort}</label>
                        <textarea rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        {activeAddOns.includes("aiTools") ? (
                          <button className="dh-ai-btn" type="button" onClick={() => generateDescriptionDraft(p.id, p)} disabled={descriptionDraftLoading === p.id} style={{ marginTop: 8 }}>
                            {descriptionDraftLoading === p.id ? t.preparingDraft : t.writeDescriptionDraft}
                          </button>
                        ) : (
                          <div className="dh-hint" style={{ marginTop: 8, background: "#FFF8E9", borderRadius: 10, padding: "9px 12px" }}>
                            ✨ {t.aiToolsUpsellPrefix} <button type="button" onClick={() => setTab("subscription")} style={{ background: "none", border: 0, padding: 0, color: "#163F2E", fontWeight: 800, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>{t.subscriptionLinkLabel}</button> {t.aiToolsUpsellSuffix}
                          </div>
                        )}
                        {descriptionDraftError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{descriptionDraftError}</div>}
                        {descriptionDraftTarget === p.id && descriptionDraft && <div className="dh-ai-draft"><div className="dh-ai-draft-title">{t.editDraftOnlyNoAutoSave}</div><p>{descriptionDraft}</p><div className="dh-ai-actions"><button className="dh-ai-btn primary" type="button" onClick={() => useDescriptionDraft(p.id)}>{t.useThisDraft}</button><button className="dh-ai-btn" type="button" onClick={() => { setDescriptionDraft(""); setDescriptionDraftTarget(""); }}>{t.cancel}</button></div></div>}
                      </div>
                      {p.type !== "code" && (
                        <div className="dh-hint" style={{ marginBottom: 10 }}>
                          {t.editNoteChangeFile}
                        </div>
                      )}
                      {p.type === "file" && (
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, fontSize: 12.5, cursor: "pointer" }}>
                          <input type="checkbox" checked={editRequiresActivation} onChange={(e) => setEditRequiresActivation(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ flex: 1, minWidth: 0 }}>{t.interactiveFileLabelShort}</span>
                        </label>
                      )}
                      <div className="dh-edit-actions">
                        <button className="dh-item-action" onClick={cancelEdit} type="button">{t.cancel}</button>
                        <button className="dh-item-action primary" onClick={() => saveEdit(p.id)} disabled={editSaving} type="button">
                          {editSaving ? t.savingEllipsis : t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="dh-item-top">
                        <span className="dh-item-name">{p.name}{p.featured && <span className="dh-featured-tag">{t.featuredTag}</span>}{p.hidden && <span style={{ color: "#7A766A", fontWeight: 400 }}> ({t.hidden})</span>}</span>
                        <span className="dh-item-price">{p.price} {curr}</span>
                      </div>
                      {p.type === "code" && (
                        <div className="dh-item-stock">
                          {t.stockLabel} {p.codesCount || 0} {t.codeUnit}{Number(p.codesCount || 0) === 0 && t.outOfStock}
                        </div>
                      )}
                      {p.type === "code" && restockingId === p.id && (
                        <div className="dh-field" style={{ marginTop: 8 }}>
                          <label>{t.pasteNewCodesLabel}</label>
                          <textarea rows="4" value={restockText} onChange={(e) => setRestockText(e.target.value)} placeholder={"CODE-004\nCODE-005"} style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace" }} />
                          {restockError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{restockError}</div>}
                          <div className="dh-edit-actions" style={{ marginTop: 8 }}>
                            <button className="dh-item-action" onClick={cancelRestock} type="button">{t.cancel}</button>
                            <button className="dh-item-action primary" onClick={() => saveRestock(p.id)} disabled={restockSaving} type="button">
                              {restockSaving ? t.addingEllipsis : t.addCodes}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="dh-item-link">
                        <span className="dh-item-link-text"><span className="dh-item-link-label">{t.productLinkLabel}</span><span className="dh-item-link-code">{`#product/${p.id}`}</span></span>
                        <button className="dh-item-link-btn" onClick={() => copyLink(p.id, "product")}>
                          {copied === "product" + p.id ? t.copiedTiny : t.copyLink}
                        </button>
                      </div>
                      <button className="dh-ai-btn" onClick={() => generateAdCopy(p)} disabled={adCopyLoadingId === p.id} type="button" style={{ width: "100%", marginTop: 9 }}>
                        {adCopyLoadingId === p.id ? t.preparingAd : t.writeAdDraft}
                      </button>
                      {adCopyError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{adCopyError}</div>}
                      {adCopyProductId === p.id && adCopy && <div className="dh-ai-draft"><div className="dh-ai-draft-title">{t.adDraftOnly}</div><p>{adCopy}</p><div className="dh-ai-actions"><button className="dh-ai-btn primary" onClick={copyAdDraft} type="button">{copied === "ad-copy" ? t.copiedText : t.copyTextBtn}</button><button className="dh-ai-btn" onClick={() => { setAdCopy(""); setAdCopyProductId(""); }} type="button">{t.close}</button></div></div>}
                      <div className="dh-item-actions">
                        <button className="dh-item-action" onClick={() => startEdit(p)} type="button">{t.edit}</button>
                        {!trialLimitReached && (
                          <button className="dh-item-action" onClick={() => duplicateProduct(p)} type="button">{t.duplicateAsNew}</button>
                        )}
                        {p.type === "code" && restockingId !== p.id && (
                          <button className="dh-item-action" onClick={() => startRestock(p.id)} type="button">{t.addCodesBtn}</button>
                        )}
                        <button className="dh-item-action" onClick={() => toggleHidden(p.id, p.hidden)} disabled={togglingHiddenId === p.id} type="button">
                          {togglingHiddenId === p.id ? "..." : (p.hidden ? t.show : t.unhide)}
                        </button>
                        <button className="dh-item-action" onClick={() => toggleFeatured(p.id, !!p.featured)} disabled={togglingHiddenId === p.id} type="button">
                          {p.featured ? t.unfeature : t.feature}
                        </button>
                        {confirmDeleteId === p.id ? (
                          <button className="dh-item-action danger" onClick={() => confirmDelete(p.id)} disabled={deletingId === p.id} type="button">
                            {deletingId === p.id ? t.deletingEllipsis : t.confirmDeleteQuestion}
                          </button>
                        ) : (
                          <button className="dh-item-action danger" onClick={() => setConfirmDeleteId(p.id)} type="button">{t.delete}</button>
                        )}
                      </div>
                      <div className="dh-sort-actions">
                        <button className="dh-sort-btn" onClick={() => moveProduct(p.id, -1)} type="button">{t.moveUp}</button>
                        <button className="dh-sort-btn" onClick={() => moveProduct(p.id, 1)} type="button">{t.moveDown}</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <details className="dh-section">
              <summary><div className="dh-section-summary"><b>{t.trackingLinksTitle}</b><span>{campaignLinks.length > 0 ? t.trackingLinksSummary(campaignVisitTotal, campaignLinks.length) : t.trackingLinksEmpty}</span></div></summary>
              <div className="dh-section-body">
              <div className="dh-hint" style={{ marginBottom: 14 }}>{t.trackingLinksHint}</div>
              {campaignLinks.length > 0 && <div className="dh-product-health" style={{ marginBottom: 14 }}><div className="dh-title" style={{ fontSize: 12 }}>{t.visitsSummaryTitle}</div><div className="dh-health-summary"><div className="dh-health-number"><b>{campaignVisitTotal}</b><span>{t.totalVisits}</span></div><div className="dh-health-number"><b>{campaignLinks.length}</b><span>{t.yourCreatedLinks}</span></div></div>{topCampaignLink && <div className="dh-health-row"><span className="dh-health-name">{t.mostVisitedLink(topCampaignLink.label)}</span><span className="dh-health-state live">{Number(topCampaignLink.visits) || 0} {t.visitUnit}</span></div>}<div className="dh-hint">{t.trackingLinksNote}</div></div>}
              {campaignError && <div className="dh-error">{campaignError}</div>}
              {campaignNotice && <div className="dh-success">{campaignNotice}</div>}
              {publishedProducts.length === 0 ? <div className="empty-note">{t.publishProductFirst}</div> : <>
                <div className="dh-field"><label>{t.productLabel}</label><select value={campaignProductId} onChange={(event) => setCampaignProductId(event.target.value)}><option value="">{t.choosePublishedProduct}</option>{publishedProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
                <div className="dh-field"><label>{t.publishLocationLabel}</label><input value={campaignLabel} onChange={(event) => setCampaignLabel(event.target.value)} placeholder={t.publishLocationPlaceholder} maxLength="60" /></div>
                <button type="button" className="dh-item-action primary" style={{ width: "100%" }} onClick={createCampaignLink} disabled={campaignSaving}>{campaignSaving ? t.creatingEllipsis : t.createTrackingLink}</button>
              </>}
              {campaignLinks.length > 0 && <div style={{ marginTop: 16 }}>{campaignLinks.map((link) => <div className="dh-item" key={link.id}><div className="dh-item-top"><span className="dh-item-name">{link.label}</span><span className="dh-item-price">{Number(link.visits) || 0} {t.visitUnit}</span></div><div className="dh-hint">{products.find((product) => product.id === link.productId)?.name || t.productUnavailable}</div><div className="dh-item-link"><span className="dh-item-link-text"><span className="dh-item-link-label">{t.trackingLinkLabel}</span><span className="dh-item-link-code">{trackedLinkUrl(link.id)}</span></span><button className="dh-item-link-btn" type="button" onClick={() => copyCampaignLink(link.id)}>{copied === `campaign${link.id}` ? t.copiedText : t.copyLink}</button></div><div className="dh-item-actions"><button className="dh-item-action danger" type="button" onClick={() => deleteCampaignLink(link.id)} disabled={deletingCampaignId === link.id}>{deletingCampaignId === link.id ? t.deletingEllipsis : t.deleteLinkBtn}</button></div></div>)}</div>}
              </div>
            </details>

            <details className="dh-section">
              <summary><div className="dh-section-summary"><b>{t.bundlesTitle}</b><span>{activeBundles.length > 0 ? t.bundlesSummary(activeBundles.length) : t.bundlesEmpty}</span></div></summary>
              <div className="dh-section-body">
              <div className="dh-hint" style={{ marginBottom: 14 }}>
                {t.bundlesHint}
              </div>
              {bundleSaved && <div className="dh-success" role="status">{t.bundleSavedDraft}</div>}
              {bundleActionNotice && <div className="dh-success" role="status">{bundleActionNotice}</div>}
              {bundleError && <div className="dh-error">{bundleError}</div>}
              {products.length < 2 ? (
                <div className="empty-note">{t.needTwoProducts}</div>
              ) : (
                <>
                  <div className="dh-field">
                    <label>{t.bundleNameLabel}</label>
                    <input value={bundleName} onChange={(event) => setBundleName(event.target.value)} placeholder={t.bundleNamePlaceholder} maxLength="120" />
                  </div>
                  <div className="dh-field">
                    <label>{t.bundlePriceLabel}</label>
                    <input type="number" min="0.01" step="0.01" value={bundlePrice} onChange={(event) => setBundlePrice(event.target.value)} />
                  </div>
                  <div className="dh-field">
                    <label>{t.shortDescLabel}</label>
                    <textarea rows="2" value={bundleDescription} onChange={(event) => setBundleDescription(event.target.value)} placeholder={t.bundleDescPlaceholder} maxLength="500" />
                  </div>
                  <div className="dh-field">
                    <label>{t.chooseBundleProducts}</label>
                    <div style={{ display: "grid", gap: 8 }}>
                      {products.map((product) => (
                        <label key={product.id} className="dh-item-action" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
                          <span>{product.name} · {Number(product.price).toFixed(2)} {curr}</span>
                          <input type="checkbox" checked={bundleProductIds.includes(product.id)} onChange={() => toggleBundleProduct(product.id)} />
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="button" className="dh-item-action primary" onClick={handleCreateBundle} disabled={bundleSaving} style={{ width: "100%" }}>
                    {bundleSaving ? t.savingEllipsis : t.saveBundleAsDraft}
                  </button>
                </>
              )}
              {activeBundles.length > 0 && <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                <div className="dh-title" style={{ fontSize: 12 }}>{t.savedBundlesTitle}</div>
                {activeBundles.map((bundle) => <div className="dh-item" key={bundle.id} style={{ margin: 0 }}>
                  <div className="dh-item-top"><span className="dh-item-name">{bundle.name}<span className="dh-featured-tag" style={bundle.hidden ? {} : { background: "#EAF0EB", color: "#37724B" }}>{bundle.hidden ? t.draftStatus : t.publishedStatus}</span></span><span className="dh-item-price">{Number(bundle.price).toFixed(2)} {curr}</span></div>
                  <div className="dh-hint">{bundle.productIds?.length || 0} {t.productsUnit} · {bundle.hidden ? t.willNotShowUntilPublished : t.publishedCanOrder}</div>
                  {!bundle.hidden && <div className="dh-hint" style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace", fontSize: 10.5 }}>{`${window.location.origin}/#bundle/${bundle.id}`}</div>}
                  {confirmBundleDeleteId === bundle.id ? <div className="dh-item-actions">
                    <button className="dh-item-action danger" type="button" onClick={() => setConfirmBundleDeleteId(null)}>{t.cancel}</button>
                    <button className="dh-item-action danger" type="button" onClick={() => confirmDeleteBundle(bundle.id)} disabled={deletingBundleId === bundle.id}>{deletingBundleId === bundle.id ? t.deletingEllipsis : t.confirmDeleteBundleQuestion}</button>
                  </div> : <div className="dh-item-actions">
                    <button className="dh-item-action primary" type="button" onClick={() => toggleBundlePublished(bundle)} disabled={publishingBundleId === bundle.id}>{publishingBundleId === bundle.id ? t.updatingEllipsis : bundle.hidden ? t.publishBundle : t.unpublish}</button>
                    {!bundle.hidden && <button className="dh-item-action" type="button" onClick={() => copyBundleLink(bundle.id)}>{copiedBundleId === bundle.id ? t.linkCopiedFull : t.copyBundleLink}</button>}
                    <button className="dh-item-action" type="button" onClick={() => toggleBundleArchived(bundle)} disabled={togglingBundleId === bundle.id}>{togglingBundleId === bundle.id ? t.archivingEllipsis : t.archiveBundle}</button>
                    <button className="dh-item-action danger" type="button" onClick={() => setConfirmBundleDeleteId(bundle.id)}>{t.deletePermanently}</button>
                  </div>}
                </div>)}
              </div>}
              {archivedBundles.length > 0 && <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                <div className="dh-title" style={{ fontSize: 12 }}>{t.archivedBundlesTitle}</div>
                {archivedBundles.map((bundle) => <div className="dh-item" key={bundle.id} style={{ margin: 0 }}>
                  <div className="dh-item-top"><span className="dh-item-name">{bundle.name}<span className="dh-featured-tag">{t.archiveTag}</span></span><span className="dh-item-price">{Number(bundle.price).toFixed(2)} {curr}</span></div>
                  <div className="dh-hint">{t.savedForYouOnly}</div>
                  {confirmBundleDeleteId === bundle.id ? <div className="dh-item-actions">
                    <button className="dh-item-action danger" type="button" onClick={() => setConfirmBundleDeleteId(null)}>{t.cancel}</button>
                    <button className="dh-item-action danger" type="button" onClick={() => confirmDeleteBundle(bundle.id)} disabled={deletingBundleId === bundle.id}>{deletingBundleId === bundle.id ? t.deletingEllipsis : t.confirmDeleteBundleQuestion}</button>
                  </div> : <div className="dh-item-actions">
                    <button className="dh-item-action" type="button" onClick={() => toggleBundleArchived(bundle)} disabled={togglingBundleId === bundle.id}>{togglingBundleId === bundle.id ? t.unarchiving : t.unarchiveBundle}</button>
                    <button className="dh-item-action danger" type="button" onClick={() => setConfirmBundleDeleteId(bundle.id)}>{t.deletePermanently}</button>
                  </div>}
                </div>)}
              </div>}
              </div>
            </details>
          </>
        )}

        {tab === "coupons" && (
          <>
            <p className="dh-hint" style={{ marginBottom: 16, lineHeight: 1.9 }}>
              {t.autoWelcomeCouponHint} <button type="button" onClick={() => setTab("loyalty")} style={{ background: "none", border: 0, padding: 0, color: "#163F2E", fontWeight: 800, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>{t.settingsWord}</button>.
            </p>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 16 }}>{t.addNewCouponTitle}</div>
              {couponError && <div className="dh-error">{couponError}</div>}
              <form onSubmit={handleAddCoupon}>
                <div className="dh-field">
                  <label>{t.couponCodeLabel}</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t.couponCodePlaceholder}
                    style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace" }}
                  />
                  <div className="dh-hint">{t.couponCodeHint}</div>
                </div>
                <div className="dh-field">
                  <label>{t.discountPercentLabel}</label>
                  <input type="number" value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} placeholder="20" />
                </div>
                <div className="dh-field">
                  <label>{t.appliesTo}</label>
                  <select value={couponScope} onChange={(e) => setCouponScope(e.target.value)}>
                    <option value="all">{t.allYourProducts}</option>
                    {products.map((p) => (
                      <option value={p.id} key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button className="dh-btn" type="submit" disabled={couponSaving}>
                  {couponSaving ? t.savingEllipsis : t.createCode}
                </button>
              </form>
            </div>

            <div className="dh-card">
              <div className="dh-title-row">
                <div className="dh-title">{t.yourCurrentCodesTitle}</div>
                <div className="dh-title-count mono">{coupons.length}</div>
              </div>
              {coupons.length === 0 && <div className="empty-note">{t.noCouponsYet}</div>}
              {coupons.map((c) => (
                <div className="cp-item" key={c.id}>
                  <div className="cp-item-top">
                    <span className="cp-code">{c.code}</span>
                    <span className="cp-percent">{t.discountLabel(c.discountPercent)}</span>
                  </div>
                  <div className="cp-scope">{couponScopeLabel(c)}</div>
                  <div className="dh-item-actions">
                    <button
                      className="dh-item-action danger"
                      disabled={deletingCouponId === c.id}
                      onClick={() => deleteCoupon(c.id)}
                    >
                      {deletingCouponId === c.id ? t.deletingEllipsis : t.deleteCode}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "orders" && <Orders ownerId={user.uid} onAddProduct={() => setTab("products")} storeName={storeName} lang={lang} />}

        {tab === "settings" && (
          <>
            <button className="dh-settings-row" type="button" onClick={() => setTab("payment")}>
              <div><b>{t.transferInstructions}</b><span>{t.transferInstructionsSub}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
            <button className="dh-settings-row" type="button" onClick={() => setTab("gateway")}>
              <div><b>{t.yourPaymentGateway}</b><span>{gatewayConnected ? t.gatewayConnectedSub : t.gatewayNotConnectedSub}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
            <button className="dh-settings-row" type="button" onClick={() => setTab("loyalty")}>
              <div><b>{t.autoWelcomeCoupon}</b><span>{repeatCouponEnabled ? t.activePercentLabel(repeatCouponPercent) : t.stoppedNow}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
            <button className="dh-settings-row" type="button" onClick={() => setTab("design")}>
              <div><b>{t.storeIdentity}</b><span>{t.storeIdentitySub}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
            <button className="dh-settings-row" type="button" onClick={() => setTab("domain")}>
              <div><b>{t.yourLinkAndDomain}</b><span>{customDomainSlug ? `${customDomainSlug}.monah-app.com` : t.freeLinkActive}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
            <button className="dh-settings-row" type="button" onClick={() => setTab("subscription")}>
              <div><b>{t.subscriptionAndPlan}</b><span>{t.basicPlanLabel(BASE_MONTHLY_PRICE.toFixed(2))}</span></div>
              <span className="dh-settings-chev">‹</span>
            </button>
          </>
        )}

        {tab === "payment" && (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 10 }}>{t.transferInstructionsForCustomers}</div>
              <p className="dh-hint" style={{ marginBottom: 12 }}>{t.transferInstructionsHint}</p>
              <div className="dh-field">
                <label>{t.generalNoteLabel}</label>
                <textarea rows="4" value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} placeholder={t.generalNotePlaceholder} maxLength={800} />
              </div>
              <div className="dh-field">
                <label>{t.bankNameLabel}</label>
                <input type="text" value={paymentBankName} onChange={(e) => setPaymentBankName(e.target.value)} placeholder={t.bankNamePlaceholder} maxLength={80} />
              </div>
              <div className="dh-field">
                <label>{t.accountHolderLabel}</label>
                <input type="text" value={paymentAccountHolder} onChange={(e) => setPaymentAccountHolder(e.target.value)} placeholder={t.accountHolderPlaceholder} maxLength={80} />
              </div>
              <div className="dh-field">
                <label>{t.accountNumberLabel}</label>
                <input type="text" value={paymentAccountNumber} onChange={(e) => setPaymentAccountNumber(e.target.value)} placeholder={t.accountNumberPlaceholder} style={{ direction: "ltr", textAlign: "right" }} maxLength={40} />
              </div>
              <div className="dh-field">
                <label>{t.phoneNumberLabel}</label>
                <input type="text" value={paymentPhoneNumber} onChange={(e) => setPaymentPhoneNumber(e.target.value)} placeholder="96891234567" style={{ direction: "ltr", textAlign: "right" }} maxLength={20} />
                <div className="dh-hint">{t.phoneNumberHint}</div>
              </div>
              <div className="dh-field">
                <label>{t.notifyEmailLabel}</label>
                <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder={t.notifyEmailPlaceholder} style={{ direction: "ltr", textAlign: "right" }} maxLength={160} />
                <div className="dh-hint">{t.notifyEmailHint}</div>
                <div className="dh-hint">{t.spamWarning}</div>
              </div>
              <button className="dh-btn" type="button" disabled={savingPayment} onClick={savePaymentInstructions}>{savingPayment ? t.savingEllipsis : t.saveTransferInstructions}</button>
              {paymentMessage && <div className={paymentMessage === t.paymentInstructionsSaved ? "dh-hint" : "dh-error"} style={{ marginTop: 8 }}>{paymentMessage}</div>}
            </div>
          </>
        )}

        {tab === "gateway" && (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 10 }}>{t.yourPaymentGatewayTitle}</div>
              <p className="dh-hint" style={{ marginBottom: 12 }}>
                {t.gatewayIntro}
              </p>
              {!activeAddOns.includes("digitalSelling") && (
                <div className="dh-hint" style={{ marginBottom: 12, background: "#FFF8E9", borderRadius: 10, padding: "9px 12px" }}>
                  {t.gatewayUpsellPrefix} <button type="button" onClick={() => setTab("subscription")} style={{ background: "none", border: 0, padding: 0, color: "#163F2E", fontWeight: 800, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>{t.subscriptionLinkLabel}</button> {t.gatewayUpsellSuffix}
                </div>
              )}
              {gatewayConnected ? (
                <>
                  <div className="dh-hint" style={{ marginBottom: 12 }}>{t.gatewayConnectedNowWorking}</div>
                  <button className="dh-btn" type="button" disabled={savingGateway} onClick={disconnectGateway}>{savingGateway ? t.cancelingEllipsis : t.cancelLinking}</button>
                </>
              ) : (
                <>
                  <div className="dh-field">
                    <label>{t.apiKeyLabel}</label>
                    <input type="password" value={ompayApiKeyInput} onChange={(e) => setOmpayApiKeyInput(e.target.value)} placeholder={t.apiKeyPlaceholder} autoComplete="off" />
                  </div>
                  <div className="dh-field">
                    <label>{t.apiSecretLabel}</label>
                    <input type="password" value={ompayApiSecretInput} onChange={(e) => setOmpayApiSecretInput(e.target.value)} placeholder={t.apiKeyPlaceholder} autoComplete="off" />
                  </div>
                  <button className="dh-btn" type="button" disabled={savingGateway} onClick={saveGateway}>{savingGateway ? t.linkingEllipsis : t.linkGateway}</button>
                </>
              )}
              {gatewayMessage && <div className={(gatewayMessage === t.gatewayConnectedMsg || gatewayMessage === t.gatewayDisconnectedMsg) ? "dh-hint" : "dh-error"} style={{ marginTop: 8 }}>{gatewayMessage}</div>}
            </div>
          </>
        )}

        {tab === "domain" && (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>

            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 10 }}>{t.freeOptionTitle}</div>
              <p className="dh-hint" style={{ marginBottom: 12 }}>{t.freeOptionText}</p>
              <div className="dh-store-label">{t.publicStoreLinkLabel}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="dh-store-url">{storeUrl}</span>
              </div>
              <button className="dh-btn" type="button" style={{ marginTop: 12 }} onClick={() => copyLink(slug || user.uid, "store")}>
                {copied === "store" + (slug || user.uid) ? t.linkCopiedFull : t.copyLinkBtn}
              </button>
            </div>

            <div className="dh-card" style={{ borderTop: "3px solid #163F2E" }}>
              <div className="dh-title-row">
                <div>
                  <div className="dh-title">{t.paidOptionTitle}</div>
                  <div className="dh-hint" style={{ marginTop: 5 }}>{t.paidOptionText}</div>
                </div>
                <b className="mono" style={{ color: "#163F2E", whiteSpace: "nowrap" }}>+{CUSTOM_DOMAIN_MONTHLY_PRICE.toFixed(2)} {curr} {t.monthlySuffix}</b>
              </div>
              <div className="dh-hint" style={{ marginTop: 8, background: "#F7F7F2", borderRadius: 10, padding: "9px 12px" }}>
                {t.domainClarification} <code>{lang === "ar" ? "اسمك" : "yourname"}.monah-app.com</code>{t.domainClarificationSuffix}
              </div>

              {customDomainSlug ? (
                <>
                  <div className="dh-store-label" style={{ marginTop: 12 }}>{t.currentDomainLabel}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="dh-store-url" style={{ direction: "ltr" }}>{`https://${customDomainSlug}.monah-app.com`}</span>
                  </div>
                  {customDomainExpiresAt && <div className="dh-hint" style={{ marginTop: 8 }}>{t.domainValidUntil(customDomainExpiresAt)}</div>}
                </>
              ) : (
                <>
                  <div className="dh-field" style={{ marginTop: 12 }}>
                    <label>{t.chooseDomainName}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="text"
                        value={domainSlugInput}
                        onChange={(e) => { setDomainSlugInput(e.target.value); setDomainAvailable(null); setDomainMessage(""); }}
                        placeholder="hind"
                        style={{ direction: "ltr", textAlign: "right" }}
                      />
                      <span className="dh-hint" style={{ whiteSpace: "nowrap" }}>.monah-app.com</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dh-btn" type="button" disabled={domainChecking} onClick={checkDomainSlug}>
                      {domainChecking ? t.checkingEllipsis : t.checkAvailability}
                    </button>
                    <button className="dh-btn" type="button" disabled={domainAvailable !== true || domainBuying} onClick={buyDomain}>
                      {domainBuying ? t.preparingPayment : t.payAndActivateLink(CUSTOM_DOMAIN_MONTHLY_PRICE.toFixed(2))}
                    </button>
                  </div>
                  {domainMessage && <div className={domainAvailable ? "dh-hint" : "dh-error"} style={{ marginTop: 8 }}>{domainMessage}</div>}
                </>
              )}
            </div>
          </>
        )}

        {tab === "loyalty" && (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>
            <div className="dh-card">
              <div className="dh-title" style={{ marginBottom: 10 }}>{t.autoWelcomeCouponTitle}</div>
              <p className="dh-hint" style={{ marginBottom: 12 }}>{t.autoWelcomeCouponHint2}</p>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={repeatCouponEnabled} onChange={(e) => setRepeatCouponEnabled(e.target.checked)} />
                <span>{t.enableAutoWelcomeCoupon}</span>
              </label>
              {repeatCouponEnabled && (
                <div className="dh-field">
                  <label>{t.discountPercentLabel}</label>
                  <input type="number" min="1" max="90" value={repeatCouponPercent} onChange={(e) => setRepeatCouponPercent(e.target.value)} />
                </div>
              )}
              <button className="dh-btn" type="button" disabled={repeatCouponSaving} onClick={saveRepeatCouponSettings}>
                {repeatCouponSaving ? t.savingEllipsis : t.saveSetting}
              </button>
              {repeatCouponMessage && <div className={repeatCouponMessage === t.savedShort ? "dh-hint" : "dh-error"} style={{ marginTop: 8 }}>{repeatCouponMessage}</div>}
            </div>
          </>
        )}

        {tab === "design" && (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>
            <div className="ds-preview">
              <div className="ds-preview-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{`monah-app.com/#store/${slug || user.uid.slice(0, 8) + "..."}`}</span>
                <a className="ds-view-btn" style={{ padding: "4px 10px", fontSize: 10 }} href={`#store/${slug || user.uid}`} target="_blank" rel="noopener noreferrer">
                  {t.viewStore}
                </a>
              </div>
              {coverUrl && (
                <div className="ds-cover-preview">
                  <img src={coverUrl} alt={t.storeCoverAlt} />
                </div>
              )}
              <div className="ds-preview-body">
                {logoUrl
                  ? <img src={logoUrl} alt={t.storeLogoAlt} className="ds-preview-logo-img" />
                  : <div className="ds-preview-logo" style={{ background: storeColor }}>{initial}</div>}
                <div className="ds-preview-name" style={{ color: storeColor }}>{storeName || t.yourStoreNamePlaceholder}</div>
                <div className="ds-preview-tag">{tagline || t.genericProductsFallback}</div>
              </div>
            </div>

            <div className="dh-card">
              {designSaved && <div className="dh-success">{t.designSavedMsg}</div>}
              {error && <div className="dh-error">{error}</div>}

              <div className="dh-field">
                <label>{t.storeCoverLabel}</label>
                <div className="ds-cover-row">
                  {coverUrl
                    ? <img src={coverUrl} alt="" className="ds-cover-thumb" />
                    : <div className="ds-cover-placeholder">{t.noCover}</div>}
                  <label className="dh-logo-btn">
                    {coverUploading ? t.uploadingEllipsis : t.uploadCoverPhoto}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} disabled={coverUploading} />
                  </label>
                </div>
                <div className="dh-hint">{t.coverHint}</div>
                {coverError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{coverError}</div>}
              </div>

              <div className="dh-field">
                <label>{t.storeLogoLabel}</label>
                <div className="dh-logo-row">
                  {logoUrl
                    ? <img src={logoUrl} alt="" className="dh-logo-thumb" />
                    : <div className="dh-logo-placeholder">{initial}</div>}
                  <label className="dh-logo-btn">
                    {logoUploading ? t.uploadingEllipsis : t.uploadNewLogo}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { handleLogoUpload(e); setDesignDirty(true); }} disabled={logoUploading} />
                  </label>
                </div>
                {logoError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{logoError}</div>}
              </div>
              <div className="dh-field">
                <label>{t.storeNameLabel}</label>
                <input type="text" value={storeName} onChange={(e) => { setStoreName(e.target.value); setDesignDirty(true); }} />
              </div>
              <div className="dh-field">
                <label>{t.taglineFieldLabel}</label>
                <input type="text" value={tagline} onChange={(e) => { setTagline(e.target.value); setDesignDirty(true); }} placeholder={t.taglinePlaceholder} />
              </div>
              <div className="dh-field">
                <label>{t.chooseStoreLink}</label>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugError(""); setDesignDirty(true); }} placeholder="hind" style={{ direction: "ltr", textAlign: "right" }} />
                {slugError && <div className="dh-error" style={{ marginTop: 8, marginBottom: 0 }}>{slugError}</div>}
                <div className="dh-hint">{t.slugWillAppear(slug || t.yourNamePlaceholder)}</div>
              </div>
              <div className="dh-field">
                <label>{t.whatsappFieldLabel}</label>
                <input type="text" value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); setDesignDirty(true); }} placeholder="96891234567" style={{ direction: "ltr", textAlign: "right" }} />
              </div>
              <div className="dh-field">
                <label>{t.instagramFieldLabel}</label>
                <input type="text" value={instagram} onChange={(e) => { setInstagram(e.target.value); setDesignDirty(true); }} placeholder="username" style={{ direction: "ltr", textAlign: "right" }} />
              </div>
              <div className="dh-field">
                <label>{t.supportEmailLabel}</label>
                <input type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setDesignDirty(true); }} placeholder="support@yourbrand.com" style={{ direction: "ltr", textAlign: "right" }} />
                <div className="dh-hint">{t.supportEmailHint}</div>
              </div>
              <div className="dh-field">
                <label>{t.storeAboutLabel}</label>
                <textarea rows="3" value={storeAbout} onChange={(e) => { setStoreAbout(e.target.value); setDesignDirty(true); }} placeholder={t.storeAboutPlaceholder} />
              </div>
              <div className="dh-field">
                <label>{t.faqLabel}</label>
                <div className="dh-hint">{t.faqHint}</div>
                {storeFaqs.map((faq, index) => (
                  <div className="ds-faq" key={index}>
                    <input value={faq.question || ""} onChange={(e) => updateFaq(index, "question", e.target.value)} placeholder={t.questionPlaceholder} />
                    <textarea rows="2" value={faq.answer || ""} onChange={(e) => updateFaq(index, "answer", e.target.value)} placeholder={t.answerPlaceholder} style={{ marginTop: 7 }} />
                    <div className="ds-faq-actions"><span className="dh-hint">{t.questionNumber(index + 1)}</span><button type="button" className="ds-remove" onClick={() => removeFaq(index)}>{t.remove}</button></div>
                  </div>
                ))}
                {storeFaqs.length < 5 && <button type="button" className="ds-add" onClick={addFaq}>{t.addQuestion}</button>}
              </div>
              <div className="dh-field">
                <label>{t.chooseStoreStyle}</label>
                <div className="dh-hint">{t.storeStyleHint}</div>
                <div className="ds-swatches">
                  {STORE_STYLES.map((style) => (
                    <div
                      key={style.color}
                      className={"ds-swatch" + (storeColor === style.color ? " selected" : "")}
                      style={{ background: style.color }}
                      onClick={() => { setStoreColor(style.color); setDesignDirty(true); }}
                      title={`${lang === "en" ? style.nameEn : style.name} — ${lang === "en" ? style.hintEn : style.hint}`}
                    />
                  ))}
                </div>
                <div className="dh-hint">{(lang === "en" ? STORE_STYLES.find((style) => style.color === storeColor)?.nameEn : STORE_STYLES.find((style) => style.color === storeColor)?.name) || t.storeStyleFallback} · {(lang === "en" ? STORE_STYLES.find((style) => style.color === storeColor)?.hintEn : STORE_STYLES.find((style) => style.color === storeColor)?.hint) || ""}</div>
              </div>

              <div className="dh-field">
                <label>{t.paymentLabel}</label>
                <div className="dh-hint">{t.paymentHint}</div>
              </div>
            </div>

            <div className="ds-save-bar">
              <span className={"ds-save-status" + (designDirty ? " unsaved" : "")}>
                {designDirty ? t.unsavedChanges : t.allSaved}
              </span>
              <button className="ds-save-btn" onClick={handleSaveDesign} disabled={designSaving}>
                {designSaving ? t.savingEllipsis : t.saveAndPublish}
              </button>
            </div>
          </>
        )}

        {tab === "subscription" && (() => {
          const addOnsMonthlyTotal = activeAddOns.reduce((sum, key) => sum + (ADD_ON_CATALOG.find((item) => item.key === key)?.price || 0), 0);
          const planBasePrice = sellerPlan === "pro" ? PRO_MONTHLY_PRICE : BASE_MONTHLY_PRICE;
          const monthlyTotal = planBasePrice + addOnsMonthlyTotal;
          const selectionTotal = addOnSelection.reduce((sum, key) => sum + (ADD_ON_CATALOG.find((item) => item.key === key)?.price || 0), 0);
          const daysLeft = subscriptionDaysLeft;
          return (
          <>
            <button className="dh-back" type="button" onClick={() => setTab("settings")}>{t.backToSettings}</button>
            <div className="dh-card" style={{ borderTop: "3px solid #163F2E" }}>
              <div className="dh-title-row">
                <div>
                  <div className="dh-title">{t.yourStoreSubscription}</div>
                  <div className="dh-hint" style={{ marginTop: 5 }}>{t.subscriptionHint(BASE_MONTHLY_PRICE.toFixed(2))}</div>
                </div>
                {isTrial ? (
                  <span className="dh-subscription-ready" style={{ background: "#FFF8E9", color: "#9C6D1F", borderRadius: 100, padding: "5px 9px", fontSize: 10, fontWeight: 800 }}>{t.freeTrialBadge}</span>
                ) : (
                  <span className="dh-subscription-ready" style={{ background: "#EAF0EB", color: "#37724B", borderRadius: 100, padding: "5px 9px", fontSize: 10, fontWeight: 800 }}>{t.activeBadge}</span>
                )}
              </div>
              {isTrial && (
                <div className="dh-hint" style={{ background: "#FFF8E9", borderRadius: 10, padding: "9px 12px", marginBottom: 10 }}>
                  {t.trialSubscriptionHint}
                </div>
              )}
              <div className="dh-subscription-base" style={{ background: "#F7F7F2", borderRadius: 14, padding: "14px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <b style={{ display: "block", color: "#0B0B0C", fontSize: 13 }}>{t.baseStoreLabel}</b>
                  <span className="dh-hint">{t.baseStoreDesc}</span>
                </div>
                <b className="mono" style={{ color: "#163F2E", whiteSpace: "nowrap" }}>{planBasePrice.toFixed(2)} {curr}</b>
              </div>
              {!isTrial && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                  <span className="dh-hint">
                    {subscriptionExpiresAt ? t.subscriptionActiveUntil(subscriptionExpiresAt, daysLeft !== null ? (daysLeft >= 0 ? t.daysRemaining(daysLeft) : t.expiredSuffix) : "") : t.renewalDateUnavailable}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10, background: "#F7F7F2", borderRadius: 12, padding: "10px 12px" }}>
                <div>
                  <b style={{ display: "block", fontSize: 12.5 }}>{isTrial ? t.upgradeAmount : t.nextRenewalAmount}</b>
                  <span className="dh-hint">{t.baseAndActiveAddOns(activeAddOns.length)}</span>
                </div>
                <b className="mono" style={{ color: "#163F2E", whiteSpace: "nowrap" }}>{monthlyTotal.toFixed(2)} {curr}</b>
              </div>
              <button className="dh-btn" type="button" style={{ marginTop: 10, width: "100%" }} disabled={renewalBuying} onClick={renewSubscription}>
                {renewalBuying ? t.preparingPayment : (isTrial ? t.payAndUpgrade(monthlyTotal.toFixed(2)) : t.payAndRenew(monthlyTotal.toFixed(2)))}
              </button>
              {renewalMessage && <div className="dh-error" style={{ marginTop: 8 }}>{renewalMessage}</div>}
            </div>

            {Array.from(new Set(ADD_ON_CATALOG.map((item) => item.group))).map((group) => (
              <div className="dh-card" key={group}>
                <div className="dh-title" style={{ marginBottom: 8 }}>{lang === "en" ? ADD_ON_CATALOG.find((item) => item.group === group)?.groupEn : group}</div>
                {ADD_ON_CATALOG.filter((item) => item.group === group).map((item) => {
                  const isActive = activeAddOns.includes(item.key);
                  const gatewayLocked = item.key === "digitalSelling" && !isActive && !gatewayConnected;
                  return (
                    <label className="dh-item" key={item.key} style={{ display: "block", cursor: isActive || gatewayLocked ? "default" : "pointer" }}>
                      <div className="dh-item-top" style={{ alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          {!isActive && (
                            <input
                              type="checkbox"
                              checked={addOnSelection.includes(item.key)}
                              onChange={() => toggleAddOnSelection(item.key)}
                              disabled={gatewayLocked}
                              style={{ marginTop: 3 }}
                            />
                          )}
                          <div>
                            <div className="dh-item-name">{lang === "en" ? item.titleEn : item.title}</div>
                            <div className="dh-hint" style={{ marginTop: 3 }}>{lang === "en" ? item.descEn : item.desc}</div>
                          </div>
                        </div>
                        <b className="dh-item-price">+{item.price.toFixed(2)} {curr}</b>
                      </div>
                      {gatewayLocked ? (
                        <span style={{ display: "inline-block", marginTop: 6, background: "#F3EBDD", color: "#9C6D1F", borderRadius: 100, padding: "4px 8px", fontSize: 9.5, fontWeight: 800 }}>
                          {t.connectGatewayFirstPrefix} <button type="button" onClick={(e) => { e.preventDefault(); setTab("gateway"); }} style={{ background: "none", border: 0, padding: 0, margin: 0, color: "inherit", fontWeight: 800, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>{t.yourPaymentGatewayLink}</button> {t.connectGatewayFirstSuffix}
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", marginTop: 6, background: isActive ? "#EAF0EB" : "#F3EBDD", color: isActive ? "#37724B" : "#9C6D1F", borderRadius: 100, padding: "4px 8px", fontSize: 9.5, fontWeight: 800 }}>
                          {isActive ? t.activeBadge : t.notActive}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            ))}

            {addOnSelection.length > 0 && (
              <div className="dh-card" style={{ position: "sticky", bottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span className="dh-hint">{t.addOnsSelectedCount(addOnSelection.length)}</span>
                  <b className="mono" style={{ color: "#163F2E" }}>{selectionTotal.toFixed(2)} {curr}</b>
                </div>
                <button className="dh-btn" type="button" style={{ marginTop: 10, width: "100%" }} disabled={addOnBuying} onClick={buyAddOns}>
                  {addOnBuying ? t.preparingPayment : t.payAndActivateAddOns(selectionTotal.toFixed(2))}
                </button>
                {addOnMessage && <div className="dh-error" style={{ marginTop: 8 }}>{addOnMessage}</div>}
              </div>
            )}
            <div className="dh-hint" style={{ textAlign: "center", lineHeight: 1.9, padding: "0 10px 14px" }}>{t.addOnBillingNote}</div>
          </>
          );
        })()}

      </div>

      {previewOpen && (
        <div className="pv-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="pv-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pv-close">
              <span className="pv-close-label">{t.previewTitle}</span>
              <button className="pv-close-btn" onClick={() => setPreviewOpen(false)}>✕</button>
            </div>
            <div className="pv-body">
              <div className="pv-cover">
                {productImages[0]
                  ? <img src={productImages[0]} alt="" />
                  : <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/></svg>}
              </div>
              <div className="pv-cat">{category || t.generalCategory}</div>
              <div className="pv-name">{name || t.productNamePlaceholder}</div>
              <div className="pv-card">
                <div className="pv-price-row">
                  <span style={{ color: "#5A5648", fontSize: 11.5 }}>{t.priceWord}</span>
                  <b className="mono" style={{ fontSize: 20 }}>{price ? Number(price).toFixed(2) : "0.00"} {curr}</b>
                </div>
                <div className="pv-desc">{description || t.noExtraDescription}</div>
              </div>
              <div className="pv-btn">{t.sellingOptionsOnActivation}</div>
              <div className="pv-note">{t.previewOnlyNote}</div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DebugErrorBoundary>
  );
}
