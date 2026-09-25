// ينشر firestore.rules من المستودع مباشرة إلى Firebase بدل ما تنسخ القواعد
// يدويًا للكونسول. يشغّله GitHub Actions (.github/workflows/firestore-rules.yml):
//   node scripts/deploy-firestore-rules.mjs            → يتحقق من القواعد وينشرها
//   node scripts/deploy-firestore-rules.mjs --check    → يتحقق بس (للـPR) بدون نشر
// المفتاح يجي من GitHub Secret باسم FIREBASE_SERVICE_ACCOUNT، ما ينحفظ بأي ملف.
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

const checkOnly = process.argv.includes("--check");

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "");
} catch {
  serviceAccount = null;
}
if (!serviceAccount?.project_id || !serviceAccount?.private_key) {
  console.error("FIREBASE_SERVICE_ACCOUNT is missing or is not a valid service-account JSON.");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const rules = getSecurityRules();
const source = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

try {
  if (checkOnly) {
    // إنشاء ruleset يخلي Firebase يترجم القواعد ويرجع أي خطأ فيها، بدون ما
    // يغيّر القواعد الشغالة. نحذفه بعدها عشان ما تتكدس نسخ تجريبية.
    const ruleset = await rules.createRuleset(rules.createRulesFileFromSource("firestore.rules", source));
    await rules.deleteRuleset(ruleset.name).catch(() => {});
    console.log(`firestore.rules compiles cleanly on ${serviceAccount.project_id}.`);
  } else {
    const ruleset = await rules.releaseFirestoreRulesetFromSource(source);
    console.log(`Released firestore.rules as ${ruleset.name} on ${serviceAccount.project_id}.`);
  }
} catch (error) {
  console.error(`Firestore rules ${checkOnly ? "check" : "deploy"} failed: ${error.message}`);
  process.exit(1);
}
