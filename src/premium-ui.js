require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Telegram } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

// Fallbacks keep the bot functional if a local visual is ever missing.
const FALLBACK_URLS = {
  home: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/f775000e-a3f0-46e7-8a57-7e7c9dfa29ca.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNGY1YjdhMzhkNWMxMmQzMiIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMwMjMyOH0.Hu6Wm2D-Now8m9EKuuXZryDmwke4L5fh7pHvS8eMWQ0",
  paypal: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/6cc63499-fd59-4d49-b798-fd3df3b66fa1.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNWM5N2JjZTExNzIwN2UwMSIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMwNzM2MX0.3OSENSesM-iNjU_MnaV5mvXUvjNRYpD_xM-qZnA3G5c",
  paysafecard: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/d7277cbf-535f-413c-9947-1892ac85a13f.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZTRmZjExYzA5ZTk2NzMyNyIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMwMzg3Mn0.3gpwH2IbvrVkXYhQg4u_7Z_8WZiuOP4CfO_3XrLHlmE",
  yonibet: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/633edf8b-c085-4588-8a4b-a69dae4b32bc.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZWE3MzEyNzg4Y2UxNmM0ZCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTI5NDcxMn0.iSt-uKt8aS8XI7WstTK5ZN2Sor8heHHB-4dPs4uJaq8",
  proof: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/ac7ab979-905a-4555-8e15-31d2bc727797.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZDI5YzMxZmMxYTEwMjA4ZCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTI4MjE3Mn0.TlsfPtaYGb4qWCsjEXkhWhbAc9fXqXIcS04cXc4-uxY",
  pending: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/0b8f197d-f875-454e-a05e-53eba9970966.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiOGNkMDA1NjRkZTRmMzFhZCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzOTEwOH0.BI58D_H-laqrkZhYRhzg34wDeorHF4rRY1fMzQQXaUo",
  approved: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/d57b5319-f497-4a12-9a48-b05d5e47fd71.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYjk3OGQ2Mzg0MTE1ZDgxOSIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzOTMyMH0.pTTlu3AHZJcvhmC6NWFPZzxJSfbZ5eihH7eUdEY4Xic",
  rejected: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/0bce7df2-6622-4609-af0a-a27c5c72298f.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjNlYzdjOWI1Yjc1YTFjNiIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMwNTc1NX0.J2_ZuF4QSfBRNoqPk6a1M23b5jap-oc__t2QQS9tVpo",
  help: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/3ad45e4c-59c6-4022-af60-e9b39c8d1d9b.jpg?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYjhhMWQ0Yzg1MTFmYjdkYiIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzMTkxMn0.P5Omz7-4PybkKvfn_Uzo38MUbsPDk8kKxvi9IPttt9A",
};

function loadLocalAsset(name) {
  const assetPath = path.join(__dirname, "assets", `${name}.b64`);
  try {
    const encoded = fs.readFileSync(assetPath, "utf8").trim();
    if (!encoded) return null;
    return { source: Buffer.from(encoded, "base64"), filename: `${name}.jpg` };
  } catch {
    return null;
  }
}

const assets = {};
for (const name of Object.keys(FALLBACK_URLS)) {
  assets[name] = loadLocalAsset(name) || FALLBACK_URLS[name];
}

let warming = false;
let warmed = false;

function getAsset(name) {
  return assets[name] || assets.home;
}

async function warmAssets() {
  if (warming || warmed || !BOT_TOKEN || !ADMIN_CHAT_ID) return;
  warming = true;
  const telegram = new Telegram(BOT_TOKEN);
  let count = 0;

  try {
    for (const name of Object.keys(assets)) {
      try {
        const message = await telegram.sendPhoto(ADMIN_CHAT_ID, assets[name], {
          disable_notification: true,
        });
        const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
        if (photo?.file_id) {
          assets[name] = photo.file_id;
          count += 1;
        }
        await telegram.deleteMessage(ADMIN_CHAT_ID, message.message_id).catch(() => {});
      } catch (error) {
        console.warn(`premium asset warm ${name}:`, error.message);
      }
    }
    warmed = count === Object.keys(assets).length;
    console.log(`Premium visuals warmed: ${count}/${Object.keys(assets).length}`);
  } finally {
    warming = false;
  }
}

setTimeout(() => {
  warmAssets().catch((error) => console.warn("premium warm:", error.message));
}, 1200);

module.exports = { getAsset, warmAssets };
