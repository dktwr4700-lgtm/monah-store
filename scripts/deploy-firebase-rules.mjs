// ينشر قواعد الحماية من المستودع مباشرة إلى Firebase بدل ما تنسخها يدويًا
// للكونسول: firestore.rules (قاعدة البيانات) و storage.rules (الملفات).
// يشغّله GitHub Actions (.github/workflows/firebase-rules.yml):
//   node scripts/deploy-firebase-rules.mjs          → ينشر اللي تغيّر عن النسخة الشغالة
//   node scripts/deploy-firebase-rules.mjs --check  → يتحقق بس (للـPR): يترجم القواعد
//                                                    ويعرض الفرق عن النسخة الشغالة، بدون نشر
// المفتاح يجي من GitHub Secret باسم FIREBASE_SERVICE_ACCOUNT، ما ينحفظ بأي ملف.
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { cert, initializeApp } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";
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

const TARGETS = [
  {
    file: "firestore.rules",
    live: () => rules.getFirestoreRuleset(),
    release: (source) => rules.releaseFirestoreRulesetFromSource(source),
  },
  {
    file: "storage.rules",
    live: () => rules.getStorageRuleset(STORAGE_BUCKET),
    release: (source) => rules.releaseStorageRulesetFromSource(source, STORAGE_BUCKET),
  },
];

function normalize(source) {
  return source.replace(/\r\n/g, "\n").trim();
}

async function liveSource(target) {
  try {
    const ruleset = await target.live();
    return ruleset.source.map((file) => file.content).join("\n");
  } catch (error) {
    // ما فيه قواعد منشورة لهذا المنتج بعد (أو ما نقدر نقراها) — نعامله كفرق.
    console.warn(`Could not read live ${target.file}: ${error.message}`);
    return "";
  }
}

async function printDiff(file, live, repo) {
  const dir = await mkdtemp(join(tmpdir(), "rules-"));
  const liveFile = join(dir, `live-${file}`);
  const repoFile = join(dir, `repo-${file}`);
  await writeFile(liveFile, `${live}\n`);
  await writeFile(repoFile, `${repo}\n`);
  const result = spawnSync("diff", ["-u", "--label", `live/${file}`, "--label", `repo/${file}`, liveFile, repoFile], { encoding: "utf8" });
  console.log(result.stdout || "(no textual diff)");
}

let failed = false;
for (const target of TARGETS) {
  const repo = normalize(await readFile(new URL(`../${target.file}`, import.meta.url), "utf8"));
  const live = normalize(await liveSource(target));
  const changed = repo !== live;
  try {
    if (checkOnly) {
      // إنشاء ruleset يخلي Firebase يترجم القواعد ويرجع أي خطأ فيها بدون ما
      // يغيّر القواعد الشغالة، وبعدها نحذفه عشان ما تتكدس نسخ تجريبية.
      const ruleset = await rules.createRuleset(rules.createRulesFileFromSource(target.file, repo));
      await rules.deleteRuleset(ruleset.name).catch(() => {});
      console.log(`${target.file}: compiles cleanly. ${changed ? "Differs from the live rules — will be released on merge:" : "Same as the live rules."}`);
      if (changed) await printDiff(target.file, live, repo);
    } else if (!changed) {
      console.log(`${target.file}: already live, nothing to release.`);
    } else {
      const ruleset = await target.release(repo);
      console.log(`${target.file}: released as ${ruleset.name} on ${serviceAccount.project_id}.`);
    }
  } catch (error) {
    failed = true;
    console.error(`${target.file}: ${checkOnly ? "check" : "release"} failed: ${error.message}`);
  }
}
if (failed) process.exit(1);
