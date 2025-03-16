import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';

function App() {

  const [isLogined, setLogined] = useState(false);

  useEffect(() => {
    // TODO: Check if user is logged in
    // setLogined(true); // Uncomment this line when user is logged in
  }, []);

  return (
    <div className='App'>
      <AppBar position="static" className="mb-4 bg-black">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Посты на стене
          </Typography>
          <Button color="inherit" startIcon={<LoginIcon />}>
            Войти в аккаунт
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1 }} className="container">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Button variant="contained" color="success" startIcon={<AddIcon />}>
                Создать
              </Button>
              <Button variant="contained" color="error" startIcon={<DeleteIcon />}>
                Удалить
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Содержимое
              </Typography>
              <Typography variant="body1">
                Здесь будет отображаться содержимое выбранного элемента.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default App;