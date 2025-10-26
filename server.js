const express = require('express');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Хранилище игр в памяти (в продакшене нужно использовать базу данных)
let games = {};

// API для сохранения игры
app.post('/api/game/save', (req, res) => {
  try {
    const { gameId, gameData } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ success: false, error: 'Game ID is required' });
    }
    
    games[gameId] = {
      ...gameData,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Game saved: ${gameId}`);
    res.json({ success: true, gameId });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ success: false, error: 'Failed to save game' });
  }
});

// API для загрузки игры
app.post('/api/game/load', (req, res) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ success: false, error: 'Game ID is required' });
    }
    
    const gameData = games[gameId];
    
    if (gameData) {
      console.log(`Game loaded: ${gameId}`);
      res.json({ success: true, gameData });
    } else {
      res.status(404).json({ success: false, error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error loading game:', error);
    res.status(500).json({ success: false, error: 'Failed to load game' });
  }
});

// API для создания новой игры
app.post('/api/game/new', (req, res) => {
  try {
    const gameId = uuidv4();
    games[gameId] = {
      players: [],
      playerCount: 0,
      currentRound: 0,
      rounds: [],
      scores: [],
      history: [],
      consecutivePasses: [],
      createdAt: new Date().toISOString()
    };
    
    console.log(`New game created: ${gameId}`);
    res.json({ success: true, gameId });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ success: false, error: 'Failed to create new game' });
  }
});

// API для получения списка всех игр (для отладки)
app.get('/api/games', (req, res) => {
  res.json({
    success: true,
    games: Object.keys(games).map(id => ({
      id,
      players: games[id].players,
      lastUpdated: games[id].lastUpdated,
      createdAt: games[id].createdAt
    }))
  });
});

// API для удаления игры
app.delete('/api/game/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (games[gameId]) {
      delete games[gameId];
      console.log(`Game deleted: ${gameId}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ success: false, error: 'Failed to delete game' });
  }
});

// Обслуживание главной страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play the game`);
});

// Очистка старых игр каждые 24 часа (опционально)
setInterval(() => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  let cleanedCount = 0;
  Object.keys(games).forEach(gameId => {
    const lastUpdated = new Date(games[gameId].lastUpdated || games[gameId].createdAt);
    if (lastUpdated < twentyFourHoursAgo) {
      delete games[gameId];
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} old games`);
  }
}, 24 * 60 * 60 * 1000);