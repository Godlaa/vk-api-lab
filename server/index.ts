import express, { Request, Response } from 'express';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import cors from 'cors';
import { createHash, randomBytes } from 'crypto';

dotenv.config();
const app = express();
const port = 5000;

const pkceStore = new Map();
const clientId = process.env.VK_CLIENT_ID;
const redirectUri = process.env.VK_REDIRECT_URI || 'https://localhost:3000';
const encryptionKey = process.env.ENCRYPTION_KEY || '';

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'https://id.vk.com'],
  credentials: true
}));

function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

app.get('/vkid/login', (req: Request, res: Response) => {
  const scope = 'wall,offline';
  const state = randomBytes(16).toString('hex');
  const { verifier, challenge } = generatePKCE();
  pkceStore.set(state, verifier);

  const authUrl = `https://id.vk.com/authorize?client_id=${clientId}` +
                  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                  `&response_type=code` +
                  `&scope=${encodeURIComponent(scope)}` +
                  `&state=${state}` +
                  `&code_challenge=${challenge}` +
                  `&code_challenge_method=S256`;

  console.log('Перенаправление пользователя на:', authUrl);
  res.redirect(authUrl);
});

app.get('/vkid/callback', (req: Request, res: Response): void => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const device_id = req.query.device_id as string;

  if (!code) {
    res.status(400).json({ error: 'Отсутствует параметр code в запросе.' });
    return;
  }

  const codeVerifier = pkceStore.get(state);
  if (!codeVerifier) {
    res.status(400).json({ error: 'Недействительное состояние или истекшая сессия.' });
    return;
  }

  pkceStore.delete(state);

  const tokenRequestData = {
    grant_type: 'authorization_code',
    code: code,
    code_verifier: codeVerifier,
    client_id: clientId,
    device_id: device_id,
    redirect_uri: redirectUri,
    state: state,
  };

  axios.post('https://id.vk.com/oauth2/auth', tokenRequestData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(tokenResponse => {
    const { access_token, expires_in, user_id } = tokenResponse.data;
    console.log('Получен access token от VK ID');

    const encryptedToken = CryptoJS.AES.encrypt(access_token, encryptionKey).toString();

    const redirectUrl = `http://localhost:3000?access_token=${encodeURIComponent(encryptedToken)}&expires_in=${expires_in}&user_id=${user_id}`;

    res.redirect(redirectUrl);
  })
  .catch(error => {
    console.error('Ошибка получения access token от VK ID:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при обмене кода на access token' });
  });
});

app.get('/vkid/posts', async (req: Request, res: Response) => {
  const { encrypted_access_token } = req.query;

  if (!encrypted_access_token) {
    res.status(400).json({ error: 'Отсутствует encrypted_access_token' });
    return;
  }

  let access_token: string;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted_access_token as string, encryptionKey);
    console.log(bytes.toString(CryptoJS.enc.Utf8));
    access_token = bytes.toString(CryptoJS.enc.Utf8);
    if (!access_token) {
      throw new Error('Пустой токен');
    }
  } catch (err) {
    res.status(400).json({ error: 'Неверный зашифрованный access token' });
    return;
  }

  const params = {
    access_token,
    v: '5.131',
    count: 10
  };

  try {
    const vkResponse = await axios.get('https://api.vk.com/method/wall.get', { params });
    if (vkResponse.data.error) {
      res.status(500).json({ error: vkResponse.data.error });
      return;
    }
    res.json({ posts: vkResponse.data.response.items });
  } catch (error: any) {
    console.error('Ошибка получения постов:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при получении постов' });
  }
});

app.post('/vkid/posts', async (req: Request, res: Response) => {
  const { encrypted_access_token, message } = req.body;
  console.log('message post:', message);
  if (!encrypted_access_token || !message) {
    res.status(400).json({ error: 'Отсутствует encrypted_access_token или message' });
    return;
  }

  let access_token: string;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted_access_token as string, encryptionKey);
    access_token = bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    res.status(400).json({ error: 'Неверный зашифрованный access token' });
    return;
  }

  const params = {
    access_token,
    v: '5.131',
    message,
  };

  try {
    const vkResponse = await axios.post('https://api.vk.com/method/wall.post', null, { params });
    res.json({ result: vkResponse.data.response });
  } catch (error: any) {
    console.error('Ошибка создания поста:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при создании поста' });
  }
});

app.get('/vkid/posts/:postId', async (req: Request, res: Response) => {
  const { encrypted_access_token, postId } = req.query;
  console.log('postId:', postId);
  console.log('encrypted_access_token:', encrypted_access_token);
  if (!encrypted_access_token || !postId) {
    res.status(400).json({ error: 'Отсутствует encrypted_access_token или postId' });
    return;
  }
  let access_token: string;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted_access_token as string, encryptionKey);
    access_token = bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    res.status(400).json({ error: 'Неверный зашифрованный access token' });
    return;
  }

  const params = {
    access_token,
    v: '5.131',
    posts: [postId],
  };

  try {
    const vkResponse = await axios.get('https://api.vk.com/method/wall.getById', { params });
    if (vkResponse.data.error) {
      res.status(500).json({ error: vkResponse.data.error });
      return;
    }
    res.json({ post: vkResponse.data.response[0] });
  }
  catch (error: any) {
    console.error('Ошибка получения поста:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при получении поста' });
  }
});


app.delete('/vkid/posts/:postId', async (req: Request, res: Response) => {
  const { encrypted_access_token } = req.body;
  const postId = req.params.postId;

  if (!encrypted_access_token || !postId) {
    res.status(400).json({ error: 'Отсутствует encrypted_access_token или postId' });
    return;
  }

  let access_token: string;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted_access_token, encryptionKey);
    access_token = bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    res.status(400).json({ error: 'Неверный зашифрованный access token' });
    return;
  }

  const params = {
    access_token,
    v: '5.131',
    post_id: postId,
  };

  try {
    const vkResponse = await axios.post('https://api.vk.com/method/wall.delete', null, { params });
    res.json({ result: vkResponse.data.response });
  } catch (error: any) {
    console.error('Ошибка удаления поста:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при удалении поста' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
