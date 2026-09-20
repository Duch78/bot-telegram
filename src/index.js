require("dotenv").config();

const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const PORT = Number(process.env.PORT || 10000);
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
const VIP_CHAT_ID = process.env.VIP_CHAT_ID || "";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || "/telegram/webhook";
const PAYPAL_URL = process.env.PAYPAL_URL || "https://www.paypal.com/qrcodes/p2pqrc/7S3RLYNYG8EL2";
const PAYSAFECARD_TEXT =
  process.env.PAYSAFECARD_TEXT ||
  "Effectue ton paiement Paysafecard selon les instructions de l’administrateur, puis envoie uniquement une preuve du paiement.";
const YONIBET_URL = process.env.YONIBET_URL || "https://tinyurl.com/NASSRIxYONIBET";
const VIP_PRICE_TEXT = process.env.VIP_PRICE_TEXT || "Tarif communiqué par l’administrateur";
const VIP_DAYS = Number(process.env.VIP_DAYS || 30);
const INVITE_MINUTES = Number(process.env.INVITE_MINUTES || 15);
const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const app = express();
app.use(express.json({ limit: "15mb" }));

let bot = null;
const pendingRejectReasons = new Map();

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function methodLabel(method) {
  return {
    paypal: "PayPal",
    paysafecard: "Paysafecard",
    yonibet: "Affiliation Yonibet",
  }[method] || method;
}

function kindLabel(kind) {
  return kind === "renewal" ? "Renouvellement" : "Première souscription";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

const memory = {
  users: new Map(),
  subscriptions: new Map(),
  sessions: new Map(),
  requests: new Map(),
  nextRequestId: 1,
};

const memoryUsers = new Map();
const memorySubscriptions = new Map();
const memorySessions = new Map();
const memoryRequests = new Map();
let memoryNextRequestId = 1;

function supabaseConfigured() {
  return true;
}

async function db(action, payload = {}) {
  const userKey = payload.telegram_id != null ? String(payload.telegram_id) : null;

  if (action === "health") return { ok: true, storage: "telegram-memory" };

  if (action === "ensure_user") {
    memoryUsers.set(userKey, { ...payload });
    return { ok: true };
  }

  if (action === "get_subscription") {
    return memorySubscriptions.get(userKey) || null;
  }

  if (action === "get_request") {
    return memoryRequests.get(String(payload.request_id)) || null;
  }

  if (action === "set_session") {
    memorySessions.set(userKey, { ...payload });
    return { ok: true };
  }

  if (action === "get_session") {
    return memorySessions.get(userKey) || null;
  }

  if (action === "delete_session") {
    memorySessions.delete(userKey);
    return { ok: true };
  }

  if (action === "create_request") {
    const request = {
      id: memoryNextRequestId++,
      telegram_id: Number(payload.telegram_id),
      method: payload.method,
      kind: payload.kind,
      status: "pending",
    };
    memoryRequests.set(String(request.id), request);
    return request;
  }

  if (action === "set_admin_message") {
    const request = memoryRequests.get(String(payload.request_id));
    if (request) request.admin_message_id = Number(payload.admin_message_id);
    return { ok: true };
  }

  if (action === "approve_request") {
    const request = memoryRequests.get(String(payload.request_id));
    if (!request || request.status !== "pending") return null;
    const now = Date.now();
    const expiresAt = new Date(now + Number(payload.vip_days || 30) * 86400000).toISOString();
    request.status = "approved";
    memorySubscriptions.set(String(request.telegram_id), {
      telegram_id: request.telegram_id,
      expires_at: expiresAt,
      status: "active"
    });
    return { request, expires_at: expiresAt };
  }

  if (action === "reject_request") {
    const request = memoryRequests.get(String(payload.request_id));
    if (!request || request.status !== "pending") return null;
    request.status = "rejected";
    return request;
  }

  if (action === "list_expired" || action === "list_reminders") return [];
  if (action === "mark_expired" || action === "mark_reminder") return { ok: true };

  throw new Error("Unknown in-memory action: " + action);
}
async function ensureUser(ctx) {
  const from = ctx.from;
  if (!from || !supabaseConfigured()) return;

  await db("ensure_user", {
    telegram_id: from.id,
    username: from.username || "",
    first_name: from.first_name || "",
  });
}

async function getSubscription(telegramId) {
  if (!supabaseConfigured()) return null;
  return db("get_subscription", { telegram_id: telegramId });
}

function isActiveSubscription(subscription) {
  return (
    subscription &&
    subscription.status === "active" &&
    new Date(subscription.expires_at).getTime() > Date.now()
  );
}

async function showHome(ctx) {
  await ensureUser(ctx);

  if (!supabaseConfigured()) {
    return ctx.reply(
      "⚙️ Le bot est installé mais Supabase n’est pas encore configuré."
    );
  }

  const subscription = await getSubscription(ctx.from.id);
  const active = isActiveSubscription(subscription);
  const everSubscribed = Boolean(subscription);

  if (active) {
    return ctx.reply(
      `👑 <b>VIP actif</b>\n\nTon accès est valable jusqu’au <b>${escapeHtml(
        formatDate(subscription.expires_at)
      )}</b>.\n\nQue veux-tu faire ?`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔐 Accéder au canal VIP", "access_vip")],
          [Markup.button.callback("♻️ Renouveler mon VIP", "renew")],
          [Markup.button.callback("📅 Mon abonnement", "status")],
        ]),
      }
    );
  }

  const button = everSubscribed
    ? Markup.button.callback("♻️ Renouveler mon VIP", "renew")
    : Markup.button.callback("👑 Prendre le VIP", "subscribe");

  return ctx.reply(
    `👑 <b>VIP Pronostics</b>\n\nAccès VIP : <b>${escapeHtml(
      VIP_PRICE_TEXT
    )}</b>\nDurée : <b>${VIP_DAYS} jours</b>.\n\nChoisis ci-dessous pour commencer.`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [button],
        [Markup.button.callback("❓ Comment ça marche ?", "help")],
      ]),
    }
  );
}

