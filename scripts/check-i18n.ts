import zh from "../src/i18n/dictionaries/zh";
import en from "../src/i18n/dictionaries/en";

const zhKeys = new Set(Object.keys(zh));
const enKeys = new Set(Object.keys(en));

const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));

if (onlyInZh.length === 0 && onlyInEn.length === 0) {
  console.log(`✓ i18n dictionaries aligned (${zhKeys.size} keys)`);
  process.exit(0);
}

if (onlyInZh.length > 0) {
  console.error("✗ Missing in en.ts:");
  for (const k of onlyInZh) console.error(`  - ${k}`);
}
if (onlyInEn.length > 0) {
  console.error("✗ Missing in zh.ts:");
  for (const k of onlyInEn) console.error(`  - ${k}`);
}
process.exit(1);
