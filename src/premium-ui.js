require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Telegram } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

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

const userCards = new Map();
let warming = false;
let warmed = false;

function getAsset(name) {
  return assets[name] || assets.home;
}

function screenFor(text) {
  if (!text) return null;
  if (
    text.includes("<b>VIP Pronostics</b>") ||
    text.includes("<b>VIP actif</b>") ||
    text.includes("<b>Première souscription</b>") ||
    text.includes("<b>Renouvellement VIP</b>") ||
    text.startsWith("Ton VIP n’est pas actif") ||
    text.startsWith("Ton abonnement n’est plus actif")
  ) return "home";
  if (text.startsWith("💳 <b>PayPal</b>")) return "paypal";
  if (text.startsWith("💳 <b>Paysafecard</b>")) return "paysafecard";
  if (
    text.startsWith("💳 <b>Affiliation Yonibet</b>") ||
    text.includes("Conditions pour obtenir le VIP via Yonibet") ||
    text.startsWith("Yonibet n’est pas disponible") ||
    text.startsWith("L’affiliation Yonibet est réservée")
  ) return "yonibet";
  if (
    text.startsWith("📎 <b>Envoie maintenant ta preuve Yonibet") ||
    text.startsWith("📎 Envoie maintenant ta ou tes preuves") ||
    text.startsWith("📎 Élément reçu")
  ) return "proof";
  if (/^✅ Tes \d+ élément\(s\) de preuve/.test(text)) return "pending";
  if (
    text.startsWith("✅ <b>VIP validé !</b>") ||
    text.startsWith("👑 VIP actif jusqu’au") ||
    text.startsWith("🔐 Voici ton lien personnel")
  ) return "approved";
  if (text.startsWith("❌ <b>Ta demande VIP n’a pas été validée.</b>")) return "rejected";
  if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) return "help";
  return null;
}

function transformedCopy(text, extra = {}) {
  let caption = text;
  let nextExtra = { ...extra };

  if (text.includes("<b>VIP Pronostics</b>")) {
    const price = text.match(/Accès VIP : <b>(.*?)<\/b>/)?.[1] || "25 €";
    const days = text.match(/Durée : <b>(\d+) jours<\/b>/)?.[1] || "30";
    caption =
      "👑 <b>Bienvenue sur le VIP NASSRI</b>\n\n" +
      `💰 <b>${price}</b> • 📅 <b>${days} jours</b>\n\n` +
      "Choisis ce que tu veux faire 👇";
  } else if (text.includes("<b>Première souscription</b>")) {
    caption = "👑 <b>Première souscription</b>\n\nChoisis ton moyen d’accès au VIP.";
  } else if (text.includes("<b>Renouvellement VIP</b>")) {
    caption = "♻️ <b>Renouvellement VIP</b>\n\nChoisis PayPal ou Paysafecard pour prolonger ton accès.";
  } else if (text.startsWith("💳 <b>PayPal</b>")) {
    caption =
      "💙 <b>Paiement PayPal</b>\n\n" +
      "1️⃣ Ouvre PayPal.\n2️⃣ Effectue ton paiement.\n3️⃣ Reviens ici et envoie ta preuve.\n\n" +
      "✅ Après validation, tu recevras ton accès VIP.";
  } else if (text.startsWith("💳 <b>Paysafecard</b>")) {
    caption =
      "🎫 <b>Paysafecard</b>\n\n" +
      "Tu as déjà un code ? Passe directement à l’envoi de ta preuve.\n\n" +
      "Tu n’en as pas ? Achète une Paysafecard puis reviens ici.\n\n" +
      "⚠️ <b>N’envoie jamais le PIN/code complet dans le bot.</b>";

    const keyboard = nextExtra?.reply_markup?.inline_keyboard || [];
    const flat = keyboard.flat();
    const proof = flat.find((button) => String(button.callback_data || "").startsWith("proof:"));
    const back = flat.find((button) => button.callback_data === "renew" || button.callback_data === "subscribe");
    if (proof) {
      nextExtra.reply_markup = {
        inline_keyboard: [
          [{ text: "✅ J’ai déjà un code", callback_data: proof.callback_data }],
          [{ text: "🛒 Je n’ai pas de code", url: "https://www.recharge.com/fr/fr/paysafecard" }],
          ...(back ? [[back]] : []),
        ],
      };
    }
  } else if (text.startsWith("💳 <b>Affiliation Yonibet</b>")) {
    caption =
      "🎁 <b>Accès via Yonibet</b>\n\n" +
      "1️⃣ Inscris-toi via le lien NASSRI.\n" +
      "2️⃣ Fais vérifier ton compte par Yonibet.\n" +
      "3️⃣ Effectue un dépôt.\n" +
      "4️⃣ Contacte le live chat avec le code <b>NASSRI</b>.\n\n" +
      "📎 Prépare les captures : compte vérifié, dépôt confirmé et chat avec le code NASSRI.\n\n" +
      "🎁 50 % du dépôt en freebet selon les conditions Yonibet.\n🔞 18+ uniquement.\n" +
      "⚠️ N’envoie jamais de pièce d’identité, KYC, mot de passe ou données bancaires.";
  } else if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) {
    caption =
      "❓ <b>Comment ça marche ?</b>\n\n" +
      "1️⃣ Choisis ton moyen d’accès.\n2️⃣ Suis les étapes.\n3️⃣ Envoie tes preuves.\n" +
      "4️⃣ Un admin vérifie.\n5️⃣ Après validation, tu reçois ton lien VIP.\n\n" +
      "♻️ Renouvellement : PayPal ou Paysafecard.\n🎁 Yonibet : premier accès uniquement.";
    nextExtra.parse_mode = "HTML";
  } else if (
    text.startsWith("📎 Envoie maintenant ta ou tes preuves") ||
    text.startsWith("📎 <b>Envoie maintenant ta preuve Yonibet")
  ) {
    const yonibet = text.includes("Yonibet");
    caption =
      "📎 <b>Envoi des preuves</b>\n\n" +
      "Envoie tes captures, photos, PDF ou messages texte dans ce chat." +
      (yonibet
        ? "\n\nPour Yonibet : compte vérifié, dépôt confirmé et chat avec le code NASSRI."
        : "") +
      "\n\nTu peux en envoyer plusieurs. Quand tu as terminé, appuie sur <b>✅ J’ai terminé mes preuves</b>.\n\n" +
      "⚠️ Ne transmets jamais de pièce d’identité, mot de passe, données bancaires ou PIN Paysafecard complet.";
    nextExtra.parse_mode = "HTML";
  } else if (text.startsWith("📎 Élément reçu")) {
    const count = text.match(/\((\d+)\)/)?.[1] || "1";
    caption =
      `📎 <b>${count} élément(s) reçu(s)</b>\n\n` +
      "Tu peux continuer à envoyer tes preuves. Quand tu as terminé, appuie sur le bouton ci-dessous.";
    nextExtra.parse_mode = "HTML";
  } else if (/^✅ Tes \d+ élément\(s\) de preuve/.test(text)) {
    const count = text.match(/^✅ Tes (\d+)/)?.[1] || "";
    caption =
      "⏳ <b>Preuves envoyées</b>\n\n" +
      (count ? `✅ ${count} élément(s) transmis aux administrateurs.\n\n` : "") +
      "Ta demande est maintenant <b>en attente de validation</b>. Tu recevras le résultat ici.";
    nextExtra.parse_mode = "HTML";
  }

  return { caption, extra: nextExtra };
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

