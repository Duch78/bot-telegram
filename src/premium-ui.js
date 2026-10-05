const { Telegram } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

// Temporary source URLs are used only once to import the approved visuals into
// Telegram's own media cache. Once imported, the returned file_ids are used in
// memory and can later be hard-coded without depending on these URLs.
const ASSET_URLS = {
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

const assets = { ...ASSET_URLS };
let warming = false;
let warmed = false;

function pickAsset(text) {
  if (!text) return null;
  if (text.includes("<b>VIP Pronostics</b>") || text.includes("<b>VIP actif</b>")) return "home";
  if (text.startsWith("💳 <b>PayPal</b>")) return "paypal";
  if (text.startsWith("💳 <b>Paysafecard</b>")) return "paysafecard";
  if (text.startsWith("💳 <b>Affiliation Yonibet</b>") || text.includes("Conditions pour obtenir le VIP via Yonibet")) return "yonibet";
  if (text.startsWith("📎 <b>Envoie maintenant ta preuve Yonibet")) return "proof";
  if (text.startsWith("📎 Envoie maintenant ta ou tes preuves")) return "proof";
  if (/^✅ Tes \d+ élément\(s\) de preuve/.test(text)) return "pending";
  if (text.startsWith("✅ <b>VIP validé !</b>")) return "approved";
  if (text.startsWith("❌ <b>Ta demande VIP n’a pas été validée.</b>")) return "rejected";
  if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) return "help";
  return null;
}

function premiumCopy(text, extra) {
  let nextText = text;
  let nextExtra = extra ? { ...extra } : {};

  if (text.includes("<b>VIP Pronostics</b>")) {
    const price = text.match(/Accès VIP : <b>(.*?)<\/b>/)?.[1] || "25 €";
    const days = text.match(/Durée : <b>(\d+) jours<\/b>/)?.[1] || "30";
    nextText =
      "👑 <b>Bienvenue sur le VIP NASSRI</b>\n\n" +
      "Accède au canal privé pour retrouver les pronostics et contenus réservés aux membres.\n\n" +
      `💰 Tarif : <b>${price}</b>\n` +
      `📅 Durée : <b>${days} jours</b>\n\n` +
      "Choisis ce que tu veux faire ci-dessous 👇";
  }

  if (text.startsWith("💳 <b>PayPal</b>")) {
    nextText =
      "💙 <b>Paiement par PayPal</b>\n\n" +
      "1️⃣ Appuie sur le bouton PayPal ci-dessous.\n" +
      "2️⃣ Effectue ton paiement.\n" +
      "3️⃣ Reviens ici et envoie ta preuve.\n\n" +
      "✅ Après vérification par un admin, tu recevras ton accès VIP.";
  }

  if (text.startsWith("💳 <b>Paysafecard</b>")) {
    nextText =
      "🎫 <b>Paiement par Paysafecard</b>\n\n" +
      "Tu as déjà une Paysafecard ? Envoie uniquement une preuve utile au contrôle.\n\n" +
      "Tu n’en as pas encore ? Tu peux en acheter une via Recharge.com puis revenir ici.\n\n" +
      "⚠️ <b>N’envoie jamais le PIN/code complet de ta Paysafecard dans le bot.</b>";

    const keyboard = nextExtra?.reply_markup?.inline_keyboard || [];
    const flat = keyboard.flat();
    const proof = flat.find((b) => String(b.callback_data || "").startsWith("proof:"));
    const back = flat.find((b) => b.callback_data === "renew" || b.callback_data === "subscribe");
    if (proof) {
      nextExtra = {
        ...nextExtra,
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ J’ai déjà un code", callback_data: proof.callback_data }],
            [{ text: "🛒 Je n’ai pas de code", url: "https://www.recharge.com/fr/fr/paysafecard" }],
            ...(back ? [[back]] : []),
          ],
        },
      };
    }
  }

  if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) {
    nextText =
      "❓ <b>Comment ça marche ?</b>\n\n" +
      "1️⃣ Choisis ton moyen d’accès.\n" +
      "2️⃣ Suis les étapes affichées.\n" +
      "3️⃣ Envoie ta ou tes preuves.\n" +
      "4️⃣ Un admin vérifie ta demande.\n" +
      "5️⃣ Si elle est validée, tu reçois ton lien personnel vers le VIP.\n\n" +
      "♻️ Les renouvellements se font uniquement par PayPal ou Paysafecard.\n" +
      "🎁 Yonibet est réservé au premier accès.";
    nextExtra = { ...nextExtra, parse_mode: "HTML" };
  }

  if (text.startsWith("📎 Envoie maintenant ta ou tes preuves")) {
    nextText =
      "📎 <b>Envoi des preuves</b>\n\n" +
      "Envoie maintenant ta ou tes preuves dans ce chat.\n\n" +
      "Tu peux envoyer plusieurs photos, captures, PDF ou messages texte à la suite.\n" +
      "Quand tu as tout envoyé, appuie sur <b>✅ J’ai terminé mes preuves</b>.\n\n" +
      "⚠️ Ne transmets jamais de pièce d’identité ni le PIN/code complet d’une Paysafecard.\n\n" +
      "Tape /cancel pour annuler.";
    nextExtra = { ...nextExtra, parse_mode: "HTML" };
  }

  return { text: nextText, extra: nextExtra };
}

async function warmAssets() {
  if (warming || warmed || !BOT_TOKEN || !ADMIN_CHAT_ID) return;
  warming = true;
  const telegram = new Telegram(BOT_TOKEN);
  const fileIds = {};

  try {
    for (const [name, url] of Object.entries(ASSET_URLS)) {
      try {
        const message = await telegram.sendPhoto(ADMIN_CHAT_ID, url, {
          disable_notification: true,
        });
        const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
        if (photo?.file_id) {
          fileIds[name] = photo.file_id;
          assets[name] = photo.file_id;
        }
        await telegram.deleteMessage(ADMIN_CHAT_ID, message.message_id).catch(() => {});
      } catch (error) {
        console.warn(`premium asset warm ${name}:`, error.message);
      }
    }

    if (Object.keys(fileIds).length) {
      console.log("PREMIUM_ASSET_FILE_IDS=" + JSON.stringify(fileIds));
    }
    warmed = Object.keys(fileIds).length === Object.keys(ASSET_URLS).length;
  } finally {
    warming = false;
  }
}

if (Telegram?.prototype?.sendMessage) {
  const originalSendMessage = Telegram.prototype.sendMessage;

  Telegram.prototype.sendMessage = async function patchedSendMessage(chatId, text, extra = {}) {
    const originalText = String(text || "");
    const assetName = pickAsset(originalText);
    const transformed = premiumCopy(originalText, extra);

    if (assetName && assets[assetName]) {
      try {
        await this.sendPhoto(chatId, assets[assetName], { disable_notification: true });
      } catch (error) {
        console.warn(`premium visual ${assetName}:`, error.message);
      }
    }

    return originalSendMessage.call(this, chatId, transformed.text, transformed.extra);
  };
}

// Delay slightly so the main process can boot; this silently imports/deletes the
// nine visuals in the admin channel and switches the process to Telegram file_ids.
setTimeout(() => warmAssets().catch((error) => console.warn("premium warm:", error.message)), 1200);
