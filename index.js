const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const fs = require('fs');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox'],
    },
    authStrategy: new LocalAuth()
});
dotenv.config();

const ADMIN_NUMBER = process.env.NOMOR_KAMU;
const SELINGKUHAN_NUMBER = process.env.NOMOR_SELINGKUHAN;

function encryptMessage(message) {
    const originalText = message;
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890$@!';
    let encryptedText = '';
  
    for (let i = 0; i < message.length; i++) {
      const char = message[i].toLowerCase();
      const index = alphabet.indexOf(char);
  
      if (index !== -1) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        const encryptedChar = alphabet[randomIndex];
        encryptedText += encryptedChar;
      } else {
        encryptedText += char;
      }
    }
  
    const encryptedData = {
      originalText: originalText,
      encryptedText: encryptedText
    };
  
    fs.writeFileSync('encrypted.json', JSON.stringify(encryptedData));
  
    return encryptedData; 
  }
  

  function decryptMessage(message) {
    const encryptedData = fs.readFileSync('encrypted.json');
    const { originalText, encryptedText } = JSON.parse(encryptedData);
  
    if (message === encryptedText) {
      return originalText; 
    } else {
      return 'Gagal dekripsi';
    }
  }

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

const allowedSenders = {
    [`${ADMIN_NUMBER}@c.us`]: 'admin',
    [`${SELINGKUHAN_NUMBER}@c.us`]: 'selingkuhan'
  };
  
  client.on('message', async (message) => {
    const commandPrefix = '!selingkuh';
    const decryptCommand = '!decrypt';
  
    if (message.body.startsWith(commandPrefix)) {
        const messageText = message.body.slice(commandPrefix.length);
        const senderNumber = message.from;
      
        if (senderNumber in allowedSenders) {
          let recipientNumber;
            const kamu = `${ADMIN_NUMBER}@c.us`;
            const dia = `${SELINGKUHAN_NUMBER}@c.us`;
          if (senderNumber === kamu) {
            recipientNumber = dia;
          } else if (senderNumber === dia) {
            recipientNumber = kamu;
          } else {
            await message.reply('Anda tidak diizinkan untuk mengirim pesan');
            return;
          }
      
          const encryptedMessage = encryptMessage(messageText);
      
          await client.sendMessage(`${recipientNumber}`, encryptedMessage.encryptedText);
          await message.reply('BERES NDAN ');
        } else {
          await message.reply('ini siapa?');
        }
      } else if (message.body.startsWith(decryptCommand)) {
        const messageText = message.body.slice(decryptCommand.length);
        const decryptedMessage = decryptMessage(messageText);
        await client.sendMessage(message.from, decryptedMessage);
      }
      
});
client.initialize();
