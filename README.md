# VIP Telegram Bot

Bot Telegram pour gérer un VIP de pronostics avec validation manuelle par des administrateurs.

## Fonctionnalités

- Première souscription : PayPal, Paysafecard, affiliation Yonibet ou accès via Celsius (si configuré).
- Renouvellement : PayPal ou Paysafecard uniquement.
- Envoi de preuve par le joueur.
- Copie de la preuve dans un canal/groupe privé administrateur.
- Boutons **VALIDER** et **REFUSER** pour les admins.
- Création d’un lien VIP personnel à usage unique après validation.
- Expiration automatique du VIP après 30 jours.
- Retrait automatique du membre du canal VIP à expiration.
- Renouvellement qui ajoute 30 jours à la date existante si le VIP est encore actif.
- Rappel automatique 3 jours avant l’expiration.
- Base PostgreSQL persistante.

## Variables d'environnement

- `BOT_TOKEN` : token du bot créé avec BotFather.
- `DATABASE_URL` : URL PostgreSQL.
- `ADMIN_CHAT_ID` : ID du canal/groupe privé de validation.
- `VIP_CHAT_ID` : ID du canal VIP privé.
- `PUBLIC_URL` : URL publique Render, sans slash final.
- `PAYPAL_URL` : lien PayPal.
- `PAYSAFECARD_TEXT` : instructions Paysafecard.
- `YONIBET_URL` : lien affilié Yonibet.
- `CELSIUS_URL` : lien partenaire Celsius en HTTPS (par défaut : https://lrct.gg/nassri). Un lien invalide masque les boutons Celsius. Offre annoncée : 50 % de freebet sur le premier dépôt, selon conditions Celsius. Aucun montant minimum n’est supposé dans le bot.
- `VIP_PRICE_TEXT` : texte du tarif.
- `ADMIN_USER_IDS` : IDs Telegram des admins autorisés, séparés par des virgules (optionnel).
- `VIP_DAYS` : durée du VIP, 30 par défaut.
- `INVITE_MINUTES` : durée de validité du lien d’invitation, 15 minutes par défaut.

## Droits Telegram nécessaires

Le bot doit être administrateur du canal VIP avec le droit de créer des liens d’invitation et de bannir/retirer des membres.  
Il doit également pouvoir publier dans le canal/groupe de validation admin.

## Sécurité

Ne jamais demander à un joueur d’envoyer une pièce d’identité ou le PIN/code complet d’une Paysafecard dans Telegram.