async function showMethods(ctx, kind) {
  await ensureUser(ctx);
  const subscription = await getSubscription(ctx.from.id);
  const everSubscribed = Boolean(subscription);

  const buttons = [
    [Markup.button.callback("💙 PayPal", `method:${kind}:paypal`)],
    [Markup.button.callback("🎫 Paysafecard", `method:${kind}:paysafecard`)],
  ];

  if (kind === "initial" && !everSubscribed) {
    buttons.push([
      Markup.button.callback(
        "🎁 Affiliation Yonibet",
        `method:${kind}:yonibet`
      ),
    ]);
  }

  buttons.push([Markup.button.callback("⬅️ Retour", "home")]);

  return ctx.reply(
    kind === "renewal"
      ? "♻️ <b>Renouvellement VIP</b>\n\nPour renouveler, choisis PayPal ou Paysafecard."
      : "👑 <b>Première souscription</b>\n\nChoisis ton moyen d’accès au VIP.",
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons),
    }
  );
}

async function showMethodInstructions(ctx, kind, method) {
  const label = methodLabel(method);
  let text = `💳 <b>${escapeHtml(label)}</b>\n\n`;
  const buttons = [];

  if (method === "paypal") {
    text += PAYPAL_URL
      ? "Effectue le paiement avec le bouton ci-dessous puis reviens ici pour envoyer ta preuve."
      : "Le lien PayPal sera ajouté prochainement par l’administrateur.";
    if (PAYPAL_URL) {
      buttons.push([Markup.button.url("💙 Ouvrir PayPal", PAYPAL_URL)]);
    }
  }

  if (method === "paysafecard") {
    text += escapeHtml(PAYSAFECARD_TEXT);
  }

  if (method === "yonibet") {
    if (kind !== "initial") {
      return ctx.answerCbQuery("Yonibet est réservé à la première souscription.");
    }
    text += YONIBET_URL
      ? "Inscris-toi via le lien partenaire, remplis les conditions demandées puis reviens envoyer ta preuve."
      : "Le lien d’affiliation Yonibet sera ajouté prochainement par l’administrateur.";
    if (YONIBET_URL) {
      buttons.push([Markup.button.url("🎁 Ouvrir Yonibet", YONIBET_URL)]);
    }
  }

  text +=
    "\n\n⚠️ <b>Important :</b> n’envoie jamais de pièce d’identité ni le code/PIN complet d’une Paysafecard dans le bot.";

  buttons.push([
    Markup.button.callback(
      "📎 Envoyer ma preuve",
      `proof:${kind}:${method}`
    ),
  ]);
  buttons.push([
    Markup.button.callback(
      "⬅️ Retour",
      kind === "renewal" ? "renew" : "subscribe"
    ),
  ]);

  return ctx.reply(text, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
}

async function createVipInvite(telegramId) {
  if (!bot || !VIP_CHAT_ID) {
    throw new Error("VIP_CHAT_ID ou bot non configuré");
  }

  try {
    await bot.telegram.unbanChatMember(VIP_CHAT_ID, telegramId, {
      only_if_banned: true,
    });
  } catch (error) {
    console.warn("unban before invite:", error.message);
  }

  const invite = await bot.telegram.createChatInviteLink(VIP_CHAT_ID, {
    expire_date: Math.floor(Date.now() / 1000) + INVITE_MINUTES * 60,
    member_limit: 1,
    name: `VIP-${telegramId}-${Date.now()}`,
  });

  return invite.invite_link;
}

async function approveRequest(requestId, reviewerId) {
  const result = await db("approve_request", {
    request_id: requestId,
    reviewer_id: reviewerId,
    vip_days: VIP_DAYS,
  });

  if (!result) return null;

  return {
    request: result.request,
    expiresAt: result.expires_at,
  };
}

async function rejectRequest(requestId, reviewerId) {
  return db("reject_request", {
    request_id: requestId,
    reviewer_id: reviewerId,
  });
}

function adminAllowed(ctx) {
  const callbackChatId = ctx.callbackQuery?.message?.chat?.id;

  if (
    ADMIN_CHAT_ID &&
    callbackChatId &&
    String(callbackChatId) !== String(ADMIN_CHAT_ID)
  ) {
    return false;
  }

  if (ADMIN_USER_IDS.size && !ADMIN_USER_IDS.has(String(ctx.from?.id))) {
    return false;
  }

  return true;
}

async function handleProofMessage(ctx) {
  if (!supabaseConfigured() || !ADMIN_CHAT_ID || !ctx.from || !ctx.message) {
    return false;
  }

  const session = await db("get_session", {
    telegram_id: ctx.from.id,
  });

  if (!session || session.state !== "awaiting_proof") return false;

  const allowed =
    Boolean(ctx.message.photo) ||
    Boolean(ctx.message.document) ||
    Boolean(ctx.message.text);

  if (!allowed) {
    await ctx.reply(
      "Envoie une capture, une photo, un PDF ou un message texte comme preuve."
    );
    return true;
  }

  const request = await db("create_request", {
    telegram_id: ctx.from.id,
    method: session.method,
    kind: session.kind,
  });

  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : "sans @username";

  const header =
    `🧾 <b>Nouvelle demande VIP #${request.id}</b>\n\n` +
    `👤 ${escapeHtml(ctx.from.first_name || "Utilisateur")} (${escapeHtml(
      username
    )})\n` +
    `🆔 <code>${ctx.from.id}</code>\n` +
    `💳 ${escapeHtml(methodLabel(session.method))}\n` +
    `📌 ${escapeHtml(kindLabel(session.kind))}\n\n` +
    "Vérifie la preuve ci-dessous puis valide ou refuse.";

  const adminMessage = await bot.telegram.sendMessage(ADMIN_CHAT_ID, header, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ VALIDER", callback_data: `approve:${request.id}` },
          { text: "❌ REFUSER", callback_data: `reject:${request.id}` },
        ],
      ],
    },
  });

  try {
    await bot.telegram.copyMessage(
      ADMIN_CHAT_ID,
      ctx.chat.id,
      ctx.message.message_id
    );
  } catch (error) {
    console.error("copy proof:", error.message);
    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `⚠️ Impossible de recopier automatiquement la preuve pour la demande #${request.id}.`
    );
  }

  await db("set_admin_message", {
    request_id: request.id,
    admin_message_id: adminMessage.message_id,
  });

  await db("delete_session", {
    telegram_id: ctx.from.id,
  });

  await ctx.reply(
    "✅ Ta preuve a bien été envoyée aux administrateurs. Tu recevras ici le résultat de la validation."
  );

  return true;
}

