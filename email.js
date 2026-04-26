require('dotenv').config();
const { google } = require('googleapis');
const { handleCustomerMessage } = require('./agent');

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const token = JSON.parse(process.env.GOOGLE_TOKEN);
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function getUnreadEmails() {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 5
  });
  return res.data.messages || [];
}

async function getEmailContent(messageId) {
  const res = await gmail.users.messages.get({ userId: 'me', id: messageId });
  const headers = res.data.payload.headers;
  const from = headers.find(h => h.name === 'From').value;
  const subject = headers.find(h => h.name === 'Subject')?.value || 'Sans objet';
  const body = res.data.snippet;
  return { from, subject, body, id: messageId };
}

async function sendReply(to, subject, body) {
  const message = `To: ${to}\r\nSubject: Re: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`;
  const encoded = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
}

async function markAsRead(messageId) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] }
  });
}

async function processEmails() {
  console.log('Vérification des emails...');
  const messages = await getUnreadEmails();
  
  if (messages.length === 0) {
    console.log('Aucun email non lu.');
    return;
  }

  for (const msg of messages) {
    const email = await getEmailContent(msg.id);
    console.log(`Email de: ${email.from}`);
    
    const result = await handleCustomerMessage(email.from, email.body);
    
    if (result.autoSend) {
      await sendReply(email.from, email.subject, result.reply);
      await markAsRead(email.id);
      console.log(`Réponse envoyée à: ${email.from}`);
    } else {
      console.log(`Escalade humaine pour: ${email.from}`);
      await markAsRead(email.id);
    }
  }
}

processEmails();
setInterval(processEmails, 5 * 60 * 1000);
console.log('Agent SAV démarré - vérification toutes les 5 minutes');