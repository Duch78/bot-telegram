const { Telegram } = require("telegraf");

const HD_ASSETS = {
  home: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/f9b8ca50-ffd1-4d7f-91d6-d51fea0bcb06.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZTY1M2Y4MGM5ZjIzMTZmYiIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTM1Mzg2OH0.bDHn7t23pwwgdDRmLQxlZ5qmGPRkjsAlwPtsmxj-dWs",
  paypal: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/4d25e849-911f-4888-b201-80c1ab04b300.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZTVjNzMwYTU3ZGM5ZDkxZSIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTM3MjU4MX0.9rTzGhPb378loJYmveSel62fe2vktJ1dHTFdKwHOcGA",
  paysafecard: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/f8377256-e836-489a-a16d-07c594ee7ce7.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjVkMzc2OGMwNWIyMGViYyIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzODYzNn0.1zXkUVjjjU1a-OrlCDyILXxwBOQCCm1HlskwFArUKfM",
  yonibet: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/69487db4-9a5c-424a-9b27-198139f107c3.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNzIyMTU0NzZmMjVlYjM4OCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMyMTMzNH0.PC40VE6GQ3V-g4FdBg93IsJnaXjyQrdbOl9QlKct1QM",
  proof: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/c1991210-cc02-449f-85be-7d1cdb423b07.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiM2Y0MTZjOTVjYzM0YjJlNCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzMjI0NX0.qu1KHESmBVwhgscmv-o9d-FqeS8AdXyPxSfmejiwLp4",
  pending: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/6f8de579-6ca7-4a19-8939-68cc25128808.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZjFlZjIyNThhMWE3ZWMwNCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMyNjU1Mn0.PyOwqyzLDMCMNXx_cNMlChGWjWTiTL61SCERv62z18s",
  approved: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/d360053b-77b0-40ee-b1ad-21c2533b0111.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNTgzNWM3YzJhZDEwZDczMiIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMwNTE1NH0.wy3qgOkbbuBrgK33HAb_hl-4qbHre02E5d5q0izACm0",
  rejected: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/cc3df187-7f2f-4f7f-acaa-500dce8db417.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZTI0YmI4OTMwNjdmZjFkZCIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTM1NTY2N30.j3c2uItHWuC21YguFKz6E0ZjQAn5Pfo_bK4bo9IAz60",
  help: "https://d2jqrm6oza8nb6.cloudfront.net/datasets/6d274b85-52f7-4592-abdf-8ebc210db5cf.png?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNzE5OWMwMzZkOGYwZTM4YSIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MTMzNTIyMn0.d_ogRewcG87vYHIGjBAta1uy2glqgeHzrhAqw3k4jwA",
};

function hdAssetInfo(media) {
  if (!media || typeof media === "string") return null;
  const filename = String(media.filename || "");
  const match = filename.match(/^([a-z]+)\.jpg$/i);
  const name = match?.[1];
  const url = name ? HD_ASSETS[name] : null;
  return url ? { name, url } : null;
}

if (Telegram?.prototype?.sendPhoto) {
  const originalSendPhoto = Telegram.prototype.sendPhoto;
  Telegram.prototype.sendPhoto = async function hdSendPhoto(chatId, photo, extra) {
    const hd = hdAssetInfo(photo);
    const message = await originalSendPhoto.call(this, chatId, hd?.url || photo, extra);

    if (hd) {
      const telegramPhoto = Array.isArray(message?.photo) ? message.photo.at(-1) : null;
      if (telegramPhoto?.file_id) {
        console.log(`HD_ASSET_FILE_ID ${hd.name}=${telegramPhoto.file_id}`);
      }
    }

    return message;
  };
}

if (Telegram?.prototype?.editMessageMedia) {
  const originalEditMessageMedia = Telegram.prototype.editMessageMedia;
  Telegram.prototype.editMessageMedia = function hdEditMessageMedia(
    chatId,
    messageId,
    inlineMessageId,
    media,
    extra
  ) {
    const hd = hdAssetInfo(media?.media);
    const nextMedia = hd ? { ...media, media: hd.url } : media;
    return originalEditMessageMedia.call(
      this,
      chatId,
      messageId,
      inlineMessageId,
      nextMedia,
      extra
    );
  };
}

module.exports = { HD_ASSETS };