async function sweepExpirations() {
  if (!supabaseConfigured() || !bot || !VIP_CHAT_ID) return;

  const rows = (await db("list_expired")) || [];

  for (const row of rows) {
    try {
      await bot.telegram.banChatMember(VIP_CHAT_ID, row.telegram_id, {
        revoke_messages: false,
      });

      await bot.telegram.unbanChatMember(VIP_CHAT_ID, row.telegram_id, {
        only_if_banned: true,
      });
    } catch (error) {
      console.error(
        "remove expired member:",
        row.telegram_id,
        error.message
      );
      continue;
    }

    await db("mark_expired", {
      telegram_id: row.telegram_id,
    });

    try {
      await bot.telegram.sendMessage(
        row.telegram_id,
        "⏳ Ton accès VIP de 30 jours est terminé. Tu peux le renouveler avec PayPal ou Paysafecard.",
        Markup.inlineKeyboard([
          [Markup.button.callback("♻️ Renouveler mon VIP", "renew")],
        ])
      );
    } catch (error) {
      console.warn("expiry notification:", row.telegram_id, error.message);
    }
  }
}

async function sendRenewalReminders() {
  if (!supabaseConfigured() || !bot) return;

  const rows = (await db("list_reminders")) || [];

  for (const row of rows) {
    try {
      await bot.telegram.sendMessage(
        row.telegram_id,
        `⏰ Ton VIP expire le ${formatDate(
          row.expires_at
        )}. Tu peux le renouveler dès maintenant sans perdre les jours restants.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("♻️ Renouveler mon VIP", "renew")],
        ])
      );

      await db("mark_reminder", {
        telegram_id: row.telegram_id,
      });
    } catch (error) {
      console.warn("renewal reminder:", row.telegram_id, error.message);
    }
  }
}

function registerBotHandlers(instance) {
  instance.start(showHome);
  instance.command("menu", showHome);

  instance.command("cancel", async (ctx) => {
    await ensureUser(ctx);

    if (supabaseConfigured()) {
      await db("delete_session", {
        telegram_id: ctx.from.id,
      });
    }

    await ctx.reply("Action annulée.");
    await showHome(ctx);
  });

  instance.action("home", async (ctx) => {
    await ctx.answerCbQuery();
    await showHome(ctx);
  });

  instance.action("subscribe", async (ctx) => {
    await ctx.answerCbQuery();
    const subscription = await getSubscription(ctx.from.id);
    if (subscription) return showMethods(ctx, "renewal");
    return showMethods(ctx, "initial");
  });

  instance.action("renew", async (ctx) => {
    await ctx.answerCbQuery();
    await showMethods(ctx, "renewal");
  });

  instance.action("help", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "ℹ️ Choisis ton moyen d’accès, envoie ta preuve, puis un administrateur la vérifie. Après validation, le bot te remet un lien privé à usage unique. L’accès dure 30 jours. Les renouvellements se font uniquement par PayPal ou Paysafecard."
    );
  });

  instance.action("status", async (ctx) => {
    await ctx.answerCbQuery();
    const subscription = await getSubscription(ctx.from.id);

    if (!isActiveSubscription(subscription)) {
      return ctx.reply(
        "Ton VIP n’est pas actif.",
        Markup.inlineKeyboard([
          [Markup.button.callback("♻️ Renouveler", "renew")],
        ])
      );
    }

    return ctx.reply(
      `👑 VIP actif jusqu’au <b>${escapeHtml(
        formatDate(subscription.expires_at)
      )}</b>.`,
      { parse_mode: "HTML" }
    );
  });

  instance.action("access_vip", async (ctx) => {
    await ctx.answerCbQuery("Création de ton lien…");
    const subscription = await getSubscription(ctx.from.id);

    if (!isActiveSubscription(subscription)) {
      return ctx.reply(
        "Ton abonnement n’est plus actif.",
        Markup.inlineKeyboard([
          [Markup.button.callback("♻️ Renouveler", "renew")],
        ])
      );
    }

    try {
      const link = await createVipInvite(ctx.from.id);

      return ctx.reply(
        `🔐 Voici ton lien personnel. Il est utilisable une seule fois et expire dans ${INVITE_MINUTES} minutes.`,
        Markup.inlineKeyboard([
          [Markup.button.url("👑 REJOINDRE LE VIP", link)],
        ])
      );
    } catch (error) {
      console.error("create invite:", error);

      return ctx.reply(
        "⚠️ Impossible de générer le lien VIP pour le moment. Vérifie les droits administrateur du bot sur le canal VIP."
      );
    }
  });

  instance.action(
    /^method:(initial|renewal):(paypal|paysafecard|yonibet)$/,
    async (ctx) => {
      await ctx.answerCbQuery();
      const [, kind, method] = ctx.match;
      await showMethodInstructions(ctx, kind, method);
    }
  );

  instance.action(
    /^proof:(initial|renewal):(paypal|paysafecard|yonibet)$/,
    async (ctx) => {
      await ctx.answerCbQuery();
      await ensureUser(ctx);

      const [, kind, method] = ctx.match;

      if (kind === "renewal" && method === "yonibet") {
        return ctx.reply(
          "Yonibet n’est pas disponible pour les renouvellements."
        );
      }

      const subscription = await getSubscription(ctx.from.id);

      if (kind === "initial" && method === "yonibet" && subscription) {
        return ctx.reply(
          "L’affiliation Yonibet est réservée à la première souscription. Pour renouveler, utilise PayPal ou Paysafecard."
        );
      }

      await db("set_session", {
        telegram_id: ctx.from.id,
        state: "awaiting_proof",
        method,
        kind,
      });

      await ctx.reply(
        "📎 Envoie maintenant ta preuve dans ce chat.\n\nFormats acceptés : capture/photo, PDF ou texte.\n\n⚠️ Ne transmets jamais de pièce d’identité ni le PIN/code complet d’une Paysafecard.\n\nTape /cancel pour annuler."
      );
    }
  );

  instance.action(/^approve:(\d+)$/, async (ctx) => {
    if (!adminAllowed(ctx)) {
      return ctx.answerCbQuery("Action non autorisée.", {
        show_alert: true,
      });
    }

    await ctx.answerCbQuery("Validation en cours…");

    const requestId = ctx.match[1];
    const approved = await approveRequest(requestId, ctx.from.id);

    if (!approved) {
      return ctx
        .answerCbQuery("Cette demande a déjà été traitée.", {
          show_alert: true,
        })
        .catch(() => {});
    }

    let link = null;

    try {
      link = await createVipInvite(approved.request.telegram_id);
    } catch (error) {
      console.error("invite after approval:", error.message);
    }

    const userMessage =
      `✅ <b>VIP validé !</b>\n\nTon accès est actif jusqu’au <b>${escapeHtml(
        formatDate(approved.expiresAt)
      )}</b>.`;

    try {
      if (link) {
        await bot.telegram.sendMessage(
          approved.request.telegram_id,
          userMessage +
            `\n\nTon lien est personnel, utilisable une seule fois et valable ${INVITE_MINUTES} minutes.`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [Markup.button.url("👑 REJOINDRE LE VIP", link)],
              [Markup.button.callback("📅 Mon abonnement", "status")],
            ]),
          }
        );
      } else {
        await bot.telegram.sendMessage(
          approved.request.telegram_id,
          userMessage +
            "\n\nTon abonnement est bien activé, mais le lien du canal n’a pas pu être généré. Contacte un administrateur.",
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      console.error("notify approved user:", error.message);
    }

    await ctx
      .editMessageText(
        `✅ Demande #${requestId} validée par ${escapeHtml(
          ctx.from.first_name || "un admin"
        )}.\nExpiration : ${escapeHtml(
          formatDate(approved.expiresAt)
        )}`,
        { parse_mode: "HTML" }
      )
      .catch(() => {});
  });

  instance.action(/^reject:(\d+)$/, async (ctx) => {
    if (!adminAllowed(ctx)) {
      return ctx.answerCbQuery("Action non autorisée.", {
        show_alert: true,
      });
    }

    const requestId = ctx.match[1];
    const request = await db("get_request", { request_id: requestId });

    if (!request || request.status !== "pending") {
      return ctx.answerCbQuery("Cette demande a déjà été traitée.", {
        show_alert: true,
      });
    }

    const chatId = String(ctx.callbackQuery.message.chat.id);

    pendingRejectReasons.set(chatId, {
      requestId,
      reviewerId: ctx.from.id,
      reviewerName: ctx.from.first_name || "un admin",
    });

    await ctx.answerCbQuery("Écris maintenant la raison du refus.");

    await bot.telegram.sendMessage(
      ctx.callbackQuery.message.chat.id,
      `✍️ <b>Motif du refus — demande #${requestId}</b>\n\nÉcris maintenant la raison du refus dans ce canal.\n\n👉 <b>Ton prochain message texte sera envoyé au joueur comme explication.</b>`,
      { parse_mode: "HTML" }
    );
  });

  async function handleRejectReason(ctx, message) {
    const chatId = String(ctx.chat?.id || message?.chat?.id || "");
    const pending = pendingRejectReasons.get(chatId);

    if (!pending || !message?.text) return false;

    const reason = message.text.trim();
    if (!reason) return false;

    const rejected = await rejectRequest(
      pending.requestId,
      pending.reviewerId
    );

    pendingRejectReasons.delete(chatId);

    if (!rejected) {
      await bot.telegram.sendMessage(
        chatId,
        "⚠️ Cette demande a déjà été traitée."
      );
      return true;
    }

    try {
      await bot.telegram.sendMessage(
        rejected.telegram_id,
        `❌ <b>Ta demande VIP n’a pas été validée.</b>\n\n📝 <b>Motif :</b> ${escapeHtml(
          reason
        )}\n\nTu peux corriger le problème puis recommencer l’envoi.`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "🔁 Recommencer",
                rejected.kind === "renewal" ? "renew" : "subscribe"
              ),
            ],
          ]),
        }
      );
    } catch (error) {
      console.error("notify rejected user:", error.message);
    }

    if (rejected.admin_message_id) {
      await bot.telegram
        .editMessageText(
          ADMIN_CHAT_ID,
          rejected.admin_message_id,
          undefined,
          `❌ <b>Demande #${pending.requestId} refusée</b> par ${escapeHtml(
            pending.reviewerName
          )}.\n\n📝 <b>Motif :</b> ${escapeHtml(reason)}`,
          { parse_mode: "HTML" }
        )
        .catch(() => {});
    }

    await bot.telegram.sendMessage(
      chatId,
      `✅ Refus envoyé au joueur avec l’explication :\n“${escapeHtml(
        reason
      )}”`,
      { parse_mode: "HTML" }
    );

    return true;
  }

  instance.on("message", async (ctx, next) => {
    if (
      ADMIN_CHAT_ID &&
      String(ctx.chat?.id) === String(ADMIN_CHAT_ID) &&
      (await handleRejectReason(ctx, ctx.message))
    ) {
      return;
    }

    await ensureUser(ctx);
    const handled = await handleProofMessage(ctx);

    if (!handled && typeof next === "function") {
      return next();
    }
  });

  instance.on("channel_post", async (ctx) => {
    if (
      ADMIN_CHAT_ID &&
      String(ctx.chat?.id) === String(ADMIN_CHAT_ID)
    ) {
      await handleRejectReason(ctx, ctx.channelPost);
    }
  });

  instance.catch((error, ctx) => {
    console.error("Telegram bot error:", error);

    if (ctx?.chat?.id) {
      ctx
        .reply("⚠️ Une erreur est survenue. Réessaie dans quelques instants.")
        .catch(() => {});
    }
  });
}

