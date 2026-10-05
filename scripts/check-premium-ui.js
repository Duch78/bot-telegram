const fs = require("fs");
const path = require("path");

const expected = [
  "home",
  "paypal",
  "paysafecard",
  "yonibet",
  "proof",
  "pending",
  "approved",
  "rejected",
  "help",
];

for (const name of expected) {
  const file = path.join(__dirname, "..", "src", "assets", `${name}.b64`);
  if (!fs.existsSync(file)) throw new Error(`Missing asset: ${name}`);

  const encoded = fs.readFileSync(file, "utf8").trim();
  const data = Buffer.from(encoded, "base64");
  if (data.length < 1024 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error(`Invalid JPEG asset: ${name}`);
  }
}

console.log(`Premium UI assets OK (${expected.length}/${expected.length})`);
