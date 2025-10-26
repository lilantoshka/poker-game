// Данные игры
const gameData = {
    players: [],
    playerCount: 0,
    currentRound: 0,
    rounds: [],
    scores: [],
    history: [],
    consecutivePasses: [],
    gameId: null
};

// Последовательности раздач для разного количества игроков
const roundSequences = {
    3: [1,2,3,4,5,6,7,8,9,9,9,8,7,6,5,4,3,2,1],
    4: [1,2,3,4,5,6,7,8,9,9,9,9,8,7,6,5,4,3,2,1],
    5: [1,2,3,4,5,6,7,7,7,7,7,6,5,4,3,2,1],
    6: [1,2,3,4,5,6,6,6,6,6,6,5,4,3,2,1]
};

// Специальные игры
const specialGames = [
    { name: "Бескозырка", type: "bezkozyrka" },
    { name: "Тёмная", type: "dark" },
    { name: "Мизер", type: "misere" },
    { name: "Голда", type: "golda" }
];

// Элементы DOM
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const playerInputsContainer = document.getElementById('player-inputs-container');
const playersGameContainer = document.getElementById('players-game-container');
const gameStages = document.getElementById('game-stages');
const scoreTableBody = document.getElementById('score-table-body');
const scoreHistoryList = document.getElementById('score-history-list');
const currentRoundElement = document.getElementById('current-round');
const podium = document.getElementById('podium');
const otherPlayers = document.getElementById('other-players');
const alertMessage = document.getElementById('alert-message');

// API базовый URL
const API_BASE = window.location.origin;

// Создаем тост для уведомлений
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);

// Функции для работы с сервером
async function saveGameState() {
    if (!gameData.gameId) {
        await createNewGame();
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/game/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gameId: gameData.gameId,
                gameData: gameData
            }),
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Game saved successfully');
            // Без уведомления для пользователя
            updateGameLinkDisplay();
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Ошибка при сохранении игры:', error);
        showToast('Ошибка при сохранении игры', 'error');
        return false;
    }
}

async function loadGameState(gameId) {
    try {
        const response = await fetch(`${API_BASE}/api/game/load`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId }),
        });
        
        const result = await response.json();
        if (result.success && result.gameData) {
            Object.assign(gameData, result.gameData);
            gameData.gameId = gameId;
            
            updateGameLinkDisplay();
            
            if (gameData.players.length > 0) {
                if (gameData.currentRound < gameData.rounds.length) {
                    showScreen(gameScreen);
                    createGameStages();
                    createPlayerCards();
                    updateScoreTable();
                    updateScoreHistory();
                } else {
                    showScreen(resultScreen);
                    createPodium();
                }
                return true;
            }
        } else {
            throw new Error(result.error || 'Game not found');
        }
    } catch (error) {
        console.error('Ошибка при загрузке игры:', error);
        showToast('Ошибка при загрузке игры', 'error');
        return false;
    }
}

