require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Telegram } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";

const ASSET_NAMES = [
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

function loadLocalAsset(name) {
  const assetPath = path.join(__dirname, "assets", `${name}.b64`);

  try {
    const encoded = fs.readFileSync(assetPath, "utf8").trim();
    if (!encoded) return null;

    return {
      source: Buffer.from(encoded, "base64"),
      filename: `${name}.jpg`,
    };
  } catch (error) {
    console.warn(`premium asset missing ${name}:`, error.message);
    return null;
  }
}

const assets = {};
for (const name of ASSET_NAMES) {
  assets[name] = loadLocalAsset(name);
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
  ) {
    return "home";
  }

  if (text.startsWith("💳 <b>PayPal</b>")) return "paypal";
  if (text.startsWith("💳 <b>Paysafecard</b>")) return "paysafecard";

  if (
    text.startsWith("💳 <b>Affiliation Yonibet</b>") ||
    text.includes("Conditions pour obtenir le VIP via Yonibet") ||
    text.startsWith("Yonibet n’est pas disponible") ||
    text.startsWith("L’affiliation Yonibet est réservée")
  ) {
    return "yonibet";
  }

  if (text.startsWith("💳 <b>Affiliation Celsius</b>")) return "celsius";

  if (
    text.startsWith("📎 <b>Envoie maintenant ta preuve Yonibet") ||
    text.startsWith("📎 Envoie maintenant ta ou tes preuves") ||
    text.startsWith("📎 Élément reçu")
  ) {
    return "proof";
  }

  if (/^✅ Tes \d+ élément\(s\) de preuve/.test(text)) return "pending";

  if (
    text.startsWith("✅ <b>VIP validé !</b>") ||
    text.startsWith("👑 VIP actif jusqu’au") ||
    text.startsWith("🔐 Voici ton lien personnel")
  ) {
    return "approved";
  }

  if (text.startsWith("❌ <b>Ta demande VIP n’a pas été validée.</b>")) {
    return "rejected";
  }

  if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) return "help";

  return null;
}

function clearKeyboard(extra) {
  return {
    ...extra,
    reply_markup: { inline_keyboard: [] },
  };
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
    caption =
      "👑 <b>Première souscription</b>\n\n" +
      "Choisis ton moyen d’accès au VIP.";
  } else if (text.includes("<b>Renouvellement VIP</b>")) {
    caption =
      "♻️ <b>Renouvellement VIP</b>\n\n" +
      "Choisis PayPal ou Paysafecard pour prolonger ton accès.";
  } else if (text.startsWith("💳 <b>PayPal</b>")) {
    caption =
      "💙 <b>Paiement PayPal</b>\n\n" +
      "1️⃣ Ouvre PayPal.\n" +
      "2️⃣ Effectue ton paiement.\n" +
      "3️⃣ Reviens ici et envoie ta preuve.\n\n" +
      "✅ Après validation, tu recevras ton accès VIP.";
  } else if (text.startsWith("💳 <b>Paysafecard</b>")) {
    caption =
      "🎫 <b>Paysafecard</b>\n\n" +
      "Tu as déjà un code ? Passe directement à l’envoi de ta preuve.\n\n" +
      "Tu n’en as pas ? Achète une Paysafecard puis reviens ici.\n\n" +
      "⚠️ <b>N’envoie jamais le PIN/code complet dans le bot.</b>";

    const keyboard = nextExtra?.reply_markup?.inline_keyboard || [];
    const flat = keyboard.flat();
    const proof = flat.find((button) =>
      String(button.callback_data || "").startsWith("proof:")
    );
    const back = flat.find(
      (button) =>
        button.callback_data === "renew" || button.callback_data === "subscribe"
    );

    if (proof) {
      nextExtra.reply_markup = {
        inline_keyboard: [
          [
            {
              text: "✅ J’ai déjà un code",
              callback_data: proof.callback_data,
            },
          ],
          [
            {
              text: "🛒 Je n’ai pas de code",
              url: "https://www.recharge.com/fr/fr/paysafecard",
            },
          ],
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
      "🎁 50 % du dépôt en freebet selon les conditions Yonibet.\n" +
      "🔞 18+ uniquement.\n" +
      "⚠️ N’envoie jamais de pièce d’identité, KYC, mot de passe ou données bancaires.";
  } else if (text.startsWith("💳 <b>Affiliation Celsius</b>")) {
    caption =
      "🟢 <b>Accès VIP via Celsius</b>\n\n" +
      "1️⃣ Inscris-toi avec le lien partenaire ci-dessous.\n" +
      "2️⃣ Effectue ton premier dépôt.\n" +
      "3️⃣ Envoie les preuves ici pour la validation admin.\n\n" +
      "🎁 <b>50 % de freebet sur le premier dépôt</b> (conditions Celsius).\n\n" +
      "🔞 18+ uniquement. Masque tes informations sensibles.";
  } else if (text.startsWith("ℹ️ Choisis ton moyen d’accès")) {
    caption =
      "❓ <b>Comment ça marche ?</b>\n\n" +
      "1️⃣ Choisis ton moyen d’accès.\n" +
      "2️⃣ Suis les étapes.\n" +
      "3️⃣ Envoie tes preuves.\n" +
      "4️⃣ Un admin vérifie.\n" +
      "5️⃣ Après validation, tu reçois ton lien VIP.\n\n" +
      "♻️ Renouvellement : PayPal ou Paysafecard.\n" +
      "🎁 Yonibet : premier accès uniquement.";

    nextExtra = {
      ...nextExtra,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "⬅️ Retour", callback_data: "home" }]],
      },
    };
  } else if (
    text.startsWith("📎 Envoie maintenant ta ou tes preuves") ||
    text.startsWith("📎 <b>Envoie maintenant ta preuve Yonibet")
  ) {
    const yonibet = text.includes("Yonibet");
    const celsius = text.includes("Celsius");

    caption =
      "📎 <b>Envoi des preuves</b>\n\n" +
      "Envoie tes captures, photos, PDF ou messages texte dans ce chat." +
      (yonibet
        ? "\n\nPour Yonibet : compte vérifié, dépôt confirmé et chat avec le code NASSRI."
        : celsius
          ? "\n\nPour Celsius : preuve d’inscription et de dépôt si l’offre le requiert."
          : "") +
      "\n\nTu peux en envoyer plusieurs. Quand tu as terminé, appuie sur <b>✅ J’ai terminé mes preuves</b>.\n\n" +
      "⚠️ Ne transmets jamais de pièce d’identité, mot de passe, données bancaires ou PIN Paysafecard complet.";

    nextExtra = clearKeyboard({ ...nextExtra, parse_mode: "HTML" });
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
      (count
        ? `✅ ${count} élément(s) transmis aux administrateurs.\n\n`
        : "") +
      "Ta demande est maintenant <b>en attente de validation</b>. Tu recevras le résultat ici.";

    nextExtra = clearKeyboard({ ...nextExtra, parse_mode: "HTML" });
  } else if (text.startsWith("❌ <b>Ta demande VIP n’a pas été validée.</b>")) {
    const reasonMatch = text.match(
      /📝 <b>Motif :<\/b>\s*([\s\S]*?)(?:\n\nTu peux|$)/
    );
    let reason = reasonMatch?.[1]?.trim() || "Motif communiqué par l’administrateur.";

    if (reason.length > 650) {
      reason = `${reason.slice(0, 647)}…`;
    }

    caption =
      "❌ <b>Demande refusée</b>\n\n" +
      `📝 <b>Motif :</b> ${reason}\n\n` +
      "Corrige le problème puis recommence.";

    nextExtra.parse_mode = "HTML";
  } else if (text.startsWith("✅ <b>VIP validé !</b>")) {
    caption = text;
    nextExtra.parse_mode = "HTML";
  } else if (text.startsWith("👑 VIP actif jusqu’au")) {
    caption = text;
    nextExtra = {
      ...nextExtra,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🏠 Accueil", callback_data: "home" }]],
      },
    };
  }

  return { caption, extra: nextExtra };
}

