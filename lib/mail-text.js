// نسخة نص عادي من الإيميل: برامج البريد تثق أكثر بالإيميل اللي فيه نسختين (HTML ونص)، وتقل فرصة يروح للمزعج
export function toText(html) {
  return String(html || "")
    .replace(/<(style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2: $1")
    .replace(/<br\s*\/?>|<\/(p|div|tr|h\d|li|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}