async function createNewGame() {
    try {
        const response = await fetch(`${API_BASE}/api/game/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const result = await response.json();
        if (result.success) {
            gameData.gameId = result.gameId;
            updateGameLinkDisplay();
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Ошибка при создании новой игры:', error);
        showToast('Ошибка при создании новой игры', 'error');
        return false;
    }
}

// Обновление отображения ссылки на игру
function updateGameLinkDisplay() {
    const savedGameInfo = document.getElementById('saved-game-info');
    const gameLinkSection = document.getElementById('game-link-section');
    const gameLinkInput = document.getElementById('game-link-input');
    
    if (gameData.gameId && gameData.players.length > 0) {
        const gameUrl = `${window.location.origin}?gameId=${gameData.gameId}`;
        
        // Показываем информацию о сохраненной игре на стартовом экране
        if (savedGameInfo) {
            savedGameInfo.style.display = 'block';
        }
        
        // Показываем секцию с ссылкой
        if (gameLinkSection) {
            gameLinkSection.style.display = 'block';
        }
        
        // Обновляем поле с ссылкой
        if (gameLinkInput) {
            gameLinkInput.value = gameUrl;
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('pokerGameId', gameData.gameId);
    } else {
        if (savedGameInfo) savedGameInfo.style.display = 'none';
        if (gameLinkSection) gameLinkSection.style.display = 'none';
    }
}

// Показать тост-уведомление
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type === 'error') {
        toast.style.background = 'var(--red)';
    } else {
        toast.style.background = '#4caf50';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли gameId в URL параметрах
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('gameId');
    
    if (gameIdFromUrl) {
        // Пытаемся загрузить игру из URL
        loadGameState(gameIdFromUrl);
    } else {
        // Проверяем, есть ли сохраненная игра в localStorage
        const savedGameId = localStorage.getItem('pokerGameId');
        if (savedGameId) {
            loadGameState(savedGameId);
        } else {
            showScreen(startScreen);
        }
    }
    
    // Обработчики для кнопок выбора количества игроков
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const count = parseInt(this.getAttribute('data-count'));
            selectPlayerCount(count);
        });
    });

    // Обработчики для основных кнопок
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('load-game-btn').addEventListener('click', loadCurrentGame);
    document.getElementById('prev-round-btn').addEventListener('click', prevRound);
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    document.getElementById('end-game-btn').addEventListener('click', endGame);
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('back-to-game-btn').addEventListener('click', backToGame);
    document.getElementById('share-game-btn').addEventListener('click', shareGame);
    document.getElementById('share-result-btn').addEventListener('click', shareGame);
    document.getElementById('copy-link-btn').addEventListener('click', copyGameLink);
});

// Загрузка текущей игры
async function loadCurrentGame() {
    if (gameData.gameId) {
        await loadGameState(gameData.gameId);
    }
}

// Поделиться игрой
function shareGame() {
    copyGameLink();
}

// Копирование ссылки на игру
function copyGameLink() {
    if (!gameData.gameId) return;
    
    const gameUrl = `${window.location.origin}?gameId=${gameData.gameId}`;
    
    navigator.clipboard.writeText(gameUrl).then(() => {
        showToast('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
        console.error('Failed to copy game link: ', err);
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Ссылка скопирована в буфер обмена!');
    });
}

// Выбор количества игроков
function selectPlayerCount(count) {
    gameData.playerCount = count;
    
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    document.querySelector(`.player-count-btn[data-count="${count}"]`).classList.add('selected');
    
    playerInputsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const playerInput = document.createElement('div');
        playerInput.className = 'player-input';
        playerInput.innerHTML = `
            <label for="player-${i+1}">Игрок ${i+1}:</label>
            <input type="text" id="player-${i+1}" placeholder="Введите имя">
        `;
        playerInputsContainer.appendChild(playerInput);
    }
}

// Начало игры
async function startGame() {
    if (!gameData.gameId) {
        await createNewGame();
    }
    
    gameData.players = [];
    for (let i = 0; i < gameData.playerCount; i++) {
        const input = document.getElementById(`player-${i+1}`);
        const name = input.value.trim() || `Игрок ${i+1}`;
        gameData.players.push(name);
    }
    
    gameData.currentRound = 0;
    gameData.consecutivePasses = Array(gameData.playerCount).fill(0);
    
    const ordinaryRounds = roundSequences[gameData.playerCount].map(cards => ({
        cards: cards,
        type: 'ordinary',
        bids: Array(gameData.playerCount).fill(null),
        tricks: Array(gameData.playerCount).fill(null),
        calculated: false
    }));
    
    const maxCards = Math.max(...roundSequences[gameData.playerCount]);
    let specialRounds = [];
    
    specialGames.forEach(game => {
        for (let i = 0; i < gameData.playerCount; i++) {
            specialRounds.push({
                cards: maxCards,
                type: game.type,
                name: game.name,
                bids: Array(gameData.playerCount).fill(null),
                tricks: Array(gameData.playerCount).fill(null),
                calculated: false
            });
        }
    });
    
    gameData.rounds = [...ordinaryRounds, ...specialRounds];
    gameData.scores = Array(gameData.playerCount).fill(0);
    gameData.history = [];
    
    createGameStages();
    createPlayerCards();
    updateScoreTable();
    showScreen(gameScreen);
    
    await saveGameState();
}

// Создание стадий игры
function createGameStages() {
    gameStages.innerHTML = '';
    gameData.rounds.forEach((round, index) => {
        const stage = document.createElement('div');
        stage.className = 'stage';
        if (round.type !== 'ordinary') {
            stage.classList.add('special');
        }
        if (index === gameData.currentRound) {
            stage.classList.add('active');
        }
        
        const stageText = document.createElement('span');
        stageText.className = 'stage-text';
        
        if (round.type === 'ordinary') {
            stageText.textContent = `${index + 1}. ${round.cards} карта`;
        } else {
            stageText.textContent = `${index + 1}. ${round.name}`;
        }
        
        stage.appendChild(stageText);
        stage.addEventListener('click', () => goToRound(index));
        gameStages.appendChild(stage);
    });
}

// Создание карточек игроков
function createPlayerCards() {
    playersGameContainer.innerHTML = '';
    const currentRound = gameData.rounds[gameData.currentRound];
    
    gameData.players.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        if (index === 0) playerCard.classList.add('active');
        
        let passCounterClass = '';
        if (gameData.consecutivePasses[index] >= 2) {
            passCounterClass = 'danger';
        } else if (gameData.consecutivePasses[index] >= 1) {
            passCounterClass = 'warning';
        }
        
        playerCard.innerHTML = `
            <div class="player-name">
                ${player}
                <div class="pass-counter ${passCounterClass}">${gameData.consecutivePasses[index]}</div>
            </div>
            <div class="player-inputs-game">
                <div>
                    <label>Заказано взяток:</label>
                    <input type="number" min="0" max="${currentRound.cards}" 
                           value="${currentRound.bids[index] !== null ? currentRound.bids[index] : ''}" 
                           data-player="${index}" data-type="bid" 
                           ${currentRound.type === 'misere' ? 'disabled' : ''}>
                    <div class="bid-warning" id="bid-warning-${index}"></div>
                </div>
                <div>
                    <label>Взято взяток:</label>
                    <input type="number" min="0" max="${currentRound.cards}" 
                           value="${currentRound.tricks[index] !== null ? currentRound.tricks[index] : ''}" 
                           data-player="${index}" data-type="trick">
                </div>
            </div>
        `;
        playersGameContainer.appendChild(playerCard);
    });
    
    document.querySelectorAll('input[data-type="bid"], input[data-type="trick"]').forEach(input => {
        input.addEventListener('change', updateRoundData);
        input.addEventListener('input', validateInput);
        if (input.dataset.type === 'bid') {
            input.addEventListener('input', checkTotalBids);
        }
    });
    
    if (currentRound.type === 'misere') {
        for (let i = 0; i < gameData.players.length; i++) {
            currentRound.bids[i] = 0;
        }
    }
    
    checkTotalBids();
}

// Проверка суммы заказанных взяток
function checkTotalBids() {
    const currentRound = gameData.rounds[gameData.currentRound];
    const totalBids = currentRound.bids.reduce((sum, bid) => {
        return sum + (bid !== null ? bid : 0);
    }, 0);
    
    document.querySelectorAll('.bid-warning').forEach(warning => {
        warning.textContent = '';
    });
    
    if (totalBids === currentRound.cards) {
        document.querySelectorAll('input[data-type="bid"]').forEach(input => {
            const warning = document.getElementById(`bid-warning-${input.dataset.player}`);
            if (warning) {
                warning.textContent = `Сумма заказов (${totalBids}) равна количеству карт!`;
                input.classList.add('invalid');
            }
        });
        showAlert(`Сумма заказанных взяток (${totalBids}) равна количеству карт в раунде (${currentRound.cards}). Это недопустимо!`);
    } else {
        document.querySelectorAll('input[data-type="bid"]').forEach(input => {
            input.classList.remove('invalid');
        });
        hideAlert();
    }
}

// Валидация ввода
function validateInput() {
    const playerIndex = parseInt(this.getAttribute('data-player'));
    const type = this.getAttribute('data-type');
    const value = this.value === '' ? null : parseInt(this.value);
    const max = parseInt(this.getAttribute('max'));
    
    if (value !== null && (value < 0 || value > max)) {
        this.classList.add('invalid');
        showAlert(`Недопустимое значение. Должно быть от 0 до ${max}.`);
    } else {
        this.classList.remove('invalid');
        hideAlert();
    }
    
    if (type === 'bid' && value === 0) {
        if (gameData.consecutivePasses[playerIndex] >= 2) {
            this.classList.add('invalid');
            showAlert(`${gameData.players[playerIndex]} не может делать пас более 2 раз подряд.`);
            this.value = '';
            gameData.rounds[gameData.currentRound].bids[playerIndex] = null;
        }
    }
}

// Обновление данных раунда
async function updateRoundData() {
    const playerIndex = parseInt(this.getAttribute('data-player'));
    const type = this.getAttribute('data-type');
    const value = this.value === '' ? null : parseInt(this.value);
    
    if (type === 'bid') {
        gameData.rounds[gameData.currentRound].bids[playerIndex] = value;
        
        if (value === 0) {
            gameData.consecutivePasses[playerIndex]++;
        } else {
            gameData.consecutivePasses[playerIndex] = 0;
        }
        
        checkTotalBids();
    } else {
        gameData.rounds[gameData.currentRound].tricks[playerIndex] = value;
    }
    
    updatePassCounters();
    await saveGameState();
}

// Обновление счетчиков пасов
function updatePassCounters() {
    document.querySelectorAll('.pass-counter').forEach((counter, index) => {
        let passCounterClass = '';
        if (gameData.consecutivePasses[index] >= 2) {
            passCounterClass = 'danger';
        } else if (gameData.consecutivePasses[index] >= 1) {
            passCounterClass = 'warning';
        }
        
        counter.textContent = gameData.consecutivePasses[index];
        counter.className = `pass-counter ${passCounterClass}`;
    });
}

// Переход к указанному раунду
async function goToRound(roundIndex) {
    if (roundIndex < 0 || roundIndex >= gameData.rounds.length) return;
    
    gameData.currentRound = roundIndex;
    
    document.querySelectorAll('.stage').forEach((stage, index) => {
        if (index === roundIndex) {
            stage.classList.add('active');
        } else {
            stage.classList.remove('active');
        }
    });
    
    const round = gameData.rounds[roundIndex];
    if (round.type === 'ordinary') {
        currentRoundElement.textContent = `Игра: ${round.cards} карта (Обычная)`;
    } else {
        currentRoundElement.textContent = `Специгра: ${round.name}`;
    }
    
    createPlayerCards();
    updateScoreTable();
    await saveGameState();
}

// Предыдущий раунд
function prevRound() {
    if (gameData.currentRound > 0) {
        goToRound(gameData.currentRound - 1);
    }
}

// Следующий раунд
async function nextRound() {
    const currentRound = gameData.rounds[gameData.currentRound];
    const allBidsEntered = currentRound.bids.every(bid => bid !== null);
    const allTricksEntered = currentRound.tricks.every(trick => trick !== null);
    
    if (!allBidsEntered || !allTricksEntered) {
        showAlert('Пожалуйста, введите все заказы и взятые взятки для всех игроков.');
        return;
    }
    
    const totalBids = currentRound.bids.reduce((sum, bid) => sum + bid, 0);
    if (totalBids === currentRound.cards) {
        showAlert(`Сумма заказанных взяток (${totalBids}) не может равняться количеству карт в раунде (${currentRound.cards}).`);
        return;
    }
    
    calculateRoundScores();
    
    if (gameData.currentRound < gameData.rounds.length - 1) {
        goToRound(gameData.currentRound + 1);
    } else {
        endGame();
    }
    
    await saveGameState();
}

// Расчет очков для текущего раунда
function calculateRoundScores() {
    const round = gameData.rounds[gameData.currentRound];
    if (round.calculated) return;
    
    round.calculated = true;
    
    for (let i = 0; i < gameData.players.length; i++) {
        const bid = round.bids[i];
        const tricks = round.tricks[i];
        
        let roundScore = 0;
        
        if (round.type === 'misere') {
            roundScore = tricks * -10;
        } else if (bid === 0) {
            if (tricks === 0) {
                roundScore = 5;
            } else {
                roundScore = tricks;
            }
        } else {
            if (bid === tricks) {
                roundScore = bid * 10;
            } else if (tricks > bid) {
                roundScore = tricks;
            } else {
                roundScore = (bid - tricks) * -10;
            }
        }
        
        if (round.type === 'golda') {
            roundScore *= 2;
        }
        
        gameData.scores[i] += roundScore;
        
        gameData.history.unshift({
            player: gameData.players[i],
            round: gameData.currentRound + 1,
            bid: bid,
            tricks: tricks,
            score: roundScore,
            total: gameData.scores[i]
        });
    }
    
    updateScoreTable();
    updateScoreHistory();
}

// Обновление таблицы счета
function updateScoreTable() {
    scoreTableBody.innerHTML = '';
    
    for (let i = 0; i < gameData.players.length; i++) {
        const currentRoundData = gameData.rounds[gameData.currentRound];
        const bid = currentRoundData.bids[i] !== null ? currentRoundData.bids[i] : '-';
        const tricks = currentRoundData.tricks[i] !== null ? currentRoundData.tricks[i] : '-';
        
        const lastScoreRecord = gameData.history.find(record => 
            record.player === gameData.players[i] && record.round === gameData.currentRound + 1
        );
        
        const scoreCell = lastScoreRecord ? 
            `<span class="${lastScoreRecord.score >= 0 ? 'score-positive' : 'score-negative'}">
                ${lastScoreRecord.score > 0 ? '+' : ''}${lastScoreRecord.score}
            </span>` : '-';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${gameData.players[i]}</td>
            <td>${bid}</td>
            <td>${tricks}</td>
            <td>${scoreCell}</td>
            <td>${gameData.scores[i]}</td>
        `;
        scoreTableBody.appendChild(row);
    }
}

// Обновление истории очков
function updateScoreHistory() {
    scoreHistoryList.innerHTML = '';
    
    const playerHistory = {};
    
    gameData.players.forEach(player => {
        playerHistory[player] = [];
    });
    
    gameData.history.forEach(record => {
        if (playerHistory[record.player].length < 3) {
            playerHistory[record.player].push(record);
        }
    });
    
    gameData.players.forEach(player => {
        const playerRecords = playerHistory[player];
        if (playerRecords.length > 0) {
            const playerHeader = document.createElement('div');
            playerHeader.className = 'history-item';
            playerHeader.innerHTML = `<span class="history-player">${player}:</span>`;
            scoreHistoryList.appendChild(playerHeader);
            
            playerRecords.forEach(record => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <span>Раунд ${record.round}: Заказ ${record.bid}, Взято ${record.tricks}</span>
                    <span class="${record.score >= 0 ? 'score-positive' : 'score-negative'}">
                        ${record.score > 0 ? '+' : ''}${record.score}
                    </span>
                `;
                scoreHistoryList.appendChild(historyItem);
            });
        }
    });
    
    if (scoreHistoryList.children.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-item';
        emptyMessage.textContent = 'История очков пуста';
        scoreHistoryList.appendChild(emptyMessage);
    }
}

// Показать предупреждение
function showAlert(message) {
    alertMessage.textContent = message;
    alertMessage.classList.add('show');
}

// Скрыть предупреждение
function hideAlert() {
    alertMessage.classList.remove('show');
}

// Завершение игры
async function endGame() {
    if (!gameData.rounds[gameData.currentRound].calculated) {
        calculateRoundScores();
    }
    
    createPodium();
    showScreen(resultScreen);
    await saveGameState();
}

// Создание пьедестала
function createPodium() {
    const playersWithScores = gameData.players.map((player, index) => ({
        name: player,
        score: gameData.scores[index]
    }));
    
    playersWithScores.sort((a, b) => b.score - a.score);
    
    podium.innerHTML = '';
    otherPlayers.innerHTML = '';
    
    const places = ['first', 'second', 'third'];
    for (let i = 0; i < Math.min(3, playersWithScores.length); i++) {
        const podiumPlace = document.createElement('div');
        podiumPlace.className = `podium-place ${places[i]}`;
        podiumPlace.innerHTML = `
            <div class="trophy"></div>
            <div class="podium-stand">
                ${i + 1} место
            </div>
            <div class="podium-player">${playersWithScores[i].name}</div>
            <div class="podium-score">${playersWithScores[i].score} очков</div>
        `;
        podium.appendChild(podiumPlace);
    }
    
    if (playersWithScores.length > 3) {
        const otherPlayersTitle = document.createElement('h2');
        otherPlayersTitle.textContent = 'Остальные игроки';
        otherPlayers.appendChild(otherPlayersTitle);
        
        const playerList = document.createElement('ul');
        playerList.className = 'player-list';
        
        for (let i = 3; i < playersWithScores.length; i++) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${playersWithScores[i].name}</span>
                <span>${playersWithScores[i].score} очков</span>
            `;
            playerList.appendChild(listItem);
        }
        
        otherPlayers.appendChild(playerList);
    }
}

// Новая игра
async function newGame() {
    if (confirm('Вы уверены, что хотите начать новую игру? Текущий прогресс будет сохранен, но вы начнете новую игру.')) {
        await createNewGame();
        
        gameData.players = [];
        gameData.playerCount = 0;
        gameData.currentRound = 0;
        gameData.rounds = [];
        gameData.scores = [];
        gameData.history = [];
        gameData.consecutivePasses = [];
        
        document.querySelectorAll('.player-count-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        playerInputsContainer.innerHTML = '';
        showScreen(startScreen);
        
        localStorage.removeItem('pokerGameId');
        updateGameLinkDisplay();
    }
}

// Вернуться к игре
function backToGame() {
    showScreen(gameScreen);
}

// Вспомогательная функция для переключения экранов
function showScreen(screenElement) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    screenElement.classList.add('active');
}