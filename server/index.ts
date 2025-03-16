import express, { Request, Response } from 'express';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 5000;

const clientId = process.env.VK_CLIENT_ID;
const clientSecret = process.env.VK_CLIENT_SECRET;
const redirectUri = process.env.VK_REDIRECT_URI || 'https://localhost:3000';
const encryptionKey = process.env.ENCRYPTION_KEY || '';

app.get('/vkid/login', (req: Request, res: Response) => {
  const scope = 'profile,email';
  const state = 'some_random_state';

  const authUrl = `https://id.vk.com/authorize?client_id=${clientId}` +
                  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                  `&response_type=code` +
                  `&scope=${encodeURIComponent(scope)}` +
                  `&state=${state}`;

  console.log('Перенаправление пользователя на:', authUrl);
  res.redirect(authUrl);
});

app.get('/vkid/callback', (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string; // можно проверить на соответствие ожиданиям
  console.log(state);

  if (!code) {
    return res.status(400).json({ error: 'Отсутствует параметр code в запросе.' });
  }

  axios.post('https://id.vk.com/access_token', {
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri,
  })
  .then(tokenResponse => {
    const { access_token, expires_in, user_id } = tokenResponse.data;
    console.log('Получен access token от VK ID');

    const encryptedToken = CryptoJS.AES.encrypt(access_token, encryptionKey).toString();

    res.json({
      access_token: encryptedToken,
      expires_in,
      user_id
    });
  })
  .catch(error => {
    console.error('Ошибка получения access token от VK ID:', error);
    res.status(500).json({ error: 'Ошибка при обмене кода на access token' });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
