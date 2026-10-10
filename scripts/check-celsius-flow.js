const fs = require("fs");
const assert = require("node:assert/strict");

const index = fs.readFileSync("src/index.js", "utf8");
const ui = fs.readFileSync("src/premium-ui.js", "utf8");
const encoded = fs.readFileSync("src/assets/celsius.b64", "utf8").trim();
const jpg = Buffer.from(encoded, "base64");

assert.ok(jpg.length > 4096, "Celsius image must contain usable image data");
assert.equal(jpg[0], 0xff, "Expected a JPEG image");
assert.equal(jpg[1], 0xd8, "Expected a JPEG image");
assert.equal(jpg.at(-2), 0xff, "Expected JPEG end marker");
assert.equal(jpg.at(-1), 0xd9, "Expected JPEG end marker");

for (const expected of [
  "https://lrct.gg/nassri",
  "50 % de freebet sur ton premier dépôt",
  "method:${kind}:celsius",
  "Affiliation Celsius",
  "method === \"celsius\"",
  "proof:(initial|renewal):(paypal|paysafecard|yonibet|celsius)",
  "Les accès partenaires Yonibet et Celsius sont réservés à la première souscription",
]) {
  assert.ok(index.includes(expected), "Missing Celsius callback/text: " + expected);
}
for (const expected of [
  '"celsius"',
  'return "celsius"',
  "50 % de freebet sur le premier dépôt",
  "Envoie tes preuves Celsius",
  "Pour Celsius : preuve d’inscription et du premier dépôt",
]) {
  assert.ok(ui.includes(expected), "Missing premium UI Celsius integration: " + expected);
}
console.log("Celsius VIP assets, links, menu, proof and premium card OK");
