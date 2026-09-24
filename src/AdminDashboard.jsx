import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { BASE_MONTHLY_PRICE } from "./subscriptionCatalog.js";
import { useLang, LangToggle } from "./i18n.jsx";

const ADMIN_EMAIL = "k1997551@gmail.com";

const styles = `
  .admin-page{ min-height:100vh; background:#fff; font-family:'Cairo', sans-serif; color:#16233F; }
  .admin-page *{ box-sizing:border-box; }
  .admin-wrap{ max-width:960px; margin:0 auto; padding:24px 20px 60px; }
  .admin-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:8px; flex-wrap:wrap; }
  .admin-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:22px; }
  .admin-header-actions{ display:flex; align-items:center; gap:8px; }
  .admin-logout{ background:transparent; border:1px solid #E4E0D3; border-radius:9px; padding:9px 16px; font-size:13px; font-weight:700; color:#16233F; cursor:pointer; }
  .admin-lang{ background:transparent; border:1px solid #E4E0D3; border-radius:9px; padding:9px 13px; font-size:12px; font-weight:800; color:#16233F; cursor:pointer; font-family:inherit; }

  .admin-denied{ display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:20px; }
  .admin-denied p{ color:#5A5648; font-size:14px; margin-top:8px; }

  .admin-stats{ display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
  .admin-stat{ flex:1; min-width:140px; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:16px 18px; text-align:right; cursor:pointer; font-family:'Cairo',sans-serif; }
  .admin-stat:hover{ border-color:#16233F; }
  .admin-stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:22px; }
  .admin-stat span{ color:#5A5648; font-size:12.5px; }

  .admin-search{ width:100%; padding:12px 14px; border:1px solid #E4E0D3; border-radius:10px; font-size:13.5px; font-family:'Cairo',sans-serif; margin-bottom:16px; background:#fff; color:#16233F; }
  .admin-filters{ display:flex; gap:9px; margin-bottom:16px; flex-wrap:wrap; }
  .admin-filters select{ flex:1; min-width:140px; padding:10px 12px; border:1px solid #E4E0D3; border-radius:10px; font-size:12.5px; font-family:'Cairo',sans-serif; background:#fff; color:#16233F; }
  .plan-row{ display:flex; align-items:center; gap:8px; margin-top:10px; flex-wrap:wrap; }
  .plan-row label{ font-size:11.5px; color:#403D35; font-weight:800; white-space:nowrap; }
  .plan-row select{ border:1px solid #E4E0D3; border-radius:8px; padding:7px 9px; font:12.5px 'Cairo',sans-serif; background:#FBFAF7; color:#16233F; }
  .plan-row button{ border:0; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; background:#16233F; color:#fff; cursor:pointer; white-space:nowrap; }
  .plan-row button:disabled{ opacity:.6; }
  .detail-section{ margin-top:14px; padding-top:14px; border-top:1px dashed #E4E0D3; }
  .detail-heading{ font-size:12px; font-weight:800; color:#16233F; margin-bottom:8px; }
  .detail-row{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:8px 0; border-top:1px dashed #EFEBDE; font-size:12px; }
  .detail-row:first-child{ border-top:none; }
  .detail-empty{ color:#5A5648; font-size:12px; padding:6px 0; }

  .seller-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:16px 18px; margin-bottom:10px; }
  .seller-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; cursor:pointer; }
  .seller-name{ font-weight:800; font-size:15px; }
  .seller-email{ color:#5A5648; font-size:12.5px; margin-top:2px; }
  .seller-meta{ display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
  .seller-meta-item{ font-size:12px; color:#3D4A66; }
  .seller-meta-item b{ color:#16233F; }
  .seller-badge{ display:inline-block; font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; }
  .badge-active{ background:#EAF0EB; color:#4B6152; }
  .badge-disabled{ background:#F6E5E1; color:#B24C3A; }
  .badge-plan{ background:#F3EBDD; color:#B9832F; }
  .badge-expired{ background:#F6E5E1; color:#B24C3A; }
  .expiry-row{ display:flex; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .expiry-row label{ font-size:11.5px; color:#403D35; font-weight:800; white-space:nowrap; }
  .expiry-row input{ border:1px solid #E4E0D3; border-radius:8px; padding:7px 9px; font:12.5px 'Cairo',sans-serif; background:#FBFAF7; color:#16233F; }
  .expiry-row button{ border:0; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; background:#16233F; color:#fff; cursor:pointer; white-space:nowrap; }
  .expiry-row button:disabled{ opacity:.6; }
  .seller-actions{ display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .seller-btn{ padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #E4E0D3; background:#fff; color:#16233F; }
  .seller-btn.warn{ border-color:#E7C9C1; color:#B24C3A; }
  .seller-btn.danger{ background:#B24C3A; color:#fff; border:none; }

  .seller-expand-hint{ font-size:11.5px; color:#B9832F; font-weight:700; margin-top:8px; cursor:pointer; }

  .products-box{ margin-top:14px; padding-top:14px; border-top:1px dashed #E4E0D3; }
  .products-loading{ color:#5A5648; font-size:12.5px; padding:8px 0; }
  .product-row{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:9px 0; border-top:1px dashed #EFEBDE; }
  .product-row:first-child{ border-top:none; }
  .product-info{ flex:1; }
  .product-name{ font-size:13px; font-weight:700; color:#16233F; }
  .product-sub{ font-size:11px; color:#5A5648; margin-top:2px; }
  .product-del{ background:transparent; border:1px solid #E7C9C1; color:#B24C3A; border-radius:7px; padding:6px 11px; font-size:11.5px; font-weight:700; cursor:pointer; white-space:nowrap; }
  .product-del:disabled{ opacity:.6; }
  .products-empty{ color:#5A5648; font-size:12.5px; padding:8px 0; }

  .empty{ text-align:center; color:#5A5648; font-size:13.5px; padding:40px 0; }
  .loading{ text-align:center; color:#5A5648; font-size:13.5px; padding:40px 0; }

  .admin-tabs{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
  .admin-tab{ padding:9px 16px; border-radius:100px; font-size:12.5px; font-weight:700; border:1px solid #E4E0D3; background:#FFFFFF; color:#3D4A66; cursor:pointer; }
  .admin-tab.active{ background:#16233F; color:#fff; border-color:#16233F; }

  .ap-row{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:14px 16px; margin-bottom:10px; }
  .ap-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .ap-name{ font-weight:800; font-size:14px; color:#16233F; }
  .ap-sub{ color:#5A5648; font-size:11.5px; margin-top:3px; }
  .ap-owner{ color:#5A5648; font-size:11.5px; margin-top:6px; }
  .ap-owner b{ color:#3D4A66; }
  .badge-suspended{ background:#F3EBDD; color:#B9832F; }
  .ap-actions{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .invite-panel{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:16px; padding:18px; margin-bottom:14px; }
  .invite-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:15px; margin-bottom:5px; }.invite-sub{ color:#403D35; font-size:11.5px; line-height:1.75; margin-bottom:15px; }
  .invite-field{ margin-bottom:11px; }.invite-field label{ display:block; color:#403D35; font-size:11.5px; font-weight:800; margin-bottom:5px; }.invite-field input,.invite-field select{ width:100%; box-sizing:border-box; padding:11px 12px; border:1px solid #E4E0D3; border-radius:10px; background:#FBFAF7; color:#16233F; font:13px 'Cairo',sans-serif; }
  .invite-create{ width:100%; min-height:42px; border:0; border-radius:100px; background:#16233F; color:#fff; font:700 12.5px 'Cairo',sans-serif; cursor:pointer; }.invite-create:disabled{ opacity:.6; }.invite-message{ margin:0 0 12px; padding:9px 11px; border-radius:10px; font-size:11.5px; line-height:1.7; }.invite-message.error{ background:#F6E9E5; color:#A34839; }.invite-message.success{ background:#EAF0EB; color:#37724B; }
  .invite-link{ display:flex; align-items:center; gap:8px; border:1px solid #D8E5D8; background:#F5F9F4; border-radius:11px; padding:8px 9px; direction:ltr; }.invite-link code{ flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#22372C; font:10px 'JetBrains Mono',monospace; }.invite-copy{ flex-shrink:0; border:0; border-radius:8px; background:#16233F; color:#fff; padding:7px 10px; font:700 10.5px 'Cairo',sans-serif; cursor:pointer; }
  .invite-row{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:14px 16px; margin-bottom:10px; }.invite-row-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }.invite-name{ font-weight:800; font-size:14px; }.invite-email{ color:#403D35; font-size:11.5px; margin-top:3px; }.invite-meta{ color:#403D35; font-size:10.5px; margin-top:8px; }.badge-pending{ background:#F3EBDD; color:#8A5B18; }.badge-accepted{ background:#EAF0EB; color:#37724B; }.badge-revoked,.badge-expired{ background:#F6E9E5; color:#A34839; }
  @media (max-width:480px){.admin-wrap{padding:16px 14px 48px}.admin-header{margin-bottom:16px}.admin-tab{padding:8px 12px}.invite-panel,.invite-row{padding:14px}.invite-row-top{gap:8px}.seller-badge{flex-shrink:0}.invite-link{align-items:flex-start}.invite-copy{min-height:34px}}
`;

