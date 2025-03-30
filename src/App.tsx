import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import ExitToApp from '@mui/icons-material/ExitToApp';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';

interface Post {
  id?: string | number;
  date?: string;
  text: string;
  attachments?: any[];
}

function LoginButton() {
  return (
    <Button color="inherit" startIcon={<LoginIcon />} href='http://localhost:5000/vkid/login'>
      Войти в аккаунт
    </Button>
  );
}

function App() {
  const [isLogined, setLogined] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setLogined(false);
    console.log('Токен удалён');
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewPostText('');
  };

  const handlePostTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostText(event.target.value);
  };

  const handleCreatePost = () => {
    console.log('Создаётся пост с текстом:', newPostText);
    fetch('http://localhost:5000/vkid/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encrypted_access_token: localStorage.getItem('access_token'),
        message: newPostText,
      }),
    })
      .then((response) => response.json())
      .then(async () => {
        console.log('Пост создан:');
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('Токен не найден');
          return;
        }
        const response = await fetch(`http://localhost:5000/vkid/posts?encrypted_access_token=${encodeURIComponent(token)}`);
        const data = await response.json();
        setPosts(data.posts);
      })
      .catch((error) => {
        console.error('Ошибка создания поста:', error);
      });
    handleCloseModal();
  };

  const handleDeletePost = (postId: string | number) => {
    console.log('Удаляется пост с id:', postId);
    fetch(`http://localhost:5000/vkid/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encrypted_access_token: localStorage.getItem('access_token'),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Пост удалён:', data);
      })
      .catch((error) => {
        console.error('Ошибка удаления поста:', error);
      });
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      setLogined(true);
      console.log('Получен токен:', accessToken);
    }

    if (localStorage.getItem('access_token')) {
      setLogined(true);
      console.log('Токен уже получен:', localStorage.getItem('access_token'));
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch(`http://localhost:5000/vkid/posts?encrypted_access_token=${encodeURIComponent(token)}`);
          if (response.status >= 400) {
            console.error('Ошибка авторизации. Токен недействителен или отсутствует.');
            return;
          }
          const data = await response.json();
          setPosts(data.posts);
          console.log('Посты получены:', data.posts);
        } catch (error) {
          console.error('Ошибка получения постов:', error);
        }
      }
    })();
  }, []);

  return (
    <div className='App'>
      <AppBar position="static" className="mb-4 bg-black">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Посты на стене
          </Typography>
          {isLogined ? (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                className='me-4'
                onClick={handleOpenModal}
              >
                Создать пост
              </Button>
              <Button color="inherit" startIcon={<ExitToApp />} onClick={handleLogout}>
                Выйти из аккаунта
              </Button>
            </>
          ) : (
            <LoginButton />
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1 }} className="container">
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            {posts.length > 0 ? (
              posts.map((post: any) => (
                <Paper key={post.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body1">
                    {post.text}
                  </Typography>
                  {post.attachments && post.attachments.length > 0 && (
                    <Typography variant="caption">
                      <img src={post.attachments[0]?.photo?.orig_photo?.url} height='500rem' width='auto' alt='Nothing'/>
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeletePost(post.id)}>
                      Удалить
                    </Button>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography variant="body2">
                Посты не найдены.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Создать новый пост</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Введите текст поста"
            type="text"
            fullWidth
            variant="outlined"
            value={newPostText}
            onChange={handlePostTextChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Отмена
          </Button>
          <Button onClick={handleCreatePost} color="primary" variant="contained">
            Опубликовать
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
