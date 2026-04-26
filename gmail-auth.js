const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
console.log('Ouvre ce lien dans ton navigateur:', authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Colle le code ici: ', async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync('token.json', JSON.stringify(tokens));
  console.log('Token sauvegardé ! Gmail est connecté.');
  rl.close();
});