const ADMIN_T = {
  ar: {
    planTrial: "تجربة مجانية", planBasic: "أساسية", planPro: "احترافية", planFull: "متجر متكامل", planNone: "بدون باقة",
    storeTypeBooks: "كتب رقمية", storeTypeVideos: "فيديوهات ودورات", storeTypeCodes: "أكواد وتراخيص", storeTypeFiles: "ملفات وقوالب",
    inviteRequestError: "تعذر تنفيذ الدعوة الآن.",
    inviteLinkCreated: "تم إنشاء الرابط. انسخه الآن وأرسله للتاجر؛ ينتهي بعد 3 أيام.",
    inviteLinkCopied: "تم نسخ رابط الدعوة. أرسله للتاجر على واتساب.",
    copyAutoFailed: "تعذر النسخ تلقائيًا. انسخ الرابط يدويًا.",
    confirmRevokeInvite: (storeName) => `تبي توقف دعوة ${storeName}؟ الرابط لن يفتح بعد الآن.`,
    confirmDeleteInvite: (storeName) => `تبي تحذف دعوة ${storeName} نهائيًا؟ هذا يحذف سجل الدعوة فقط، ولا يحذف حساب التاجر لو كان فعّلها.`,
    couponCodeMinLength: "اكتب كود من 3 أحرف أو أرقام على الأقل.",
    couponAmountInvalid: "اكتب مبلغ خصم صحيح أكبر من صفر.",
    couponMaxUsesInvalid: "عدد مرات الاستخدام لازم يكون رقم صحيح أكبر من صفر، أو اتركه فاضي لاستخدام غير محدود.",
    createCouponError: "تعذر إنشاء الكود الآن.",
    confirmDeleteCoupon: (id) => `تبي تحذف كود "${id}" نهائيًا؟`,
    inviteStatusAccepted: "مفعّلة", inviteStatusRevoked: "موقوفة", inviteStatusExpired: "منتهية", inviteStatusPending: "بانتظار التفعيل",
    checkingEllipsis: "جاري التحقق...",
    loginFirst: "سجّل دخولك أولًا",
    loginFirstText: "ادخل بحساب مالك مُونة، وبعدها تقدر تدير دعوات التجار.",
    login: "تسجيل الدخول",
    wrongAccount: "دخلت بحساب غير حساب المالك",
    wrongAccountText: "هذه الصفحة خاصة بصاحب مُونة. سجل خروج ثم ادخل بحساب المالك.",
    logout: "تسجيل الخروج",
    confirmDeleteOrder: (name) => `متأكد تبي تحذف طلب "${name}" نهائيًا؟ (استخدمها للطلبات التجريبية بس)`,
    orderFallback: "طلب",
    deleteOrderError: "تعذر حذف الطلب الآن.",
    confirmDeleteProduct: (name) => `متأكد تبي تحذف منتج "${name}" نهائيًا؟`,
    confirmDeleteSeller: (name) => `متأكد تبي تحذف حساب "${name}" ومنتجاته كلها نهائيًا؟ هذا الإجراء ما يترجع.`,
    adminPanelTitle: "لوحة تحكم الأدمن",
    totalSellers: "إجمالي التجار",
    startPageVisits: "زيارات صفحة التسجيل",
    activeAccounts: "حسابات نشطة",
    disabledAccounts: "حسابات موقوفة",
    expiringWithinWeek: "اشتراكات تنتهي خلال أسبوع",
    approxMonthlyRevenue: "الإيراد الشهري التقريبي",
    totalOrders: "إجمالي الطلبات",
    awaitingSellerConfirmation: "بانتظار تأكيد التاجر",
    totalConfirmedSales: "إجمالي المبيعات المؤكدة",
    sellersTab: "التجار",
    allProductsTab: "كل المنتجات",
    allOrdersTab: "كل الطلبات",
    invitesTab: "دعوات التجار",
    signupCouponsTab: "أكواد خصم التسجيل",
    paymentDebugTab: "سجل تشخيص الدفع",
    searchPlaceholder: "ابحث باسم المتجر أو الإيميل...",
    allPlans: "كل الباقات",
    allStatuses: "كل الحالات",
    activeStatus: "نشط",
    disabledStatus: "موقوف",
    expiringSoonStatus: "اشتراك قارب ينتهي",
    loadingSellers: "جاري تحميل التجار...",
    loadSellersError: (msg) => `تعذر تحميل التجار: ${msg}`,
    noMatchingSellers: "ما فيه تجار مطابقين",
    noNameFallback: "بدون اسم",
    disabled: "موقوف",
    active: "نشط",
    planLabel: "الباقة:",
    registrationDate: "تاريخ التسجيل:",
    subscriptionExpired: "منتهي الاشتراك",
    emailUnverified: "البريد غير مؤكد",
    emailVerified: "البريد مؤكد",
    subscriptionValidUntil: "الاشتراك ساري لين:",
    sellerEmailLabel: "الإيميل:",
    saveEmail: "حفظ الإيميل",
    savingEllipsis: "جاري الحفظ...",
    saveDate: "حفظ التاريخ",
    savePlan: "حفظ الباقة",
    hideFullDetails: "إخفاء التفاصيل الكاملة ▲",
    showFullDetails: "عرض التفاصيل الكاملة ▼",
    productsHeading: "المنتجات",
    loadingProducts: "جاري تحميل المنتجات...",
    noProductsAdded: "ما عنده أي منتج مضاف.",
    generalCategory: "عام",
    codeLicense: "كود/ترخيص",
    file: "ملف",
    deletingEllipsis: "جاري الحذف...",
    delete: "حذف",
    lastOrdersHeading: "آخر الطلبات",
    noOrdersForStore: "ما فيه طلبات لهذا المتجر بعد.",
    couponsHeading: "الكوبونات",
    loadingCoupons: "جاري تحميل الكوبونات...",
    noCoupons: "ما عنده أي كوبون.",
    discountLabel: (percent) => `خصم ${percent}٪`,
    couponActive: "فعّال",
    couponStopped: "متوقف",
    manualTransferInstructionsHeading: "تعليمات التحويل اليدوي",
    noTransferInstructions: "لم يضف التاجر تعليمات تحويل بعد.",
    bankLabel: "البنك:",
    accountHolderLabel: "صاحب الحساب:",
    accountNumberLabel: "رقم الحساب:",
    phoneNumberLabel: "رقم الجوال:",
    reactivateAccount: "إعادة تفعيل الحساب",
    disableAccount: "إيقاف الحساب",
    deletePermanently: "حذف نهائي",
    loadingAllProducts: "جاري تحميل كل المنتجات...",
    noProductsOnPlatform: "ما فيه منتجات بالمنصة لسا",
    sellerLabel: "التاجر:",
    suspended: "معلّق",
    cancelSuspension: "إلغاء التعليق",
    suspendTemporarily: "تعليق مؤقت",
    confirmed: "مؤكد",
    draftAwaitingTransfer: "بانتظار التحويل",
    loadingOrders: "جاري تحميل الطلبات...",
    noMatchingOrders: "ما فيه طلبات مطابقة",
    unknownDeleted: "غير معروف (محذوف)",
    newInviteTitle: "دعوة تاجر جديد",
    newInviteSub: "اختر نوع متجره ثم أرسل له الرابط. التاجر يسجّل ببريده وكلمة مروره بنفسه ويؤكد بريده بنفسه، والرابط يستخدم مرة واحدة.",
    copyLink: "نسخ الرابط",
    storeNameLabel: "اسم المتجر",
    storeNamePlaceholder: "مثال: متجر هند للتصاميم",
    whatDoesItSell: "ماذا يبيع؟",
    creatingLinkEllipsis: "جاري إنشاء الرابط...",
    createInviteLink: "إنشاء رابط دعوة",
    loadingInvites: "جاري تحميل الدعوات...",
    noInvitesYet: "ما فيه دعوات حتى الآن.",
    notRegisteredYet: "لم يسجّل بعد",
    genericProducts: "منتجات رقمية",
    expiresLabel: (date) => `تنتهي ${date}`,
    stoppingEllipsis: "جاري الإيقاف...",
    stopInvite: "إيقاف الدعوة",
    deleteInvitePermanently: "حذف الدعوة نهائيًا",
    newSignupCouponTitle: "كود خصم جديد لاشتراك التسجيل",
    newSignupCouponSub: (price) => `التاجر يكتب هذا الكود بصفحة الدفع عند فتح متجره، فينزل عليه مبلغ الخصم من الاشتراك الأساسي (${price} ر.ع).`,
    codeLabel: "الكود",
    codePlaceholder: "مثال: WELCOME3",
    discountAmountLabel: "مبلغ الخصم (ر.ع)",
    maxUsesLabel: "أقصى عدد مرات استخدام (اختياري)",
    unlimitedUsesPlaceholder: "اتركه فاضي لاستخدام غير محدود",
    creatingEllipsis: "جاري الإنشاء...",
    createCode: "إنشاء الكود",
    loadingCodes: "جاري تحميل الأكواد...",
    noSignupCouponsYet: "ما فيه أكواد خصم حتى الآن.",
    couponActiveBadge: "مفعّل",
    usedCount: (count, maxPart) => `استُخدم ${count} ${maxPart}`,
    ofMax: (max) => `من ${max}`,
    timesNoLimit: "مرة (بدون حد أقصى)",
    stopCode: "إيقاف الكود",
    activateCode: "تفعيل الكود",
    paymentDebugIntro: "كل مرة ما نقدر نتأكد إن دفعة عند OmPay نجحت، نسجل الرد الخام هنا — يفيد بمعرفة السبب بالضبط بدل التخمين.",
    loadingLog: "جاري تحميل السجل...",
    noUnrecognizedPayments: "ما فيه أي حالة دفع لم نتعرف عليها حتى الآن.",
    unknown: "غير معروف",
  },
  en: {
    planTrial: "Free trial", planBasic: "Basic", planPro: "Pro", planFull: "Full store", planNone: "No plan",
    storeTypeBooks: "Digital books", storeTypeVideos: "Videos & courses", storeTypeCodes: "Codes & licenses", storeTypeFiles: "Files & templates",
    inviteRequestError: "Couldn't complete the invite request right now.",
    inviteLinkCreated: "The link was created. Copy it now and send it to the seller; it expires after 3 days.",
    inviteLinkCopied: "Invite link copied. Send it to the seller on WhatsApp.",
    copyAutoFailed: "Couldn't copy automatically. Copy the link manually.",
    confirmRevokeInvite: (storeName) => `Stop the invite for ${storeName}? The link will no longer open.`,
    confirmDeleteInvite: (storeName) => `Delete the invite for ${storeName} permanently? This only deletes the invite record, not the seller's account if they already activated it.`,
    couponCodeMinLength: "Write a code of at least 3 letters or digits.",
    couponAmountInvalid: "Write a valid discount amount greater than zero.",
    couponMaxUsesInvalid: "The max uses must be a whole number greater than zero, or leave it empty for unlimited use.",
    createCouponError: "Couldn't create the code right now.",
    confirmDeleteCoupon: (id) => `Delete code "${id}" permanently?`,
    inviteStatusAccepted: "Activated", inviteStatusRevoked: "Stopped", inviteStatusExpired: "Expired", inviteStatusPending: "Awaiting activation",
    checkingEllipsis: "Checking...",
    loginFirst: "Log in first",
    loginFirstText: "Log in with Monah's owner account, then you can manage seller invites.",
    login: "Log in",
    wrongAccount: "You're logged in with a different account than the owner's",
    wrongAccountText: "This page is private to Monah's owner. Log out then log in with the owner account.",
    logout: "Log out",
    confirmDeleteOrder: (name) => `Delete order "${name}" permanently? (Use this for test orders only)`,
    orderFallback: "order",
    deleteOrderError: "Couldn't delete the order right now.",
    confirmDeleteProduct: (name) => `Delete product "${name}" permanently?`,
    confirmDeleteSeller: (name) => `Delete the account "${name}" and all its products permanently? This action cannot be undone.`,
    adminPanelTitle: "Admin panel",
    totalSellers: "Total sellers",
    startPageVisits: "Signup page visits",
    activeAccounts: "Active accounts",
    disabledAccounts: "Disabled accounts",
    expiringWithinWeek: "Subscriptions ending within a week",
    approxMonthlyRevenue: "Approx. monthly revenue",
    totalOrders: "Total orders",
    awaitingSellerConfirmation: "Awaiting seller confirmation",
    totalConfirmedSales: "Total confirmed sales",
    sellersTab: "Sellers",
    allProductsTab: "All products",
    allOrdersTab: "All orders",
    invitesTab: "Seller invites",
    signupCouponsTab: "Signup discount codes",
    paymentDebugTab: "Payment debug log",
    searchPlaceholder: "Search by store name or email...",
    allPlans: "All plans",
    allStatuses: "All statuses",
    activeStatus: "Active",
    disabledStatus: "Disabled",
    expiringSoonStatus: "Subscription ending soon",
    loadingSellers: "Loading sellers...",
    loadSellersError: (msg) => `Couldn't load sellers: ${msg}`,
    noMatchingSellers: "No matching sellers",
    noNameFallback: "No name",
    disabled: "Disabled",
    active: "Active",
    planLabel: "Plan:",
    registrationDate: "Registration date:",
    subscriptionExpired: "Subscription expired",
    emailUnverified: "Email not verified",
    emailVerified: "Email verified",
    subscriptionValidUntil: "Subscription valid until:",
    sellerEmailLabel: "Email:",
    saveEmail: "Save email",
    savingEllipsis: "Saving...",
    saveDate: "Save date",
    savePlan: "Save plan",
    hideFullDetails: "Hide full details ▲",
    showFullDetails: "Show full details ▼",
    productsHeading: "Products",
    loadingProducts: "Loading products...",
    noProductsAdded: "No products added yet.",
    generalCategory: "General",
    codeLicense: "Code/license",
    file: "File",
    deletingEllipsis: "Deleting...",
    delete: "Delete",
    lastOrdersHeading: "Latest orders",
    noOrdersForStore: "No orders for this store yet.",
    couponsHeading: "Coupons",
    loadingCoupons: "Loading coupons...",
    noCoupons: "No coupons.",
    discountLabel: (percent) => `${percent}% off`,
    couponActive: "Active",
    couponStopped: "Stopped",
    manualTransferInstructionsHeading: "Manual transfer instructions",
    noTransferInstructions: "The seller hasn't added transfer instructions yet.",
    bankLabel: "Bank:",
    accountHolderLabel: "Account holder:",
    accountNumberLabel: "Account number:",
    phoneNumberLabel: "Phone number:",
    reactivateAccount: "Reactivate account",
    disableAccount: "Disable account",
    deletePermanently: "Delete permanently",
    loadingAllProducts: "Loading all products...",
    noProductsOnPlatform: "No products on the platform yet",
    sellerLabel: "Seller:",
    suspended: "Suspended",
    cancelSuspension: "Cancel suspension",
    suspendTemporarily: "Suspend temporarily",
    confirmed: "Confirmed",
    draftAwaitingTransfer: "Awaiting transfer",
    loadingOrders: "Loading orders...",
    noMatchingOrders: "No matching orders",
    unknownDeleted: "Unknown (deleted)",
    newInviteTitle: "Invite a new seller",
    newInviteSub: "Choose what they sell, then send them the link. The seller registers with their own email and password and confirms their own email; the link is single-use.",
    copyLink: "Copy link",
    storeNameLabel: "Store name",
    storeNamePlaceholder: "e.g. Hind's Design Store",
    whatDoesItSell: "What do they sell?",
    creatingLinkEllipsis: "Creating link...",
    createInviteLink: "Create invite link",
    loadingInvites: "Loading invites...",
    noInvitesYet: "No invites yet.",
    notRegisteredYet: "Not registered yet",
    genericProducts: "Digital products",
    expiresLabel: (date) => `Expires ${date}`,
    stoppingEllipsis: "Stopping...",
    stopInvite: "Stop invite",
    deleteInvitePermanently: "Delete invite permanently",
    newSignupCouponTitle: "New signup subscription discount code",
    newSignupCouponSub: (price) => `The seller types this code on the payment page when opening their store, and the discount amount is deducted from the base subscription (${price} OMR).`,
    codeLabel: "Code",
    codePlaceholder: "e.g. WELCOME3",
    discountAmountLabel: "Discount amount (OMR)",
    maxUsesLabel: "Max uses (optional)",
    unlimitedUsesPlaceholder: "Leave empty for unlimited use",
    creatingEllipsis: "Creating...",
    createCode: "Create code",
    loadingCodes: "Loading codes...",
    noSignupCouponsYet: "No discount codes yet.",
    couponActiveBadge: "Active",
    usedCount: (count, maxPart) => `Used ${count} ${maxPart}`,
    ofMax: (max) => `of ${max}`,
    timesNoLimit: "times (no limit)",
    stopCode: "Stop code",
    activateCode: "Activate code",
    paymentDebugIntro: "Whenever we can't confirm a payment succeeded at OmPay, we log the raw response here — useful for knowing the exact reason instead of guessing.",
    loadingLog: "Loading log...",
    noUnrecognizedPayments: "No unrecognized payment cases yet.",
    unknown: "Unknown",
  },
};

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function AdminDashboard() {
  const [lang, setLang] = useLang();
  const t = ADMIN_T[lang];
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const dateLocale = lang === "ar" ? "ar" : "en-GB";

  function planLabel(plan) {
    if (plan === "trial") return t.planTrial;
    if (plan === "basic") return t.planBasic;
    if (plan === "pro") return t.planPro;
    if (plan === "full") return t.planFull;
    return t.planNone;
  }

  const STORE_TYPES = {
    books: t.storeTypeBooks,
    videos: t.storeTypeVideos,
    codes: t.storeTypeCodes,
    files: t.storeTypeFiles,
  };

  const orderStatusLabel = {
    confirmed: t.confirmed,
    awaiting_seller_confirmation: t.awaitingSellerConfirmation,
    draft: t.draftAwaitingTransfer,
  };

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [startPageVisits, setStartPageVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sellersError, setSellersError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [expiryDrafts, setExpiryDrafts] = useState({});
  const [savingExpiryId, setSavingExpiryId] = useState(null);
  const [emailVerifiedMap, setEmailVerifiedMap] = useState({});
  const [emailDrafts, setEmailDrafts] = useState({});
  const [savingEmailId, setSavingEmailId] = useState(null);
  const [emailErrors, setEmailErrors] = useState({});

  const [expandedId, setExpandedId] = useState(null);
  const [sellerProducts, setSellerProducts] = useState({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [view, setView] = useState("sellers");
  const [allProducts, setAllProducts] = useState([]);
  const [allProductsLoading, setAllProductsLoading] = useState(false);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const [busyProductId, setBusyProductId] = useState(null);
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteStoreName, setInviteStoreName] = useState("");
  const [inviteStoreType, setInviteStoreType] = useState("files");
  const [inviteCreating, setInviteCreating] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [revokingInviteId, setRevokingInviteId] = useState("");
  const [deletingInviteId, setDeletingInviteId] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sellerCoupons, setSellerCoupons] = useState({});
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planDrafts, setPlanDrafts] = useState({});
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const [paymentDebugLogs, setPaymentDebugLogs] = useState([]);
  const [paymentDebugLoading, setPaymentDebugLoading] = useState(false);

  const [signupCoupons, setSignupCoupons] = useState([]);
  const [signupCouponsLoading, setSignupCouponsLoading] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponMaxUses, setNewCouponMaxUses] = useState("");
  const [couponCreating, setCouponCreating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponBusyCode, setCouponBusyCode] = useState("");


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked || !currentUser || currentUser.email !== ADMIN_EMAIL) return;
    loadSellers();
    loadInvites();
    loadSellerStatus();
    loadOrders();
    loadSiteStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, currentUser]);

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const snap = await getDocs(collection(db, "orders"));
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setOrdersLoading(false);
  }

  async function loadSiteStats() {
    try {
      const snap = await getDoc(doc(db, "siteStats", "startPage"));
      setStartPageVisits(snap.exists() ? Number(snap.data().visits) || 0 : 0);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSellers() {
    setLoading(true);
    setSellersError("");
    try {
      const snap = await getDocs(collection(db, "sellers"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setSellers(list);
    } catch (e) {
      console.error(e);
      setSellersError(e.message || String(e));
    }
    setLoading(false);
  }

  async function loadSellerStatus() {
    try {
      const data = await inviteRequest("sellerStatus");
      setEmailVerifiedMap(data.statuses || {});
    } catch (error) {
      console.error(error);
    }
  }

  async function inviteRequest(action, payload = {}) {
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/merchant-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t.inviteRequestError);
    return data;
  }

  async function loadInvites() {
    setInvitesLoading(true);
    try {
      const data = await inviteRequest("list");
      setInvites(data.invites || []);
    } catch (error) {
      console.error(error);
    }
    setInvitesLoading(false);
  }

  async function createInvite(event) {
    event.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setLatestInviteUrl("");
    setInviteCreating(true);
    try {
      const data = await inviteRequest("create", { storeName: inviteStoreName, storeType: inviteStoreType });
      const link = `${window.location.origin}${window.location.pathname}#invite/${data.token}`;
      setLatestInviteUrl(link);
      setInviteSuccess(t.inviteLinkCreated);
      setInviteStoreName("");
      setInviteStoreType("files");
      loadInvites();
    } catch (error) {
      setInviteError(error.message);
    }
    setInviteCreating(false);
  }

  async function copyInviteLink() {
    if (!latestInviteUrl) return;
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setInviteSuccess(t.inviteLinkCopied);
    } catch {
      setInviteError(t.copyAutoFailed);
    }
  }

  async function revokeInvite(invite) {
    if (!window.confirm(t.confirmRevokeInvite(invite.storeName))) return;
    setRevokingInviteId(invite.id);
    try {
      await inviteRequest("revoke", { inviteId: invite.id });
      setInvites((items) => items.map((item) => item.id === invite.id ? { ...item, status: "revoked" } : item));
    } catch (error) {
      setInviteError(error.message);
    }
    setRevokingInviteId("");
  }

  async function deleteInvite(invite) {
    if (!window.confirm(t.confirmDeleteInvite(invite.storeName))) return;
    setDeletingInviteId(invite.id);
    try {
      await inviteRequest("delete", { inviteId: invite.id });
      setInvites((items) => items.filter((item) => item.id !== invite.id));
    } catch (error) {
      setInviteError(error.message);
    }
    setDeletingInviteId("");
  }

  async function loadPaymentDebugLogs() {
    setPaymentDebugLoading(true);
    try {
      const snap = await getDocs(collection(db, "paymentDebugLog"));
      const list = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setPaymentDebugLogs(list.slice(0, 50));
    } catch (error) {
      console.error(error);
    }
    setPaymentDebugLoading(false);
  }

  async function loadSignupCoupons() {
    setSignupCouponsLoading(true);
    try {
      const snap = await getDocs(collection(db, "signupCoupons"));
      const list = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setSignupCoupons(list);
    } catch (error) {
      console.error(error);
    }
    setSignupCouponsLoading(false);
  }

  async function createSignupCoupon(event) {
    event.preventDefault();
    setCouponError("");
    const code = newCouponCode.trim().toUpperCase().replace(/\s+/g, "");
    const discountAmount = Number(newCouponDiscount);
    const maxUses = newCouponMaxUses.trim() === "" ? null : Number(newCouponMaxUses);
    if (!code || code.length < 3) return setCouponError(t.couponCodeMinLength);
    if (!Number.isFinite(discountAmount) || discountAmount <= 0) return setCouponError(t.couponAmountInvalid);
    if (newCouponMaxUses.trim() !== "" && (!Number.isInteger(maxUses) || maxUses <= 0)) return setCouponError(t.couponMaxUsesInvalid);
    setCouponCreating(true);
    try {
      await setDoc(doc(db, "signupCoupons", code), {
        code,
        discountAmount,
        maxUses,
        usedCount: 0,
        active: true,
        createdAt: serverTimestamp(),
      });
      setNewCouponCode("");
      setNewCouponDiscount("");
      setNewCouponMaxUses("");
      loadSignupCoupons();
    } catch (error) {
      setCouponError(error.message || t.createCouponError);
    }
    setCouponCreating(false);
  }

  async function toggleCouponActive(coupon) {
    setCouponBusyCode(coupon.id);
    try {
      await updateDoc(doc(db, "signupCoupons", coupon.id), { active: !coupon.active });
      setSignupCoupons((items) => items.map((item) => item.id === coupon.id ? { ...item, active: !coupon.active } : item));
    } catch (error) {
      setCouponError(error.message);
    }
    setCouponBusyCode("");
  }

  async function deleteSignupCoupon(coupon) {
    if (!window.confirm(t.confirmDeleteCoupon(coupon.id))) return;
    setCouponBusyCode(coupon.id);
    try {
      await deleteDoc(doc(db, "signupCoupons", coupon.id));
      setSignupCoupons((items) => items.filter((item) => item.id !== coupon.id));
    } catch (error) {
      setCouponError(error.message);
    }
    setCouponBusyCode("");
  }

  function inviteStatusLabel(status) {
    if (status === "accepted") return t.inviteStatusAccepted;
    if (status === "revoked") return t.inviteStatusRevoked;
    if (status === "expired") return t.inviteStatusExpired;
    return t.inviteStatusPending;
  }

  function expiryDraftFor(seller) {
    return expiryDrafts[seller.id] ?? seller.subscriptionExpiresAt ?? "";
  }

  function isSubscriptionExpired(seller) {
    return Boolean(seller.subscriptionExpiresAt) && new Date(seller.subscriptionExpiresAt) < new Date();
  }

  async function saveSubscriptionExpiry(seller) {
    const value = expiryDraftFor(seller);
    setSavingExpiryId(seller.id);
    try {
      await updateDoc(doc(db, "sellers", seller.id), { subscriptionExpiresAt: value || null });
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, subscriptionExpiresAt: value || null } : s))
      );
    } catch (e) {
      console.error(e);
    }
    setSavingExpiryId(null);
  }

  function emailDraftFor(seller) {
    return emailDrafts[seller.id] ?? seller.email ?? "";
  }

  async function saveSellerEmail(seller) {
    const value = emailDraftFor(seller).trim();
    const emailChanged = value.toLowerCase() !== (seller.email || "").toLowerCase();
    setSavingEmailId(seller.id);
    setEmailErrors((prev) => ({ ...prev, [seller.id]: "" }));
    try {
      await inviteRequest("updateSellerEmail", { sellerId: seller.id, email: value });
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, email: value } : s))
      );
      if (emailChanged) {
        setEmailVerifiedMap((prev) => ({ ...prev, [seller.id]: false }));
      }
    } catch (e) {
      setEmailErrors((prev) => ({ ...prev, [seller.id]: e.message || t.genericError }));
    }
    setSavingEmailId(null);
  }

  async function toggleDisabled(seller) {
    setBusyId(seller.id);
    try {
      await updateDoc(doc(db, "sellers", seller.id), { disabled: !seller.disabled });
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, disabled: !s.disabled } : s))
      );
    } catch (e) {
      console.error(e);
    }
    setBusyId(null);
  }

  async function deleteSeller(seller) {
    const ok = window.confirm(t.confirmDeleteSeller(seller.storeName || seller.email));
    if (!ok) return;
    setBusyId(seller.id);
    try {
      const [productsSnap, couponsSnap, bundlesSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("ownerId", "==", seller.id))),
        getDocs(query(collection(db, "coupons"), where("ownerId", "==", seller.id))),
        getDocs(query(collection(db, "bundles"), where("ownerId", "==", seller.id))),
      ]);
      await Promise.all([
        ...productsSnap.docs.map((p) => deleteDoc(p.ref)),
        ...couponsSnap.docs.map((c) => deleteDoc(c.ref)),
        ...bundlesSnap.docs.map((b) => deleteDoc(b.ref)),
      ]);
      await deleteDoc(doc(db, "sellers", seller.id));
      setSellers((prev) => prev.filter((s) => s.id !== seller.id));
      setAllProducts((prev) => prev.filter((p) => p.ownerId !== seller.id));
      setSellerProducts((prev) => { const next = { ...prev }; delete next[seller.id]; return next; });
      setSellerCoupons((prev) => { const next = { ...prev }; delete next[seller.id]; return next; });
    } catch (e) {
      console.error(e);
    }
    setBusyId(null);
  }

  async function toggleExpand(sellerId) {
    if (expandedId === sellerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sellerId);
    if (!sellerProducts[sellerId]) {
      setProductsLoading(true);
      try {
        const q = query(collection(db, "products"), where("ownerId", "==", sellerId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSellerProducts((prev) => ({ ...prev, [sellerId]: list }));
      } catch (e) {
        console.error(e);
        setSellerProducts((prev) => ({ ...prev, [sellerId]: [] }));
      }
      setProductsLoading(false);
    }
    if (!sellerCoupons[sellerId]) {
      setCouponsLoading(true);
      try {
        const q = query(collection(db, "coupons"), where("ownerId", "==", sellerId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSellerCoupons((prev) => ({ ...prev, [sellerId]: list }));
      } catch (e) {
        console.error(e);
        setSellerCoupons((prev) => ({ ...prev, [sellerId]: [] }));
      }
      setCouponsLoading(false);
    }
  }

  function planDraftFor(seller) {
    return planDrafts[seller.id] ?? seller.plan ?? "basic";
  }

  async function savePlan(seller) {
    const value = planDraftFor(seller);
    setSavingPlanId(seller.id);
    try {
      await updateDoc(doc(db, "sellers", seller.id), { plan: value });
      setSellers((prev) => prev.map((s) => (s.id === seller.id ? { ...s, plan: value } : s)));
    } catch (e) {
      console.error(e);
    }
    setSavingPlanId(null);
  }

  async function deleteOrder(order) {
    const ok = window.confirm(t.confirmDeleteOrder(order.productName || t.orderFallback));
    if (!ok) return;
    setDeletingOrderId(order.id);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action: "admin_delete_order", orderId: order.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.deleteOrderError);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e) {
      console.error(e);
      window.alert(e.message || t.deleteOrderError);
    }
    setDeletingOrderId(null);
  }

  async function deleteProduct(sellerId, product) {
    const ok = window.confirm(t.confirmDeleteProduct(product.name));
    if (!ok) return;
    setDeletingProductId(product.id);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setSellerProducts((prev) => ({
        ...prev,
        [sellerId]: prev[sellerId].filter((p) => p.id !== product.id),
      }));
    } catch (e) {
      console.error(e);
    }
    setDeletingProductId(null);
  }

  async function loadAllProducts() {
    setAllProductsLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAllProducts(list);
      setAllProductsLoaded(true);
    } catch (e) {
      console.error(e);
    }
    setAllProductsLoading(false);
  }

  function openProductsView() {
    setView("products");
    if (!allProductsLoaded) loadAllProducts();
  }

  async function toggleSuspendProduct(product) {
    setBusyProductId(product.id);
    try {
      await updateDoc(doc(db, "products", product.id), { suspended: !product.suspended });
      setAllProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, suspended: !p.suspended } : p))
      );
    } catch (e) {
      console.error(e);
    }
    setBusyProductId(null);
  }

  async function deleteAnyProduct(product) {
    const ok = window.confirm(t.confirmDeleteProduct(product.name));
    if (!ok) return;
    setBusyProductId(product.id);
    try {
      await deleteDoc(doc(db, "products", product.id));
      setAllProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      console.error(e);
    }
    setBusyProductId(null);
  }

  if (!authChecked) {
    return (
      <div className="admin-page">
        <style>{styles}</style>
        <div className="admin-denied">{t.checkingEllipsis}</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="admin-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
        <style>{styles}</style>
        <div className="admin-denied">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <b>{t.loginFirst}</b>
            <p>{t.loginFirstText}</p>
            <a className="admin-logout" href="#login">{t.login}</a>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
        <style>{styles}</style>
        <div className="admin-denied">
          <div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <b>{t.wrongAccount}</b>
            <p>{t.wrongAccountText}</p>
            <button className="admin-logout" onClick={() => signOut(auth)}>{t.logout}</button>
          </div>
        </div>
      </div>
    );
  }

  function isExpiringSoon(seller) {
    if (!seller.subscriptionExpiresAt) return false;
    const days = (new Date(seller.subscriptionExpiresAt) - new Date()) / (24 * 60 * 60 * 1000);
    return days >= 0 && days <= 7;
  }

  const filtered = sellers.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (s.storeName || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
    const matchesPlan = planFilter === "all" || (s.plan || "basic") === planFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !s.disabled) ||
      (statusFilter === "disabled" && s.disabled) ||
      (statusFilter === "expiring" && isExpiringSoon(s));
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const activeCount = sellers.filter((s) => !s.disabled).length;
  const disabledCount = sellers.filter((s) => s.disabled).length;
  const activeSubscribers = sellers.filter((s) => !s.disabled && !isSubscriptionExpired(s)).length;
  const monthlyRevenue = activeSubscribers * BASE_MONTHLY_PRICE;
  const expiringSoonCount = sellers.filter(isExpiringSoon).length;

  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const pendingOrders = orders.filter((o) => o.status === "awaiting_seller_confirmation");
  const totalSalesVolume = confirmedOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);

  return (
    <div className="admin-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <div className="admin-wrap">
        <div className="admin-header">
          <div className="admin-title">{t.adminPanelTitle}</div>
          <div className="admin-header-actions">
            <LangToggle lang={lang} onChange={setLang} className="admin-lang" />
            <button className="admin-logout" onClick={() => signOut(auth)}>
              {t.logout}
            </button>
          </div>
        </div>

        <div className="admin-stats">
          <button type="button" className="admin-stat" onClick={() => { setView("sellers"); setStatusFilter("all"); }}>
            <b>{sellers.length}</b>
            <span>{t.totalSellers}</span>
          </button>
          <div className="admin-stat">
            <b>{startPageVisits}</b>
            <span>{t.startPageVisits}</span>
          </div>
          <button type="button" className="admin-stat" onClick={() => { setView("sellers"); setStatusFilter("active"); }}>
            <b>{activeCount}</b>
            <span>{t.activeAccounts}</span>
          </button>
          <button type="button" className="admin-stat" onClick={() => { setView("sellers"); setStatusFilter("disabled"); }}>
            <b>{disabledCount}</b>
            <span>{t.disabledAccounts}</span>
          </button>
          <button type="button" className="admin-stat" onClick={() => { setView("sellers"); setStatusFilter("expiring"); }}>
            <b>{expiringSoonCount}</b>
            <span>{t.expiringWithinWeek}</span>
          </button>
        </div>

        <div className="admin-stats">
          <button type="button" className="admin-stat" onClick={() => { setView("sellers"); setStatusFilter("active"); }}>
            <b>{monthlyRevenue.toFixed(2)} {curr}</b>
            <span>{t.approxMonthlyRevenue}</span>
          </button>
          <button type="button" className="admin-stat" onClick={() => { setView("orders"); setOrderStatusFilter("all"); }}>
            <b>{ordersLoading ? "…" : orders.length}</b>
            <span>{t.totalOrders}</span>
          </button>
          <button type="button" className="admin-stat" onClick={() => { setView("orders"); setOrderStatusFilter("awaiting_seller_confirmation"); }}>
            <b>{ordersLoading ? "…" : pendingOrders.length}</b>
            <span>{t.awaitingSellerConfirmation}</span>
          </button>
          <button type="button" className="admin-stat" onClick={() => { setView("orders"); setOrderStatusFilter("confirmed"); }}>
            <b>{ordersLoading ? "…" : totalSalesVolume.toFixed(2)} {curr}</b>
            <span>{t.totalConfirmedSales}</span>
          </button>
        </div>

        <div className="admin-tabs">
          <button className={"admin-tab" + (view === "sellers" ? " active" : "")} onClick={() => setView("sellers")}>
            {t.sellersTab}
          </button>
          <button className={"admin-tab" + (view === "products" ? " active" : "")} onClick={openProductsView}>
            {t.allProductsTab}
          </button>
          <button className={"admin-tab" + (view === "orders" ? " active" : "")} onClick={() => setView("orders")}>
            {t.allOrdersTab}
          </button>
          <button className={"admin-tab" + (view === "invites" ? " active" : "")} onClick={() => { setView("invites"); loadInvites(); }}>
            {t.invitesTab}
          </button>
          <button className={"admin-tab" + (view === "coupons" ? " active" : "")} onClick={() => { setView("coupons"); loadSignupCoupons(); }}>
            {t.signupCouponsTab}
          </button>
          <button className={"admin-tab" + (view === "paymentDebug" ? " active" : "")} onClick={() => { setView("paymentDebug"); loadPaymentDebugLogs(); }}>
            {t.paymentDebugTab}
          </button>
        </div>

        {view === "sellers" && (
        <input
          className="admin-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        )}

        {view === "sellers" && (
        <div className="admin-filters">
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="all">{t.allPlans}</option>
            <option value="trial">{t.planTrial}</option>
            <option value="basic">{t.planBasic}</option>
            <option value="pro">{t.planPro}</option>
            <option value="full">{t.planFull}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t.allStatuses}</option>
            <option value="active">{t.activeStatus}</option>
            <option value="disabled">{t.disabledStatus}</option>
            <option value="expiring">{t.expiringSoonStatus}</option>
          </select>
        </div>
        )}

        {view === "sellers" && loading && <div className="loading">{t.loadingSellers}</div>}

        {view === "sellers" && sellersError && (
          <div className="empty" style={{ color: "#B24C3A" }}>{t.loadSellersError(sellersError)}</div>
        )}

        {view === "sellers" && !loading && !sellersError && filtered.length === 0 && (
          <div className="empty">{t.noMatchingSellers}</div>
        )}

        {view === "sellers" && !loading &&
          filtered.map((s) => (
            <div className="seller-card" key={s.id}>
              <div className="seller-top" onClick={() => toggleExpand(s.id)}>
                <div>
                  <div className="seller-name">{s.storeName || t.noNameFallback}</div>
                  <div className="seller-email">{s.email}</div>
                </div>
                <span className={"seller-badge " + (s.disabled ? "badge-disabled" : "badge-active")}>
                  {s.disabled ? t.disabled : t.active}
                </span>
              </div>

              <div className="seller-meta">
                <span className="seller-meta-item">
                  {t.planLabel} <b><span className="seller-badge badge-plan">{planLabel(s.plan)}</span></b>
                </span>
                <span className="seller-meta-item">
                  {t.registrationDate} <b>{s.createdAt ? new Date(toMillis(s.createdAt)).toLocaleDateString(dateLocale) : "—"}</b>
                </span>
                {isSubscriptionExpired(s) && (
                  <span className="seller-badge badge-expired">{t.subscriptionExpired}</span>
                )}
                {emailVerifiedMap[s.id] === false && (
                  <span className="seller-badge badge-expired">{t.emailUnverified}</span>
                )}
                {emailVerifiedMap[s.id] === true && (
                  <span className="seller-badge badge-active">{t.emailVerified}</span>
                )}
              </div>

              <div className="expiry-row">
                <label htmlFor={`expiry-${s.id}`}>{t.subscriptionValidUntil}</label>
                <input
                  id={`expiry-${s.id}`}
                  type="date"
                  value={expiryDraftFor(s)}
                  onChange={(e) =>
                    setExpiryDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  disabled={savingExpiryId === s.id}
                  onClick={() => saveSubscriptionExpiry(s)}
                >
                  {savingExpiryId === s.id ? t.savingEllipsis : t.saveDate}
                </button>
              </div>

              <div className="expiry-row">
                <label htmlFor={`email-${s.id}`}>{t.sellerEmailLabel}</label>
                <input
                  id={`email-${s.id}`}
                  type="email"
                  value={emailDraftFor(s)}
                  onChange={(e) =>
                    setEmailDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  disabled={savingEmailId === s.id}
                  onClick={() => saveSellerEmail(s)}
                >
                  {savingEmailId === s.id ? t.savingEllipsis : t.saveEmail}
                </button>
              </div>
              {emailErrors[s.id] && <div className="dh-error">{emailErrors[s.id]}</div>}

              <div className="plan-row">
                <label htmlFor={`plan-${s.id}`}>{t.planLabel}</label>
                <select
                  id={`plan-${s.id}`}
                  value={planDraftFor(s)}
                  onChange={(e) => setPlanDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                >
                  <option value="basic">{t.planBasic}</option>
                </select>
                <button type="button" disabled={savingPlanId === s.id} onClick={() => savePlan(s)}>
                  {savingPlanId === s.id ? t.savingEllipsis : t.savePlan}
                </button>
              </div>

              <div className="seller-expand-hint" onClick={() => toggleExpand(s.id)}>
                {expandedId === s.id ? t.hideFullDetails : t.showFullDetails}
              </div>

              {expandedId === s.id && (
                <>
                  <div className="products-box">
                    <div className="detail-heading">{t.productsHeading}</div>
                    {productsLoading && !sellerProducts[s.id] && (
                      <div className="products-loading">{t.loadingProducts}</div>
                    )}
                    {sellerProducts[s.id] && sellerProducts[s.id].length === 0 && (
                      <div className="products-empty">{t.noProductsAdded}</div>
                    )}
                    {sellerProducts[s.id] &&
                      sellerProducts[s.id].map((p) => (
                        <div className="product-row" key={p.id}>
                          <div className="product-info">
                            <div className="product-name">{p.name}</div>
                            <div className="product-sub">
                              {p.price} {curr} · {p.category || t.generalCategory} · {p.type === "code" ? t.codeLicense : t.file}
                            </div>
                          </div>
                          <button
                            className="product-del"
                            disabled={deletingProductId === p.id}
                            onClick={() => deleteProduct(s.id, p)}
                          >
                            {deletingProductId === p.id ? t.deletingEllipsis : t.delete}
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">{t.lastOrdersHeading}</div>
                    {orders.filter((o) => o.ownerId === s.id).length === 0 && (
                      <div className="detail-empty">{t.noOrdersForStore}</div>
                    )}
                    {orders
                      .filter((o) => o.ownerId === s.id)
                      .slice(0, 15)
                      .map((o) => (
                        <div className="detail-row" key={o.id}>
                          <span>{o.productName || t.orderFallback}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {Number(o.price || 0).toFixed(2)} {curr} · {orderStatusLabel[o.status] || o.status}
                            <button
                              type="button"
                              className="product-del"
                              disabled={deletingOrderId === o.id}
                              onClick={() => deleteOrder(o)}
                            >
                              {deletingOrderId === o.id ? t.deletingEllipsis : t.delete}
                            </button>
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">{t.couponsHeading}</div>
                    {couponsLoading && !sellerCoupons[s.id] && (
                      <div className="detail-empty">{t.loadingCoupons}</div>
                    )}
                    {sellerCoupons[s.id] && sellerCoupons[s.id].length === 0 && (
                      <div className="detail-empty">{t.noCoupons}</div>
                    )}
                    {sellerCoupons[s.id] &&
                      sellerCoupons[s.id].map((c) => (
                        <div className="detail-row" key={c.id}>
                          <span>{c.code}</span>
                          <span>{t.discountLabel(c.discountPercent)} · {c.active ? t.couponActive : t.couponStopped}</span>
                        </div>
                      ))}
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">{t.manualTransferInstructionsHeading}</div>
                    <div className="detail-empty" style={{ whiteSpace: "pre-line" }}>
                      {s.paymentInstructions || t.noTransferInstructions}
                    </div>
                    {(s.paymentBankName || s.paymentAccountHolder || s.paymentAccountNumber || s.paymentPhoneNumber) && (
                      <div className="detail-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                        {s.paymentBankName && <span>{t.bankLabel} {s.paymentBankName}</span>}
                        {s.paymentAccountHolder && <span>{t.accountHolderLabel} {s.paymentAccountHolder}</span>}
                        {s.paymentAccountNumber && <span style={{ direction: "ltr" }}>{t.accountNumberLabel} {s.paymentAccountNumber}</span>}
                        {s.paymentPhoneNumber && <span style={{ direction: "ltr" }}>{t.phoneNumberLabel} {s.paymentPhoneNumber}</span>}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="seller-actions">
                <button
                  className="seller-btn warn"
                  disabled={busyId === s.id}
                  onClick={() => toggleDisabled(s)}
                >
                  {s.disabled ? t.reactivateAccount : t.disableAccount}
                </button>
                <button
                  className="seller-btn danger"
                  disabled={busyId === s.id}
                  onClick={() => deleteSeller(s)}
                >
                  {t.deletePermanently}
                </button>
              </div>
            </div>
          ))}

        {view === "products" && (
          <>
            {allProductsLoading && <div className="loading">{t.loadingAllProducts}</div>}
            {!allProductsLoading && allProducts.length === 0 && (
              <div className="empty">{t.noProductsOnPlatform}</div>
            )}
            {!allProductsLoading &&
              allProducts.map((p) => {
                const owner = sellers.find((s) => s.id === p.ownerId);
                return (
                  <div className="ap-row" key={p.id}>
                    <div className="ap-top">
                      <div>
                        <div className="ap-name">{p.name}</div>
                        <div className="ap-sub">
                          {p.price} {curr} · {p.category || t.generalCategory} · {p.type === "code" ? t.codeLicense : t.file}
                        </div>
                        <div className="ap-owner">
                          {t.sellerLabel} <b>{owner ? (owner.storeName || owner.email) : p.ownerId}</b>
                        </div>
                      </div>
                      {p.suspended && <span className="seller-badge badge-suspended">{t.suspended}</span>}
                    </div>
                    <div className="ap-actions">
                      <button
                        className="seller-btn warn"
                        disabled={busyProductId === p.id}
                        onClick={() => toggleSuspendProduct(p)}
                      >
                        {p.suspended ? t.cancelSuspension : t.suspendTemporarily}
                      </button>
                      <button
                        className="seller-btn danger"
                        disabled={busyProductId === p.id}
                        onClick={() => deleteAnyProduct(p)}
                      >
                        {t.deletePermanently}
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {view === "orders" && (
          <>
            <div className="admin-filters">
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                <option value="all">{t.allStatuses}</option>
                <option value="confirmed">{t.confirmed}</option>
                <option value="awaiting_seller_confirmation">{t.awaitingSellerConfirmation}</option>
                <option value="draft">{t.draftAwaitingTransfer}</option>
              </select>
            </div>
            {ordersLoading && <div className="loading">{t.loadingOrders}</div>}
            {!ordersLoading && orders.filter((o) => orderStatusFilter === "all" || o.status === orderStatusFilter).length === 0 && (
              <div className="empty">{t.noMatchingOrders}</div>
            )}
            {!ordersLoading &&
              orders
                .filter((o) => orderStatusFilter === "all" || o.status === orderStatusFilter)
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .map((o) => {
                  const owner = sellers.find((s) => s.id === o.ownerId);
                  return (
                    <div className="ap-row" key={o.id}>
                      <div className="ap-top">
                        <div>
                          <div className="ap-name">{o.productName || t.orderFallback}</div>
                          <div className="ap-sub">
                            {Number(o.price || 0).toFixed(2)} {curr} · {orderStatusLabel[o.status] || o.status}
                          </div>
                          <div className="ap-owner">
                            {t.sellerLabel} <b>{owner ? (owner.storeName || owner.email) : (o.ownerId || t.unknownDeleted)}</b>
                          </div>
                        </div>
                      </div>
                      <div className="ap-actions">
                        <button
                          className="seller-btn danger"
                          disabled={deletingOrderId === o.id}
                          onClick={() => deleteOrder(o)}
                        >
                          {deletingOrderId === o.id ? t.deletingEllipsis : t.deletePermanently}
                        </button>
                      </div>
                    </div>
                  );
                })}
          </>
        )}

        {view === "invites" && (
          <>
            <form className="invite-panel" onSubmit={createInvite}>
              <div className="invite-title">{t.newInviteTitle}</div>
              <div className="invite-sub">{t.newInviteSub}</div>
              {inviteError && <div className="invite-message error">{inviteError}</div>}
              {inviteSuccess && <div className="invite-message success">{inviteSuccess}</div>}
              {latestInviteUrl && <div className="invite-link"><code>{latestInviteUrl}</code><button className="invite-copy" type="button" onClick={copyInviteLink}>{t.copyLink}</button></div>}
              <div className="invite-field"><label>{t.storeNameLabel}</label><input value={inviteStoreName} onChange={(event) => setInviteStoreName(event.target.value)} placeholder={t.storeNamePlaceholder} required /></div>
              <div className="invite-field"><label>{t.whatDoesItSell}</label><select value={inviteStoreType} onChange={(event) => setInviteStoreType(event.target.value)}>{Object.entries(STORE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <button className="invite-create" type="submit" disabled={inviteCreating}>{inviteCreating ? t.creatingLinkEllipsis : t.createInviteLink}</button>
            </form>

            {invitesLoading && <div className="loading">{t.loadingInvites}</div>}
            {!invitesLoading && invites.length === 0 && <div className="empty">{t.noInvitesYet}</div>}
            {!invitesLoading && invites.map((invite) => <div className="invite-row" key={invite.id}>
              <div className="invite-row-top"><div><div className="invite-name">{invite.storeName}</div><div className="invite-email">{invite.acceptedEmail || t.notRegisteredYet}</div></div><span className={`seller-badge badge-${invite.status}`}>{inviteStatusLabel(invite.status)}</span></div>
              <div className="invite-meta">{STORE_TYPES[invite.storeType] || t.genericProducts} · {t.expiresLabel(invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString(dateLocale) : "—")}</div>
              <div className="seller-actions">
                {invite.status === "pending" && <button className="seller-btn warn" type="button" onClick={() => revokeInvite(invite)} disabled={revokingInviteId === invite.id}>{revokingInviteId === invite.id ? t.stoppingEllipsis : t.stopInvite}</button>}
                <button className="seller-btn danger" type="button" onClick={() => deleteInvite(invite)} disabled={deletingInviteId === invite.id}>{deletingInviteId === invite.id ? t.deletingEllipsis : t.deleteInvitePermanently}</button>
              </div>
            </div>)}
          </>
        )}

        {view === "coupons" && (
          <>
            <form className="invite-panel" onSubmit={createSignupCoupon}>
              <div className="invite-title">{t.newSignupCouponTitle}</div>
              <div className="invite-sub">{t.newSignupCouponSub(BASE_MONTHLY_PRICE.toFixed(2))}</div>
              {couponError && <div className="invite-message error">{couponError}</div>}
              <div className="invite-field"><label>{t.codeLabel}</label><input value={newCouponCode} onChange={(event) => setNewCouponCode(event.target.value)} placeholder={t.codePlaceholder} style={{ direction: "ltr", textAlign: "right" }} required /></div>
              <div className="invite-field"><label>{t.discountAmountLabel}</label><input type="number" min="0.1" step="0.1" value={newCouponDiscount} onChange={(event) => setNewCouponDiscount(event.target.value)} placeholder="مثال: 2" style={{ direction: "ltr", textAlign: "right" }} required /></div>
              <div className="invite-field"><label>{t.maxUsesLabel}</label><input type="number" min="1" step="1" value={newCouponMaxUses} onChange={(event) => setNewCouponMaxUses(event.target.value)} placeholder={t.unlimitedUsesPlaceholder} style={{ direction: "ltr", textAlign: "right" }} /></div>
              <button className="invite-create" type="submit" disabled={couponCreating}>{couponCreating ? t.creatingEllipsis : t.createCode}</button>
            </form>

            {signupCouponsLoading && <div className="loading">{t.loadingCodes}</div>}
            {!signupCouponsLoading && signupCoupons.length === 0 && <div className="empty">{t.noSignupCouponsYet}</div>}
            {!signupCouponsLoading && signupCoupons.map((coupon) => (
              <div className="invite-row" key={coupon.id}>
                <div className="invite-row-top">
                  <div>
                    <div className="invite-name">{coupon.id}</div>
                    <div className="invite-email">{t.discountLabel(Number(coupon.discountAmount || 0).toFixed(2))} {curr}</div>
                  </div>
                  <span className={"seller-badge " + (coupon.active ? "badge-active" : "badge-disabled")}>{coupon.active ? t.couponActiveBadge : t.couponStopped}</span>
                </div>
                <div className="invite-meta">
                  {t.usedCount(coupon.usedCount || 0, coupon.maxUses ? t.ofMax(coupon.maxUses) : t.timesNoLimit)}
                </div>
                <div className="seller-actions">
                  <button className="seller-btn" type="button" onClick={() => toggleCouponActive(coupon)} disabled={couponBusyCode === coupon.id}>
                    {couponBusyCode === coupon.id ? "..." : coupon.active ? t.stopCode : t.activateCode}
                  </button>
                  <button className="seller-btn danger" type="button" onClick={() => deleteSignupCoupon(coupon)} disabled={couponBusyCode === coupon.id}>
                    {couponBusyCode === coupon.id ? "..." : t.deletePermanently}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "paymentDebug" && (
          <>
            <div className="invite-sub" style={{ marginBottom: 14 }}>
              {t.paymentDebugIntro}
            </div>
            {paymentDebugLoading && <div className="loading">{t.loadingLog}</div>}
            {!paymentDebugLoading && paymentDebugLogs.length === 0 && (
              <div className="empty">{t.noUnrecognizedPayments}</div>
            )}
            {!paymentDebugLoading && paymentDebugLogs.map((log) => (
              <div className="invite-row" key={log.id}>
                <div className="invite-row-top">
                  <div>
                    <div className="invite-name">{log.kind || t.unknown} · {log.status || "unknown"}</div>
                    <div className="invite-email">{log.referenceNumber || "—"}</div>
                  </div>
                </div>
                <div className="invite-meta">
                  {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString(dateLocale) : ""} · uid: {log.uid || "—"}
                </div>
                <pre style={{
                  marginTop: 10, padding: 10, background: "#FBFAF7", border: "1px solid #E4E0D3",
                  borderRadius: 8, fontSize: 10.5, direction: "ltr", textAlign: "left",
                  whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 220, overflow: "auto",
                }}>{log.raw}</pre>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