async function warmAssets() {
  if (warming || warmed || !BOT_TOKEN || !ADMIN_CHAT_ID) return;

  warming = true;
  const telegram = new Telegram(BOT_TOKEN);
  let count = 0;

  try {
    for (const name of ASSET_NAMES) {
      if (!assets[name]) continue;

      try {
        const message = await telegram.sendPhoto(ADMIN_CHAT_ID, assets[name], {
          disable_notification: true,
        });
        const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;

        if (photo?.file_id) {
          assets[name] = photo.file_id;
          count += 1;
        }

        await telegram
          .deleteMessage(ADMIN_CHAT_ID, message.message_id)
          .catch(() => {});
      } catch (error) {
        console.warn(`premium asset warm ${name}:`, error.message);
      }
    }

    warmed = count === ASSET_NAMES.length;
    console.log(`Premium visuals warmed: ${count}/${ASSET_NAMES.length}`);
  } finally {
    warming = false;
  }
}

if (Telegram?.prototype?.sendMessage) {
  const originalSendMessage = Telegram.prototype.sendMessage;
  const originalSendPhoto = Telegram.prototype.sendPhoto;
  const originalCopyMessage = Telegram.prototype.copyMessage;

  Telegram.prototype.sendMessage = async function premiumSendMessage(
    chatId,
    text,
    extra = {}
  ) {
    const originalText = String(text || "");

    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      return originalSendMessage.call(this, chatId, text, extra);
    }

    if (originalText === "Action annulée.") {
      const existingId = userCards.get(String(chatId));
      return existingId
        ? { message_id: existingId }
        : originalSendMessage.call(this, chatId, text, extra);
    }

    const screen = screenFor(originalText);
    if (!screen || !getAsset(screen)) {
      return originalSendMessage.call(this, chatId, text, extra);
    }

    const transformed = transformedCopy(originalText, extra);
    const key = String(chatId);
    const existingId = userCards.get(key);
    const replyMarkup =
      transformed.extra?.reply_markup || { inline_keyboard: [] };

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
          { reply_markup: replyMarkup }
        );

        userCards.set(key, existingId);
        return edited;
      } catch (error) {
        const message = String(error?.description || error?.message || "");

        if (message.includes("message is not modified")) {
          return { message_id: existingId };
        }

        console.warn("premium card edit:", error.message);
      }
    }

    const sent = await originalSendPhoto.call(this, chatId, getAsset(screen), {
      caption: transformed.caption,
      parse_mode: transformed.extra?.parse_mode || "HTML",
      reply_markup: replyMarkup,
    });

    userCards.set(key, sent.message_id);
    return sent;
  };

  Telegram.prototype.copyMessage = async function premiumCopyMessage(
    chatId,
    fromChatId,
    messageId,
    extra = {}
  ) {
    const copied = await originalCopyMessage.call(
      this,
      chatId,
      fromChatId,
      messageId,
      extra
    );

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
  warmAssets().catch((error) =>
    console.warn("premium warm:", error.message)
  );
}, 1200);

module.exports = { getAsset, warmAssets };
