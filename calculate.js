// Проверка авторизации при загрузке страницы
window.onload = function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showMainMenu(currentUser);
    }
};

// Переключение вкладок авторизации
function showAuthTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#authForm .tab')[tab === 'login' ? 0 : 1].classList.add('active');
    
    document.getElementById('loginTab').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerTab').classList.toggle('hidden', tab !== 'register');
    
    clearErrors();
}

// Переключение вкладок в главном меню
function showTab(tab) {
    document.querySelectorAll('#mainMenu .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#mainMenu .tab')[tab === 'credit' ? 0 : 1].classList.add('active');
    
    document.getElementById('creditTab').classList.toggle('hidden', tab !== 'credit');
    document.getElementById('historyTab').classList.toggle('hidden', tab !== 'history');
    
    if (tab === 'history') {
        loadCreditHistory();
    }
}

// Регистрация пользователя
function register() {
    const nick = document.getElementById('registerNick').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    clearErrors();
    
    if (!nick || !password || !confirmPassword) {
        showError('registerError', 'Все поля должны быть заполнены');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('registerError', 'Кодовые слова не совпадают');
        return;
    }
    
    if (password.length < 3) {
        showError('registerError', 'Кодовое слово должно содержать минимум 3 символа');
        return;
    }
    
    // Проверка существования пользователя
    const users = JSON.parse(localStorage.getItem('bobbank_users') || '{}');
    if (users[nick]) {
        showError('registerError', 'Пользователь с таким никнеймом уже существует');
        return;
    }
    
    // Сохранение пользователя
    users[nick] = {
        password: password,
        registrationDate: new Date().toISOString(),
        credits: []
    };
    
    localStorage.setItem('bobbank_users', JSON.stringify(users));
    localStorage.setItem('currentUser', nick);
    
    showMainMenu(nick);
}

// Вход пользователя
function login() {
    const nick = document.getElementById('loginNick').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    clearErrors();
    
    if (!nick || !password) {
        showError('loginError', 'Все поля должны быть заполнены');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('bobbank_users') || '{}');
    
    if (!users[nick]) {
        showError('loginError', 'Пользователь не найден');
        return;
    }
    
    if (users[nick].password !== password) {
        showError('loginError', 'Неверное кодовое слово');
        return;
    }
    
    localStorage.setItem('currentUser', nick);
    showMainMenu(nick);
}

// Отображение главного меню
function showMainMenu(nick) {
    document.getElementById('authForm').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    document.querySelector('.logout-btn').classList.remove('hidden');
    document.getElementById('currentUser').textContent = nick;
}

// Выход из системы
function logout() {
    localStorage.removeItem('currentUser');
    document.getElementById('authForm').classList.remove('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.querySelector('.logout-btn').classList.add('hidden');
    clearForms();
}

// Расчет процентной ставки
function calculateInterestRate(amount) {
    if (amount >= 100 && amount <= 500) {
        return 30;
    } else if (amount > 500 && amount <= 10000) {
        return 20;
    } else {
        return 25;
    }
}

// Расчет кредита
function calculateLoan() {
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const currentUser = localStorage.getItem('currentUser');
    
    if (!amount || amount < 100) {
        alert('Минимальная сумма кредита: 100 евро');
        return;
    }
    
    const rate = calculateInterestRate(amount);
    const finalAmount = amount * (1 + rate / 100);
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const contractNumber = generateContractNumber(currentUser);
    
    const resultHTML = `
        <div class="credit-result">
            <h3>Результат расчета:</h3>
            <p><strong>Сумма кредита:</strong> ${amount} евро</p>
            <p><strong>Процентная ставка:</strong> ${rate}% годовых</p>
            <p><strong>Итоговая сумма к возврату:</strong> ${finalAmount.toFixed(2)} евро</p>
            <p><strong>Номер договора:</strong> ${contractNumber}</p>
            
            <div class="form-group">
                <label for="confirmCode">Введите ваше кодовое слово для подтверждения:</label>
                <input type="password" id="confirmCode" placeholder="Кодовое слово">
            </div>
            
            <label>
                <input type="checkbox" id="agreeTerms"> Я соглашаюсь с условиями договора
            </label>
            
            <button class="btn" onclick="confirmLoan(${amount}, ${rate}, ${finalAmount}, '${contractNumber}', '${currentDate}')">
                Подтвердить кредит
            </button>
        </div>
    `;
    
    document.getElementById('loanResult').innerHTML = resultHTML;
    document.getElementById('loanResult').classList.remove('hidden');
}

// Подтверждение кредита
function confirmLoan(amount, rate, finalAmount, contractNumber, date) {
    const currentUser = localStorage.getItem('currentUser');
    const confirmCode = document.getElementById('confirmCode').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!confirmCode) {
        alert('Введите кодовое слово');
        return;
    }
    
    if (!agreeTerms) {
        alert('Необходимо согласиться с условиями договора');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('bobbank_users') || '{}');
    
    if (users[currentUser].password !== confirmCode) {
        alert('Неверное кодовое слово');
        return;
    }
    
    // Сохранение кредита
    const creditData = {
        contractNumber,
        amount,
        rate,
        finalAmount,
        date,
        timestamp: new Date().toISOString()
    };
    
    users[currentUser].credits.push(creditData);
    localStorage.setItem('bobbank_users', JSON.stringify(users));
    
    // Генерация договора
    generateContract(currentUser, amount, rate, finalAmount, date, contractNumber);
}

