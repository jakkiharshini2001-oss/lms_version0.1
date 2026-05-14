const fs = require("fs");
const { google } = require("googleapis");

const credentials = JSON.parse(
  fs.readFileSync("./youtube_client.json", "utf8")
);

const { client_id, client_secret, redirect_uris } =
  credentials.installed;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const AUTH_CODE =
  "4/0AeoWuM8BY_187OlaKKqUNKtmM9gURQgvtYnYG_MJmtEVzfwtrfqukMyZjDFNgyMAsy435w";

async function getToken() {
  const { tokens } = await oauth2Client.getToken(AUTH_CODE);
  console.log(tokens);
}

getToken();