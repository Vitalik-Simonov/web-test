// Инициализация WebApp Telegram
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
const state = {
    score: 0,
    upgrades: {
        1: { price: 10, count: 0, clicksPerSecond: 1 },
        2: { price: 50, count: 0, clicksPerSecond: 5 }
    },
    lastSave: Date.now()
};

// Элементы DOM
const scoreElement = document.getElementById('score');
const clickButton = document.getElementById('click-btn');
const buyButtons = document.querySelectorAll('.buy-btn');

// Инициализация
function init() {
    loadGame();
    updateUI();
    setupEventListeners();
    startAutoClickers();
    
    // Показываем кнопку закрытия, если не в Telegram
    if (!tg.initData) {
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.style.marginTop = '20px';
        closeButton.onclick = () => alert('В Telegram это закроет мини-приложение');
        document.querySelector('.container').appendChild(closeButton);
    }
}

// Загрузка сохраненной игры
function loadGame() {
    const savedGame = localStorage.getItem('clickerGame');
    if (savedGame) {
        const parsed = JSON.parse(savedGame);
        state.score = parsed.score || 0;
        state.upgrades = parsed.upgrades || state.upgrades;
        state.lastSave = parsed.lastSave || Date.now();
        
        // Рассчитываем оффлайн-доход
        const offlineTime = (Date.now() - state.lastSave) / 1000; // в секундах
        if (offlineTime > 5) { // Минимум 5 секунд
            const offlineEarnings = calculateOfflineEarnings(offlineTime);
            state.score += offlineEarnings;
            if (tg.showAlert) {
                tg.showAlert(`Вы заработали ${offlineEarnings} кликов за время отсутствия!`);
            } else {
                alert(`Вы заработали ${offlineEarnings} кликов за время отсутствия!`);
            }
        }
    }
}

// Расчет оффлайн-дохода
function calculateOfflineEarnings(seconds) {
    let total = 0;
    for (const upgradeId in state.upgrades) {
        const upgrade = state.upgrades[upgradeId];
        total += upgrade.count * upgrade.clicksPerSecond * seconds;
    }
    return Math.floor(total);
}

// Сохранение игры
function saveGame() {
    state.lastSave = Date.now();
    localStorage.setItem('clickerGame', JSON.stringify({
        score: state.score,
        upgrades: state.upgrades,
        lastSave: state.lastSave
    }));
}

// Обновление интерфейса
function updateUI() {
    scoreElement.textContent = state.score;
    
    for (const upgradeId in state.upgrades) {
        const upgrade = state.upgrades[upgradeId];
        document.getElementById(`upgrade${upgradeId}-price`).textContent = upgrade.price;
        document.getElementById(`upgrade${upgradeId}-count`).textContent = upgrade.count;
        
        const button = document.querySelector(`.buy-btn[data-upgrade="${upgradeId}"]`);
        if (button) {
            button.disabled = state.score < upgrade.price;
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Основной клик
    clickButton.addEventListener('click', () => {
        state.score++;
        updateUI();
        saveGame();
    });
    
    // Покупка улучшений
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const upgradeId = e.target.getAttribute('data-upgrade');
            buyUpgrade(upgradeId);
        });
    });
    
    // Сохранение при закрытии
    window.addEventListener('beforeunload', saveGame);
}

// Покупка улучшения
function buyUpgrade(upgradeId) {
    const upgrade = state.upgrades[upgradeId];
    
    if (state.score >= upgrade.price) {
        state.score -= upgrade.price;
        upgrade.count++;
        upgrade.price = Math.floor(upgrade.price * 1.5); // Увеличиваем цену
        
        updateUI();
        saveGame();
    }
}

// Автокликеры
function startAutoClickers() {
    setInterval(() => {
        let clicksToAdd = 0;
        
        for (const upgradeId in state.upgrades) {
            const upgrade = state.upgrades[upgradeId];
            clicksToAdd += upgrade.count * upgrade.clicksPerSecond;
        }
        
        if (clicksToAdd > 0) {
            state.score += clicksToAdd;
            updateUI();
            saveGame();
        }
    }, 1000); // Обновляем каждую секунду
}

// Запуск игры
init();