# Nassri VIP — Premium single-card UI

La couche `src/premium-ui.js` transforme les réponses privées du bot en une carte Telegram unique qui évolue avec `editMessageMedia`.

Écrans : accueil, PayPal, Paysafecard, Yonibet, preuves, attente, validation, refus et aide.

Les 9 visuels sont embarqués dans `src/assets/*.b64`, importés au démarrage dans le cache média Telegram puis réutilisés via leurs `file_id`.

Le motif de refus reste dynamique dans la légende du message ; l’image de refus reste générique.

Les preuves envoyées par le joueur sont copiées vers le canal admin puis supprimées du chat privé lorsque Telegram l’autorise, afin de conserver une interface propre.

Vérifications :

```bash
node --check src/index.js
node --check src/premium-ui.js
node scripts/check-premium-ui.js
node scripts/check-premium-ui-flow.js
```
