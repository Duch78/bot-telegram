const fs = require("fs");

const ui = fs.readFileSync("src/premium-ui.js", "utf8");

const requiredScreens = [
  "home",
  "paypal",
  "paysafecard",
  "yonibet",
  "celsius",
  "proof",
  "pending",
  "approved",
  "rejected",
  "help",
];

for (const screen of requiredScreens) {
  if (!ui.includes(`\"${screen}\"`)) {
    throw new Error(`Missing screen mapping: ${screen}`);
  }
}

const requiredFeatures = [
  "editMessageMedia",
  "userCards",
  "J’ai déjà un code",
  "Je n’ai pas de code",
  "Motif :",
  "Premium visuals warmed",
];

for (const feature of requiredFeatures) {
  if (!ui.includes(feature)) {
    throw new Error(`Missing premium UI feature: ${feature}`);
  }
}

console.log("Premium single-card flow OK");