if (Telegram?.prototype?.sendMessage) {
  const originalSendMessage = Telegram.prototype.sendMessage;
  const originalSendPhoto = Telegram.prototype.sendPhoto;
  const originalCopyMessage = Telegram.prototype.copyMessage;

  Telegram.prototype.sendMessage = async function premiumSendMessage(chatId, text, extra = {}) {
    const originalText = String(text || "");

    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      return originalSendMessage.call(this, chatId, text, extra);
    }

    if (originalText === "Action annulée.") {
      const existingId = userCards.get(String(chatId));
      return existingId ? { message_id: existingId } : originalSendMessage.call(this, chatId, text, extra);
    }

    const screen = screenFor(originalText);
    if (!screen) {
      return originalSendMessage.call(this, chatId, text, extra);
    }

    const transformed = transformedCopy(originalText, extra);
    const key = String(chatId);
    const existingId = userCards.get(key);
    const replyMarkup = transformed.extra?.reply_markup;
    const media = {
      type: "photo",
      media: getAsset(screen),
      caption: transformed.caption,
      parse_mode: transformed.extra?.parse_mode || "HTML",
    };

    if (existingId) {
      try {
        const edited = await this.editMessageMedia(
          chatId,
          existingId,
          undefined,
          media,
          replyMarkup ? { reply_markup: replyMarkup } : {}
        );
        userCards.set(key, existingId);
        return edited;
      } catch (error) {
        if (String(error?.description || error?.message || "").includes("message is not modified")) {
          return { message_id: existingId };
        }
        console.warn("premium card edit:", error.message);
      }
    }

    const sent = await originalSendPhoto.call(this, chatId, getAsset(screen), {
      caption: transformed.caption,
      parse_mode: transformed.extra?.parse_mode || "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
    userCards.set(key, sent.message_id);
    return sent;
  };

  Telegram.prototype.copyMessage = async function premiumCopyMessage(chatId, fromChatId, messageId, extra = {}) {
    const copied = await originalCopyMessage.call(this, chatId, fromChatId, messageId, extra);

    if (
      String(chatId) === String(ADMIN_CHAT_ID) &&
      String(fromChatId) !== String(ADMIN_CHAT_ID)
    ) {
      setTimeout(() => {
        this.deleteMessage(fromChatId, messageId).catch(() => {});
      }, 200);
    }

    return copied;
  };
}

setTimeout(() => {
  warmAssets().catch((error) => console.warn("premium warm:", error.message));
}, 1200);

module.exports = { getAsset, warmAssets };