// Генерация договора
function generateContract(userName, amount, rate, finalAmount, date, contractNumber) {
    const contractText = `
КРЕДИТНЫЙ ДОГОВОР № ${contractNumber}

Кредитный договор между BOBBANK и ${userName}
о предоставлении займа в размере ${amount} евро
на срок 1 год под ${rate}% годовых.

Итоговая сумма к возврату: ${finalAmount.toFixed(2)} евро
Дата оформления: ${date}

Условия договора:
1. Заемщик обязуется вернуть полную сумму в течение 12 месяцев
2. Проценты начисляются с даты выдачи кредита
3. Договор вступает в силу с момента подписания

Подписи сторон:
BOBBANK: ________________
${userName}: ________________

Дата: ${date}
    `;
    
    const contractHTML = `
        <div class="contract">
            <h3>Ваш кредитный договор:</h3>
            <pre>${contractText}</pre>
            <div class="download-buttons">
                <button class="btn" onclick="downloadContract('${contractText.replace(/'/g, "\\'")}', '${contractNumber}')">
                    Скачать текст
                </button>
                <button class="btn btn-secondary" onclick="downloadContractImage('${contractText.replace(/'/g, "\\'")}', '${contractNumber}')">
                    Скачать изображение
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('loanResult').innerHTML = contractHTML;
    
    alert('Кредит успешно оформлен! Договор № ' + contractNumber);
}

// Загрузка истории кредитов
function loadCreditHistory() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('bobbank_users') || '{}');
    const userCredits = users[currentUser]?.credits || [];
    
    const historyHTML = userCredits.length > 0 
        ? userCredits.map(credit => `
            <div class="credit-result">
                <h4>Договор № ${credit.contractNumber}</h4>
                <p><strong>Сумма:</strong> ${credit.amount} евро</p>
                <p><strong>Ставка:</strong> ${credit.rate}%</p>
                <p><strong>К возврату:</strong> ${credit.finalAmount.toFixed(2)} евро</p>
                <p><strong>Дата:</strong> ${credit.date}</p>
            </div>
        `).join('')
        : '<p>У вас пока нет оформленных кредитов</p>';
    
    document.getElementById('creditHistory').innerHTML = historyHTML;
}

// Генерация номера договора
function generateContractNumber(userName) {
    const timestamp = Date.now().toString().slice(-6);
    return `${timestamp}-${userName}`;
}

// Скачивание текстового файла
function downloadContract(text, contractNumber) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Договор_${contractNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Скачивание изображения договора
function downloadContractImage(text, contractNumber) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Заливка фона
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Настройка текста
    ctx.fillStyle = 'black';
    ctx.font = '14px Courier New';
    
    const lines = text.split('\n');
    let y = 30;
    
    lines.forEach(line => {
        if (y < canvas.height - 20) {
            ctx.fillText(line, 20, y);
            y += 20;
        }
    });
    
    // Создание и скачивание изображения
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Договор_${contractNumber}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Вспомогательные функции
function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function clearForms() {
    document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'checkbox') {
            input.value = '';
        } else {
            input.checked = false;
        }
    });
    document.getElementById('loanResult').classList.add('hidden');
    clearErrors();
}