app.get("/", (_req, res) => {
  res.status(200).send("VIP Telegram Bot — service en ligne");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    botConfigured: Boolean(BOT_TOKEN),
    adminChatConfigured: Boolean(ADMIN_CHAT_ID),
    vipChatConfigured: Boolean(VIP_CHAT_ID),
    publicUrlConfigured: Boolean(PUBLIC_URL),
    storage: "telegram-only",
  });
});

async function start() {
  console.log("Storage mode: Telegram only — no Supabase.");

  if (BOT_TOKEN) {
    bot = new Telegraf(BOT_TOKEN);
    registerBotHandlers(bot);
    app.use(bot.webhookCallback(WEBHOOK_PATH));
  }

  app.listen(PORT, async () => {
    console.log(`HTTP server listening on port ${PORT}`);

    if (!bot) {
      console.log("BOT_TOKEN missing — waiting for configuration.");
      return;
    }

    try {
      if (PUBLIC_URL) {
        await bot.telegram.setWebhook(`${PUBLIC_URL}${WEBHOOK_PATH}`, {
          drop_pending_updates: false,
        });
        console.log("Telegram webhook configured.");
      } else {
        await bot.launch();
        console.log("Telegram bot started in polling mode.");
      }

      await sweepExpirations();
      await sendRenewalReminders();

      setInterval(async () => {
        try {
          await sweepExpirations();
          await sendRenewalReminders();
        } catch (error) {
          console.error("scheduled sweep:", error);
        }
      }, 60 * 1000);
    } catch (error) {
      console.error("Telegram startup error:", error);
    }
  });
}

start().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});

process.once("SIGINT", () => bot?.stop("SIGINT"));
process.once("SIGTERM", () => bot?.stop("SIGTERM"));
