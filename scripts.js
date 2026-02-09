// Dados iniciais do aplicativo
const appData = {
    hero: {
        name: "Ryan Pascoal",
        primaryClassId: 1,
        level: 0,
        xp: 0,
        maxXp: 100,
        lives: 4,
        maxLives: 4,
        coins: 0,
        protection: {
            shield: false
        },
        streak: {
            general: 0,
            physical: 0,
            mental: 0,
            lastGeneralCheck: null,
            lastPhysicalCheck: null,
            lastMentalCheck: null
        }
    },
    attributes: [
        { id: 1, name: "Força", emoji: "💪", xp: 0, maxXp: 100, level: 0 },
        { id: 2, name: "Vigor", emoji: "❤️", xp: 0, maxXp: 100, level: 0 },
        { id: 3, name: "Agilidade", emoji: "⚡", xp: 0, maxXp: 100, level: 0},
        { id: 4, name: "Habilidade", emoji: "🎯", xp: 0, maxXp: 100, level: 0 },
        { id: 5, name: "Criatividade", emoji: "🎨", xp: 0, maxXp: 100, level: 0 },
        { id: 6, name: "Disciplina", emoji: "📘", xp: 0, maxXp: 100, level: 0 },
        { id: 7, name: "Inteligência", emoji: "🧠", xp: 0, maxXp: 100, level: 0 },
        { id: 8, name: "Fé", emoji: "🙏", xp: 0, maxXp: 100, level: 0 },
        { id: 9, name: "Liderança", emoji: "👑", xp: 0, maxXp: 100, level: 0 },
        { id: 10, name: "Sociabilidade", emoji: "🗣️", xp: 0, maxXp: 100, level: 0 },
        { id: 11, name: "Justiça", emoji: "⚖️", xp: 0, maxXp: 100, level: 0 },
        { id: 12, name: "Conhecimento", emoji: "📚", xp: 0, maxXp: 100, level: 0 },
        { id: 13, name: "Casamento", emoji: "💍", xp: 0, maxXp: 100, level: 0 },
        { id: 14, name: "Riqueza", emoji: "💎", xp: 0, maxXp: 100, level: 0 }
    ],
    classes: [

    ],
    workouts: [    ],
    studies: [    ],
    books: [],
    shopItems: [
        { id: 1, name: "Poção", emoji: "🧪", cost: 50, level: 0, description: "Restaura 1 vida", effect: "heal" },
        { id: 2, name: "Escudo", emoji: "🛡️", cost: 100, level: 0, description: "Protege de 1 dano e de uma quebra de streak", effect: "shield" },
        { id: 3, name: "Bomba", emoji: "💣", cost: 100, level: 0, description: "Causa 50 de dano em 1 chefe à sua escolha", effect: "bomb" }
    ],
    inventory: [],
    missions: [],
    completedMissions: [],
    completedWorkouts: [],
    completedStudies: [],
    heroLogs: [],
    bosses: [
        { id: 1, name: "Físico", hp: 100, maxHp: 100, reset: "daily", attributes: [1, 2, 3, 4], defeated: false, bonusActive: false },
        { id: 2, name: "Mental", hp: 100, maxHp: 100, reset: "daily", attributes: [5, 6, 7, 12], defeated: false, bonusActive: false },
        { id: 3, name: "Social", hp: 100, maxHp: 100, reset: "weekly", attributes: [9, 10], defeated: false, bonusActive: false },
        { id: 4, name: "Espiritual", hp: 100, maxHp: 100, reset: "weekly", attributes: [8, 11, 13], defeated: false, bonusActive: false }
    ],
    statistics: {
        workoutsDone: 0,
        workoutsIgnored: 0,
        studiesDone: 0,
        studiesIgnored: 0,
        booksRead: 0,
        missionsDone: 0,
        missionsFailed: 0,
        justiceDone: 0,
        maxStreakGeneral: 0,
        maxStreakPhysical: 0,
        maxStreakMental: 0,
        dailyRecords: {},
        workoutDetails: {},
        studyDetails: {},
        productiveDays: {}
    },
    diaryEntries: [],
    feedbacks: [],
    dailyWorkouts: [],
    dailyStudies: [],
    restDays: [],
    financeEntries: [],
    // Timers
    workoutTimer: {
        running: false,
        time: 0,
        interval: null
    },
    focusTimer: {
        running: false,
        time: 0,
        interval: null
    }
};;

// Estado do calendário (aba Calendários)
let calendarState = {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selectedDate: null,
    detailsFilter: 'all'
};

const REST_DAYS_PER_MONTH_LIMIT = 2;

// Diário em IndexedDB (para evitar limite do localStorage)
const DIARY_DB_NAME = 'heroJourneyDB';
const DIARY_DB_VERSION = 1;
const DIARY_STORE = 'diaryEntries';
let diaryDbPromise = null;
let diaryCache = [];
let diaryLoaded = false;
let diaryDbAvailable = true;

function openDiaryDB() {
    if (diaryDbPromise) return diaryDbPromise;
    diaryDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DIARY_DB_NAME, DIARY_DB_VERSION);
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DIARY_STORE)) {
                const store = db.createObjectStore(DIARY_STORE, { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    return diaryDbPromise;
}

function getAllDiaryEntriesFromDB() {
    return openDiaryDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DIARY_STORE, 'readonly');
        const store = tx.objectStore(DIARY_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    }));
}

function saveDiaryEntryToDB(entry) {
    return openDiaryDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DIARY_STORE, 'readwrite');
        const store = tx.objectStore(DIARY_STORE);
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }));
}

function replaceDiaryEntriesInDB(entries) {
    return openDiaryDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DIARY_STORE, 'readwrite');
        const store = tx.objectStore(DIARY_STORE);
        const clearReq = store.clear();
        clearReq.onerror = () => reject(clearReq.error);
        clearReq.onsuccess = () => {
            entries.forEach(entry => store.put(entry));
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    }));
}

async function refreshDiaryCache() {
    if (!diaryDbAvailable) {
        diaryCache = Array.isArray(appData.diaryEntries) ? appData.diaryEntries : [];
        diaryLoaded = true;
        return;
    }
    const entries = await getAllDiaryEntriesFromDB();
    diaryCache = entries;
    diaryLoaded = true;
}

async function migrateDiaryEntriesToDBIfNeeded() {
    if (!diaryDbAvailable) return;
    if (!Array.isArray(appData.diaryEntries) || appData.diaryEntries.length === 0) return;
    const entries = appData.diaryEntries.slice();
    appData.diaryEntries = [];
    saveToLocalStorage();
    await replaceDiaryEntriesInDB(entries);
}

async function initDiaryStorage() {
    if (!('indexedDB' in window)) {
        diaryDbAvailable = false;
        diaryLoaded = true;
        return;
    }
    try {
        await openDiaryDB();
        await migrateDiaryEntriesToDBIfNeeded();
        await refreshDiaryCache();
    } catch (e) {
        console.warn('IndexedDB indisponível. Usando localStorage para diário.', e);
        diaryDbAvailable = false;
        diaryLoaded = true;
    }
}

async function saveDiaryEntryToStorage(entry) {
    if (!diaryDbAvailable) {
        if (!Array.isArray(appData.diaryEntries)) appData.diaryEntries = [];
        appData.diaryEntries.push(entry);
        diaryCache = appData.diaryEntries;
        diaryLoaded = true;
        return;
    }
    await saveDiaryEntryToDB(entry);
    diaryCache.push(entry);
    diaryLoaded = true;
}


// Inicialização do aplicativo - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
    // 1. Primeiro: carregar dados salvos
    loadFromLocalStorage();
    
    // 2. Verificar e recriar missões diárias para HOJE (coloque AQUI!)
    recreateDailyMissionsForToday();
    
    cleanupOldDailyMissions();

    // 3. Depois: verificar outras coisas
    checkOverdueMissions();
    checkDailyReset();
    checkWeeklyReset();
    
    // 4. Gerar atividades do dia
    generateDailyActivities();
    
    // 5. Resto da inicialização...
    updateStreaks();
    initUI();
    initEvents();
    initDiaryStorage().then(() => updateDiaryEntries());
    updateUI();
    updateMidnightCountdown();
    setInterval(updateMidnightCountdown, 1000);
    updateCurrentDate();
    setInterval(checkDailyReset, 60000);
    setInterval(updateStreaks, 60000);
});

// Carregar dados do localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('heroJourneyData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            mergeData(appData, parsedData);
            ensureCoreAttributes();
            ensureClasses();
            ensureStartingLevels();
            console.log('Dados carregados do localStorage');
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
    }
}

function ensureCoreAttributes() {
    if (!Array.isArray(appData.attributes)) appData.attributes = [];
    const hasRiqueza = appData.attributes.some(a => a.id === 14);
    if (!hasRiqueza) {
        appData.attributes.push({ id: 14, name: "Riqueza", emoji: "💎", xp: 0, maxXp: 100, level: 0 });
    }
}

function ensureClasses() {
    if (!Array.isArray(appData.classes)) appData.classes = [];
    if (appData.classes.length === 0) {
        const legacyClassName = appData.hero?.class;
        const baseName = legacyClassName || 'Classe';
        appData.classes.push({ id: 1, name: baseName, emoji: "ðŸ’¼", xp: 0, maxXp: 100, level: 0 });
    }
    if (appData.hero && Object.prototype.hasOwnProperty.call(appData.hero, 'class')) {
        delete appData.hero.class;
    }
    let nextId = 1;
    appData.classes.forEach(cls => {
        if (!Number.isFinite(cls.id)) cls.id = nextId;
        nextId = Math.max(nextId, cls.id + 1);
        if (!cls.name) cls.name = 'Classe';
        if (!cls.emoji) cls.emoji = "ðŸ’¼";
        if (!Number.isFinite(cls.xp) || cls.xp < 0) cls.xp = 0;
        if (!Number.isFinite(cls.maxXp) || cls.maxXp <= 0) cls.maxXp = 100;
        if (!Number.isFinite(cls.level) || cls.level < 0) cls.level = 0;
    });
    if (!appData.hero) appData.hero = {};
    if (!Number.isFinite(appData.hero.primaryClassId)) {
        appData.hero.primaryClassId = appData.classes[0]?.id || null;
    }
    if (appData.hero.primaryClassId && !appData.classes.some(c => c.id === appData.hero.primaryClassId)) {
        appData.hero.primaryClassId = appData.classes[0]?.id || null;
    }
}

function ensureStartingLevels() {
    if (!Array.isArray(appData.attributes)) appData.attributes = [];
    appData.attributes.forEach(attr => {
        if (!Number.isFinite(attr.level) || attr.level < 0) attr.level = 0;
        if (!Number.isFinite(attr.xp) || attr.xp < 0) attr.xp = 0;
        if (!Number.isFinite(attr.maxXp) || attr.maxXp <= 0) attr.maxXp = 100;
    });
    if (!Array.isArray(appData.classes)) appData.classes = [];
    appData.classes.forEach(cls => {
        if (!Number.isFinite(cls.level) || cls.level < 0) cls.level = 0;
        if (!Number.isFinite(cls.xp) || cls.xp < 0) cls.xp = 0;
        if (!Number.isFinite(cls.maxXp) || cls.maxXp <= 0) cls.maxXp = 100;
    });
    if (!Array.isArray(appData.workouts)) appData.workouts = [];
    appData.workouts.forEach(workout => {
        if (!Number.isFinite(workout.level) || workout.level < 0) workout.level = 0;
        if (!Number.isFinite(workout.xp) || workout.xp < 0) workout.xp = 0;
    });
    if (!Array.isArray(appData.studies)) appData.studies = [];
    appData.studies.forEach(study => {
        if (!Number.isFinite(study.level) || study.level < 0) study.level = 0;
        if (!Number.isFinite(study.xp) || study.xp < 0) study.xp = 0;
    });
}

// Função para mesclar dados
function mergeData(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            
            if (Array.isArray(sourceValue)) {
                // Arrays devem ser substituídos por inteiro
                target[key] = sourceValue.slice();
                continue;
            }
            
            if (typeof sourceValue === 'object' && sourceValue !== null && 
                typeof targetValue === 'object' && targetValue !== null) {
                mergeData(targetValue, sourceValue);
            } else {
                target[key] = sourceValue;
            }
        }
    }
}

// Salvar dados no localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('heroJourneyData', JSON.stringify(appData));
        console.log('Dados salvos no localStorage');
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
    }
}

// Verificar reset diário
function checkDailyReset() {
    const today = getLocalDateString();
    const lastReset = localStorage.getItem('lastDailyReset');
    
    if (lastReset !== today) {
        // Aplicar penalidades do dia anterior antes do reset
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        applyPenalties(getLocalDateString(yesterday));

        // Resetar chefões físicos e mentais
        resetBossGroup(["Físico", "Mental"]);
        
        // Limpar atividades do dia anterior
        appData.dailyWorkouts = [];
        appData.dailyStudies = [];
        
        // Gerar novas atividades do dia
        generateDailyActivities();
        
        localStorage.setItem('lastDailyReset', today);
        console.log('Reset diário aplicado');
    }
}

// Verificar reset semanal
function checkWeeklyReset() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda
    const thisWeek = getWeekNumber(today);
    const lastWeeklyReset = localStorage.getItem('lastWeeklyReset');
    
    if (dayOfWeek === 1 && lastWeeklyReset !== thisWeek.toString()) { // Segunda-feira
        // Resetar chefões sociais e espirituais
        resetBossGroup(["Social", "Espiritual"]);
        
        localStorage.setItem('lastWeeklyReset', thisWeek.toString());
        console.log('Reset semanal aplicado');
    }
}

// Gerar número da semana
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
}

function resetBossGroup(names) {
    names.forEach(name => {
        const boss = appData.bosses.find(b => b.name === name);
        if (!boss) return;
        if (!boss.defeated) {
            boss.hp = boss.maxHp + 1;
        } else {
            boss.hp = boss.maxHp;
            boss.defeated = false;
        }
        boss.bonusActive = false;
    });
}

function addHeroLog(type, title, content) {
    if (!appData.heroLogs) appData.heroLogs = [];
    appData.heroLogs.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        title,
        content,
        date: new Date().toISOString()
    });
    // Manter logs sob controle
    if (appData.heroLogs.length > 200) {
        appData.heroLogs = appData.heroLogs.slice(-200);
    }
}

function applyActivityPenalties(config) {
    const {
        targetDateStr,
        dailyList,
        itemList,
        completedList,
        idKey,
        nameFallback,
        emojiFallback,
        typeFallback,
        statsKey,
        streakKeys,
        alertFail,
        alertShield,
        logShieldTitle,
        logShieldContent,
        logFailTitle,
        logFailContent
    } = config;
    
    const incompleteItems = dailyList.filter(item => 
        item.date === targetDateStr && !item.completed);
    
    if (incompleteItems.length === 0) {
        return;
    }
    
    incompleteItems.forEach(dayItem => {
        dayItem.failed = true;
        const item = itemList.find(i => i.id === dayItem[idKey]);
        const alreadyLogged = completedList.some(entry => 
            entry[idKey] === dayItem[idKey] && entry.date === dayItem.date && entry.failed
        );
        if (!alreadyLogged) {
            completedList.push({
                id: Date.now() + dayItem.id,
                [idKey]: dayItem[idKey],
                name: item ? item.name : nameFallback,
                emoji: item ? item.emoji : emojiFallback,
                type: item ? item.type : typeFallback,
                date: dayItem.date,
                failedDate: targetDateStr,
                failed: true,
                reason: 'Não concluído'
            });
        }
    });

    if (appData.hero.protection?.shield) {
        appData.hero.protection.shield = false;
        alert(alertShield);
        addHeroLog('penalty', logShieldTitle, logShieldContent);
        return;
    }
    
    appData.hero.lives = Math.max(0, appData.hero.lives - 1);
    streakKeys.forEach(key => {
        appData.hero.streak[key] = 0;
    });
    addAttributeXP(6, -1);
    appData.statistics[statsKey] = (appData.statistics[statsKey] || 0) + 1;
    alert(alertFail);
    addHeroLog('penalty', logFailTitle, logFailContent);
}

// Gerar atividades do dia
function generateDailyActivities() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = getLocalDateString(today);
    
    // Gerar treinos do dia
    appData.workouts.forEach(workout => {
        if (workout.days.includes(dayOfWeek)) {
            const alreadyExists = appData.dailyWorkouts.some(dw => 
                dw.workoutId === workout.id && dw.date === todayStr);
            
            if (!alreadyExists) {
                appData.dailyWorkouts.push({
                    id: Date.now() + workout.id,
                    workoutId: workout.id,
                    date: todayStr,
                    completed: false,
                    series: [null, null, null],
                    distance: null,
                    time: null,
                    feedback: ""
                });
            }
        }
    });
    
    // Gerar estudos do dia
    appData.studies.forEach(study => {
        if (study.days.includes(dayOfWeek)) {
            const alreadyExists = appData.dailyStudies.some(ds => 
                ds.studyId === study.id && ds.date === todayStr);
            
            if (!alreadyExists) {
                appData.dailyStudies.push({
                    id: Date.now() + study.id,
                    studyId: study.id,
                    date: todayStr,
                    completed: false,
                    applied: false,
                    feedback: ""
                });
            }
        }
    });
}

// Inicializar elementos da interface
function initUI() {
    // Configurar a data atual
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Configurar a data do diário
    const diaryDateElement = document.getElementById('diary-date');
    if (diaryDateElement) {
        const now = new Date();
        diaryDateElement.textContent = now.toLocaleDateString('pt-BR');
    }
    
    // Inicializar os seletores de atributos
    initAttributesSelectors();
    initClassSelectors();

    // Inicializar display do timer
    updateWorkoutTimerDisplay();

    // Inicializar opções do mês em Gestão
    populateFinanceMonthOptions();
    
    
    // Inicializar gráficos
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
}

// Inicializar eventos
function initEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            if (!tab) return;
            switchTab(tab);
            document.getElementById('mobile-more-menu')?.classList.remove('active');
        });
    });

    document.getElementById('nav-more-toggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        const menu = document.getElementById('mobile-more-menu');
        if (menu) menu.classList.toggle('active');
    });

    document.querySelectorAll('.mobile-more-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            if (tab) switchTab(tab);
            document.getElementById('mobile-more-menu')?.classList.remove('active');
        });
    });
    
    document.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const subtab = this.getAttribute('data-subtab');
            const parent = this.closest('.sub-nav').parentElement;
            switchSubTab(subtab, parent);
        });
    });

    
    // Botões de adicionar
    document.getElementById('add-book-btn')?.addEventListener('click', () => showBookModal());
    
    // Formulários
    document.getElementById('mission-form')?.addEventListener('submit', handleMissionSubmit);
    document.getElementById('workout-form')?.addEventListener('submit', handleWorkoutSubmit);
    document.getElementById('study-form')?.addEventListener('submit', handleStudySubmit);
    document.getElementById('class-form')?.addEventListener('submit', handleClassSubmit);
    document.getElementById('save-diary')?.addEventListener('click', saveDiaryEntry);
    document.getElementById('finance-form')?.addEventListener('submit', handleFinanceSubmit);
    document.getElementById('finance-month')?.addEventListener('change', updateFinanceView);
    document.getElementById('finance-filter-type')?.addEventListener('change', updateFinanceView);
    document.getElementById('finance-filter-category')?.addEventListener('input', updateFinanceView);
    
    // Controles do timer
    document.getElementById('start-workout-timer')?.addEventListener('click', startWorkoutTimer);
    document.getElementById('pause-workout-timer')?.addEventListener('click', pauseWorkoutTimer);
    document.getElementById('reset-workout-timer')?.addEventListener('click', resetWorkoutTimer);
    
    // Configurações
    document.getElementById('reset-btn')?.addEventListener('click', resetProgress);
    document.getElementById('export-btn')?.addEventListener('click', exportData);
    document.getElementById('import-btn')?.addEventListener('click', importData);
    document.getElementById('backup-btn')?.addEventListener('click', backupToDrive);

    // Calendário
    document.getElementById('cal-prev-month')?.addEventListener('click', () => {
        calendarState.month -= 1;
        if (calendarState.month < 0) {
            calendarState.month = 11;
            calendarState.year -= 1;
        }
        renderMissionsCalendar();
    });
    document.getElementById('cal-next-month')?.addEventListener('click', () => {
        calendarState.month += 1;
        if (calendarState.month > 11) {
            calendarState.month = 0;
            calendarState.year += 1;
        }
        renderMissionsCalendar();
    });
    document.getElementById('cal-rest-toggle')?.addEventListener('click', () => {
        if (!calendarState.selectedDate) return;
        toggleRestDay(calendarState.selectedDate);
    });
    document.getElementById('cal-details-filter')?.addEventListener('change', function() {
        calendarState.detailsFilter = this.value || 'all';
        if (calendarState.selectedDate) {
            renderCalendarDetails(calendarState.selectedDate);
        } else {
            resetCalendarDetails();
        }
    });
    
    // Modal
    document.querySelector('.close-modal')?.addEventListener('click', closeModal);
    document.getElementById('item-form')?.addEventListener('submit', handleItemFormSubmit);
    
    // Fechar modal ao clicar fora
    document.getElementById('item-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Mudança no tipo de missão
    document.getElementById('mission-type')?.addEventListener('change', function() {
        updateMissionForm(this.value);
    });
    
    // Botões de conclusão de treinos do dia
    document.addEventListener('click', function(e) {
        const workoutBtn = e.target.closest('.complete-workout-btn');
        if (workoutBtn) {
            const workoutDayId = parseInt(workoutBtn.getAttribute('data-id'));
            showWorkoutCompletionModal(workoutDayId);
            return;
        }
        
        const studyBtn = e.target.closest('.complete-study-btn');
        if (studyBtn) {
            const studyDayId = parseInt(studyBtn.getAttribute('data-id'));
            showStudyCompletionModal(studyDayId);
            return;
        }
        
        const bookBtn = e.target.closest('.complete-book-btn');
        if (bookBtn) {
            const bookId = parseInt(bookBtn.getAttribute('data-id'));
            completeBook(bookId);
            return;
        }
        
        const applyCheckbox = e.target.closest('.apply-study-checkbox');
        if (applyCheckbox) {
            const studyDayId = parseInt(applyCheckbox.getAttribute('data-id'));
            const studyDay = appData.dailyStudies.find(ds => ds.id === studyDayId);
            if (studyDay) {
                studyDay.applied = applyCheckbox.checked;
                saveToLocalStorage();
            }
        }
    });
    
}

// Atualizar a interface (VERSÃO ÚNICA - remover duplicata)
function updateUI(options = {}) {
    const mode = options.mode || 'full';
    const isFull = mode === 'full';
    const isActivity = mode === 'activity';
    const isShop = mode === 'shop';
    const isFinance = mode === 'finance';
    
    const shouldUpdateActivity = isFull || isActivity;
    const shouldUpdateShop = isFull || isShop;
    const shouldUpdateDiary = isFull;
    const shouldUpdateFinance = isFull || isFinance;
    const shouldUpdateCalendar = (isFull || isActivity || options.forceCalendar) && isTabActive('calendarios');

    // Atualizar informações do herói
    const primaryClass = getPrimaryClass();
    const heroClassEl = document.getElementById('hero-class');
    if (heroClassEl) {
        heroClassEl.textContent = primaryClass ? primaryClass.name : 'Sem classe';
    }
    document.getElementById('level').textContent = appData.hero.level;
    document.getElementById('current-xp').textContent = appData.hero.xp;
    document.getElementById('max-xp').textContent = appData.hero.maxXp;
    document.getElementById('xp-fill').style.width = `${(appData.hero.xp / appData.hero.maxXp) * 100}%`;
    
    // Atualizar contadores
    document.getElementById('coin-count').textContent = appData.hero.coins;
    document.getElementById('streak-count').textContent = appData.hero.streak.general;
    document.getElementById('life-count').textContent = `${appData.hero.lives}/${appData.hero.maxLives}`;
    
    // Atualizar status do escudo
    const shieldStatus = document.getElementById('shield-status');
    if (shieldStatus) {
        const hasShield = appData.hero.protection?.shield === true;
        shieldStatus.classList.toggle('active', hasShield);
        shieldStatus.classList.toggle('inactive', !hasShield);
        const shieldText = shieldStatus.querySelector('.shield-text');
        if (shieldText) {
            shieldText.textContent = hasShield ? 'Escudo ativo' : 'Sem escudo';
        }
    }
    
    // Atualizar vidas integradas
    updateIntegratedHearts();
    
    // Atualizar streaks
    updateStreaksDisplay();
    
    // Atualizar atributos
    updateAttributes();
    updateClassesList();
    updateMissionClassOptions();
    
    if (shouldUpdateActivity) {
        // Atualizar treinos (visualização)
        updateWorkoutsDisplay();
        updateWorkouts();
        
        // Atualizar estudos (visualização)
        updateStudiesDisplay();
        updateStudies();
        
        // Atualizar missões
        updateMissions();
        
        // Atualizar chefões
        updateBosses();
        
        // Atualizar estatísticas
        updateStatistics();
        
        // Atualizar logs do herói
        generateHeroLogs();
        
        // Atualizar treinos do dia
        updateDailyWorkouts();
        
        // Atualizar estudos do dia
        updateDailyStudies();
        
        // Atualizar históricos de treinos e estudos
        updateWorkoutHistory();
        updateStudyHistory();
        
        // Atualizar livros
        updateBooks();
    }
    
    if (shouldUpdateShop) {
        // Atualizar loja
        updateShop();
        
        // Atualizar inventário
        updateInventory();
        
        // Atualizar lista de itens da loja para gerenciamento
        updateShopItemsList();
    }
    
    if (shouldUpdateDiary) {
        // Atualizar diário
        updateDiary();
    }
    
    if (shouldUpdateCalendar) {
        // Atualizar calendário de missões
        renderMissionsCalendar();
    }

    if (shouldUpdateFinance) {
        updateFinanceView();
    }
    
    // Salvar dados
    saveToLocalStorage();
}

// Atualizar vidas integradas
function updateIntegratedHearts() {
    const container = document.getElementById('hearts-container');
    const countText = document.getElementById('lives-count-text');
    
    if (!container) return;
    
    container.innerHTML = '';
    const maxHearts = appData.hero.maxLives;
    const currentHearts = appData.hero.lives;
    
    for (let i = 0; i < maxHearts; i++) {
        const heart = document.createElement('div');
        heart.className = `heart-integrated ${i < currentHearts ? 'full' : 'empty'}`;
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        container.appendChild(heart);
    }
    
    if (countText) {
        countText.textContent = `${currentHearts}/${maxHearts}`;
    }
}

// Atualizar atributos
function updateAttributes() {
    const container = document.getElementById('attributes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.attributes.forEach(attr => {
        const level = Math.floor(attr.xp / 100);
        const currentXp = attr.xp % 100;
        const percentage = (currentXp / 100) * 100;
        
        const attributeCard = document.createElement('div');
        attributeCard.className = 'attribute-card';
        attributeCard.innerHTML = `
            <div class="attribute-header">
                <div class="attribute-name">
                    <span>${attr.emoji}</span>
                    <span>${attr.name}</span>
                </div>
                <div class="attribute-level">Nível ${level}</div>
            </div>
            <div class="attribute-bar">
                <div class="attribute-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        
        container.appendChild(attributeCard);
    });
}

function getPrimaryClass() {
    const primaryId = appData.hero?.primaryClassId;
    if (primaryId) {
        const primary = appData.classes?.find(c => c.id === primaryId);
        if (primary) return primary;
    }
    return appData.classes?.[0] || null;
}

function getClassNameById(classId) {
    const cls = appData.classes?.find(c => c.id === classId);
    return cls ? cls.name : '';
}

function updateClassesList() {
    const container = document.getElementById('classes-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!Array.isArray(appData.classes) || appData.classes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma classe cadastrada.</p>';
        return;
    }
    
    appData.classes.forEach(cls => {
        const level = Math.floor(cls.xp / 100);
        const currentXp = cls.xp % 100;
        const percentage = (currentXp / 100) * 100;
        const isPrimary = appData.hero?.primaryClassId === cls.id;
        
        const classCard = document.createElement('div');
        classCard.className = 'item-card';
        classCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${cls.emoji || 'ðŸ’¼'}</span>
                <div>
                    <div class="item-name">${cls.name}${isPrimary ? ' (Principal)' : ''}</div>
                    <div class="item-level">NÃ­vel ${level} - ${currentXp}/100 XP</div>
                    <div class="item-type">Progresso: ${percentage.toFixed(0)}%</div>
                </div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn" data-id="${cls.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${cls.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(classCard);
    });
    
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editClass(id);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteClass(id);
        });
    });
}

function updateMissionClassOptions() {
    const select = document.getElementById('mission-class');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Nenhuma</option>';
    
    if (Array.isArray(appData.classes)) {
        appData.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = String(cls.id);
            option.textContent = `${cls.emoji || 'ðŸ’¼'} ${cls.name}`;
            select.appendChild(option);
        });
    }
    
    if (currentValue) {
        select.value = currentValue;
    }
}


// Atualizar treinos
function updateWorkouts() {
    const container = document.getElementById('workouts-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.workouts.forEach(workout => {
        const level = Number.isFinite(workout.level) ? workout.level : Math.floor(workout.xp / 100);
        const percentage = (workout.xp % 100);
        
        const workoutCard = document.createElement('div');
        workoutCard.className = 'item-card';
        workoutCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${workout.emoji}</span>
                <div>
                    <div class="item-name">${workout.name}</div>
                    <div class="item-level">Nível ${level} - ${percentage}%</div>
                    <div class="item-type">Tipo: ${getWorkoutTypeName(workout.type)}</div>
                    ${workout.stats ? `<div class="item-stats">Recorde: ${getWorkoutStats(workout)}</div>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn" data-id="${workout.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${workout.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(workoutCard);
    });
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editWorkout(id);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteWorkout(id);
        });
    });
}

// Obter estatísticas do treino
function getWorkoutStats(workout) {
    if (workout.type === 'repeticao') {
        return `${workout.stats.bestReps || 0} repetições`;
    } else if (workout.type === 'distancia') {
        return `${workout.stats.bestDistance || 0} km`;
    } else if (workout.type === 'maior-tempo') {
        return `${workout.stats.bestTime || 0} min`;
    } else if (workout.type === 'menor-tempo') {
        return `${workout.stats.bestTime || 0} min`;
    }
    return '';
}

// Atualizar visualização de estudos (VERSÃO ÚNICA)
function updateStudiesDisplay() {
    const container = document.getElementById('studies-display');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.studies.forEach(study => {
        const level = Number.isFinite(study.level) ? study.level : Math.floor(study.xp / 100);
        const currentXp = study.xp % 100;
        const percentage = (currentXp / 100) * 100;
        
        // Converter números dos dias para nomes
        const dayNames = study.days.map(day => {
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return days[day];
        }).join(', ');
        
        const studyCard = document.createElement('div');
        studyCard.className = 'study-display-card';
        studyCard.innerHTML = `
            <div class="display-card-header">
                <div class="display-name">
                    <span class="display-emoji">${study.emoji}</span>
                    <span>${study.name}</span>
                </div>
                <div class="display-type">${study.type === 'logico' ? 'Lógico' : 'Criativo'}</div>
            </div>
            
            <div class="display-xp-bar">
                <div class="display-level">Nível ${level}</div>
                <div class="display-xp-progress">
                    <div class="display-xp-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="display-xp-text">${currentXp}/100 XP</div>
            </div>
            
            <div class="display-details">
                <div class="display-days">
                    <i class="fas fa-calendar"></i>
                    <span>${dayNames}</span>
                </div>
                ${study.stats ? `
                <div class="display-record">
                    <i class="fas fa-trophy"></i>
                    <span>Concluído: ${study.stats.completed || 0} vezes</span>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(studyCard);
    });
}

// Atualizar estudos
function updateStudies() {
    const container = document.getElementById('studies-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.studies.forEach(study => {
        const level = Number.isFinite(study.level) ? study.level : Math.floor(study.xp / 100);
        const percentage = (study.xp % 100);
        
        const studyCard = document.createElement('div');
        studyCard.className = 'item-card';
        studyCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${study.emoji}</span>
                <div>
                    <div class="item-name">${study.name}</div>
                    <div class="item-level">Nível ${level} - ${percentage}%</div>
                    <div class="item-type">Tipo: ${study.type === 'logico' ? 'Lógico' : 'Criativo'}</div>
                    ${study.stats ? `<div class="item-stats">Concluído: ${study.stats.completed || 0} vezes</div>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn" data-id="${study.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${study.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(studyCard);
    });
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editStudy(id);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteStudy(id);
        });
    });
}

// Atualizar livros
function updateBooks() {
    const container = document.getElementById('books-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = `item-card ${book.completed ? 'completed' : ''}`;
        bookCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${book.emoji}</span>
                <div>
                    <div class="item-name">${book.name}</div>
                    ${book.author ? `<div class="item-author">${book.author}</div>` : ''}
                    ${book.completed ? `<div class="item-completed">Concluído em: ${formatDate(book.dateCompleted)}</div>` : ''}
                </div>
            </div>
            <div class="item-actions">
                ${!book.completed ? `<button class="action-btn complete-book-btn" data-id="${book.id}">Concluir</button>` : ''}
                <button class="action-btn delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(bookCard);
    });
}

// Atualizar visualização de treinos (VERSÃO ÚNICA)
function updateWorkoutsDisplay() {
    const container = document.getElementById('workouts-display');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.workouts.forEach(workout => {
        const level = Number.isFinite(workout.level) ? workout.level : Math.floor(workout.xp / 100);
        const currentXp = workout.xp % 100;
        const percentage = (currentXp / 100) * 100;
        
        // Converter números dos dias para nomes
        const dayNames = workout.days.map(day => {
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return days[day];
        }).join(', ');
        
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-display-card';
        workoutCard.innerHTML = `
            <div class="display-card-header">
                <div class="display-name">
                    <span class="display-emoji">${workout.emoji}</span>
                    <span>${workout.name}</span>
                </div>
                <div class="display-type">${getWorkoutTypeName(workout.type)}</div>
            </div>
            
            <div class="display-xp-bar">
                <div class="display-level">Nível ${level}</div>
                <div class="display-xp-progress">
                    <div class="display-xp-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="display-xp-text">${currentXp}/100 XP</div>
            </div>
            
            <div class="display-details">
                <div class="display-days">
                    <i class="fas fa-calendar"></i>
                    <span>${dayNames}</span>
                </div>
                ${workout.stats ? `
                <div class="display-record">
                    <i class="fas fa-trophy"></i>
                    <span>Recorde: ${getWorkoutStats(workout)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(workoutCard);
    });
}

// Atualizar loja (VERSÃO ÚNICA)
function updateShop() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filtrar itens que o jogador pode comprar (nível mínimo)
    const availableItems = appData.shopItems.filter(item => 
        item.level <= appData.hero.level
    );
    
    if (availableItems.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum item disponível para seu nível.</p>';
        return;
    }
    
    availableItems.forEach(item => {
        const canAfford = appData.hero.coins >= item.cost;
        
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-name">
                    <span class="item-emoji">${item.emoji}</span>
                    <span>${item.name}</span>
                </div>
                <div class="shop-item-level">Nível ${item.level}+</div>
            </div>
            <div class="shop-item-body">
                <p class="shop-item-desc">${item.description}</p>
                <div class="shop-item-footer">
                    <div class="shop-item-cost">
                        <i class="fas fa-coins"></i>
                        <span>${item.cost}</span>
                    </div>
                    <button class="buy-btn" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                        ${canAfford ? 'Comprar' : 'Moedas insuficientes'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(shopItem);
    });
    
    // Adicionar eventos aos botões de compra
    container.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            buyItem(id);
        });
    });
}

// Atualizar inventário (VERSÃO ÚNICA)
function updateInventory() {
    const container = document.getElementById('inventory-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (appData.inventory.length === 0) {
        container.innerHTML = '<p class="empty-message">Inventário vazio.</p>';
        return;
    }
    
    // Agrupar itens por tipo e contar quantidades
    const itemsByType = {};
    appData.inventory.forEach(item => {
        const shopItem = appData.shopItems.find(shopItem => shopItem.id === item.id);
        if (!shopItem) return;
        
        if (!itemsByType[item.id]) {
            itemsByType[item.id] = {
                ...shopItem,
                count: 0,
                instances: []
            };
        }
        itemsByType[item.id].count++;
        itemsByType[item.id].instances.push(item);
    });
    
    // Exibir itens agrupados
    Object.values(itemsByType).forEach(item => {
        const inventoryItem = document.createElement('div');
        inventoryItem.className = 'inventory-item';
        inventoryItem.innerHTML = `
            <div class="inventory-item-header">
                <div class="inventory-item-name">
                    <span class="item-emoji">${item.emoji}</span>
                    <span>${item.name}</span>
                </div>
                <div class="inventory-item-quantity">x${item.count}</div>
            </div>
            <div class="inventory-item-body">
                <p class="inventory-item-desc">${item.description}</p>
                <button class="use-btn" data-id="${item.id}">Usar</button>
            </div>
        `;
        
        container.appendChild(inventoryItem);
    });
    
    // Adicionar eventos aos botões de uso
    container.querySelectorAll('.use-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            useItem(id);
        });
    });
}

// Adicionar evento para o formulário de item da loja
document.getElementById('shop-item-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('item-name').value;
    const emoji = document.getElementById('item-emoji').value;
    const price = parseInt(document.getElementById('item-price').value);
    const level = parseInt(document.getElementById('item-level').value);
    
    if (!name || !price) {
        alert('Por favor, preencha pelo menos nome e preço.');
        return;
    }
    
    const newItem = {
        id: appData.shopItems.length > 0 ? Math.max(...appData.shopItems.map(i => i.id)) + 1 : 1,
        name,
        emoji: emoji || '🎁',
        cost: price,
        level: level || 0,
        description: "Recompensa no mundo real",
        effect: "custom"
    };
    
    appData.shopItems.push(newItem);
    
    // Limpar formulário
    e.target.reset();
    
    // Atualizar UI
    updateUI();
    
    alert('Item cadastrado com sucesso!');
});

// Editar item da loja
function editShopItem(id) {
    const item = appData.shopItems.find(i => i.id === id);
    if (!item) return;
    
    const newName = prompt('Novo nome do item:', item.name);
    if (newName) item.name = newName;
    
    const newEmoji = prompt('Novo emoji (opcional):', item.emoji);
    if (newEmoji) item.emoji = newEmoji;
    
    const newPrice = prompt('Novo preço (moedas):', item.cost);
    if (newPrice) item.cost = parseInt(newPrice);
    
    const newLevel = prompt('Novo nível mínimo:', item.level);
    if (newLevel) item.level = parseInt(newLevel);
    
    updateUI({ mode: 'shop' });
}

// Excluir item da loja
function deleteShopItem(id) {
    if (confirm('Tem certeza que deseja excluir este item da loja?')) {
        const index = appData.shopItems.findIndex(i => i.id === id);
        if (index !== -1) {
            appData.shopItems.splice(index, 1);
            updateUI({ mode: 'shop' });
            alert('Item excluído com sucesso!');
        }
    }
}

// Função para verificar e atualizar streaks
function updateStreaks() {
    const today = getLocalDateString();
    
    // Inicializar se não existir
    if (!appData.hero.streak) {
        appData.hero.streak = {
            general: 0,
            physical: 0,
            mental: 0,
            lastGeneralCheck: null,
            lastPhysicalCheck: null,
            lastMentalCheck: null
        };
    }
    
    // Só verificar streaks se já tivermos um último check
    if (appData.hero.streak.lastGeneralCheck) {
        // Verificar se passou mais de um dia desde o último check
        const lastCheck = new Date(appData.hero.streak.lastGeneralCheck);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastCheck) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            // Mais de um dia se passou, resetar streaks
            appData.hero.streak.general = 0;
            appData.hero.streak.physical = 0;
            appData.hero.streak.mental = 0;
        } else if (diffDays === 1) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);
            // Um dia se passou, atualizar streaks com base em falhas e atividade do dia anterior
            if (hasGeneralFailure(yesterdayStr)) {
                appData.hero.streak.general = 0;
            } else if (checkDailyActivity(yesterdayStr)) {
                appData.hero.streak.general++;
            }
            if (hasWorkoutFailure(yesterdayStr)) {
                appData.hero.streak.physical = 0;
            } else if (checkWorkoutActivity(yesterdayStr)) {
                appData.hero.streak.physical++;
            }
            if (hasStudyFailure(yesterdayStr)) {
                appData.hero.streak.mental = 0;
            } else if (checkStudyActivity(yesterdayStr)) {
                appData.hero.streak.mental++;
            }
        }
    }

    // Atualizar último check
    appData.hero.streak.lastGeneralCheck = today;
    appData.hero.streak.lastPhysicalCheck = today;
    appData.hero.streak.lastMentalCheck = today;
}

// Modificar checkWorkoutActivity() e checkStudyActivity() para verificar o dia anterior:
function checkWorkoutActivity(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    return appData.dailyWorkouts.some(dw => 
        dw.date === targetDateStr && dw.completed
    );
}

// Verificar se houve atividade no dia
function checkDailyActivity(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    
    // Verificar miss??es
    const hasMission = appData.completedMissions.some(m => 
        m.completedDate === targetDateStr
    );
    
    // Verificar treinos
    const hasWorkout = appData.dailyWorkouts.some(dw => 
        dw.date === targetDateStr && dw.completed
    );
    
    // Verificar estudos
    const hasStudy = appData.dailyStudies.some(ds => 
        ds.date === targetDateStr && ds.completed
    );
    
    return hasMission || hasWorkout || hasStudy;
}

function hasWorkoutFailure(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    return appData.completedWorkouts.some(w => w.failed && w.failedDate === targetDateStr) ||
        appData.dailyWorkouts.some(dw => dw.date === targetDateStr && dw.failed);
}

function hasStudyFailure(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    return appData.completedStudies.some(s => s.failed && s.failedDate === targetDateStr) ||
        appData.dailyStudies.some(ds => ds.date === targetDateStr && ds.failed);
}

function hasGeneralFailure(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    const missionFailed = appData.completedMissions.some(m => m.failed && m.failedDate === targetDateStr);
    return missionFailed || hasWorkoutFailure(targetDateStr) || hasStudyFailure(targetDateStr);
}



// Verificar se houve estudo no dia
function checkStudyActivity(dateStr) {
    const targetDateStr = dateStr || getLocalDateString();
    return appData.dailyStudies.some(ds => 
        ds.date === targetDateStr && ds.completed
    );
}

// Atualizar lista de itens da loja para gerenciamento (VERSÃO ÚNICA)
function updateShopItemsList() {
    const container = document.getElementById('shop-items-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (appData.shopItems.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum item cadastrado.</p>';
        return;
    }
    
    appData.shopItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${item.emoji}</span>
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        <div class="item-price"><i class="fas fa-coins"></i> ${item.cost}</div>
                        <div class="item-level">Nível mínimo: ${item.level}</div>
                    </div>
                </div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(itemCard);
    });
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editShopItem(id);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteShopItem(id);
        });
    });
}


// Função para falhar uma missão
function failMission(missionId, reason = '') {
    const missionIndex = appData.missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return;
    
    const mission = appData.missions[missionIndex];
    
    // Marcar como falhada
    mission.failed = true;
    mission.failedDate = getLocalDateString();
    
    // Aplicar penalidades (escudo protege perda de vida e streak)
    const hadShield = appData.hero.protection?.shield === true;
    if (hadShield) {
        appData.hero.protection.shield = false;
    } else {
        appData.hero.lives = Math.max(0, appData.hero.lives - 1); // Perde 1 vida
        appData.hero.streak.general = 0; // Reseta streak geral
    }
    
    // Atualizar estatísticas
    appData.statistics.missionsFailed = (appData.statistics.missionsFailed || 0) + 1;
    
    // Mover para missões concluídas (com status de falha)
    appData.completedMissions.push({
        ...mission,
        completedDate: mission.failedDate,
        failed: true,
        reason: reason
    });
    
    // Remover da lista de missões ativas
    appData.missions.splice(missionIndex, 1);
    
    // Atualizar UI
    updateUI();
    
    const penaltyText = hadShield
        ? 'Escudo consumido! Você evitou perder 1 vida e streak.'
        : 'Você perdeu 1 vida e resetou o streak geral.';
    addHeroLog(
        'mission',
        `Missão falhada: ${mission.name}`,
        hadShield ? 'Escudo consumido para evitar penalidade.' : 'Perdeu 1 vida e streak geral.'
    );
    alert(`Missão "${mission.name}" falhou! ${penaltyText}`);
}

// Atualizar missões
function updateMissions() {
    updateDailyMissions();
    updateCompletedMissions();
    updateMissionsList();
}


// Atualizar missões do dia (função ajustada)
function updateDailyMissions() {
    const container = document.getElementById('daily-missions');
    if (!container) return;
    
    container.innerHTML = '';
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = getLocalDateString();
    
    // Filtrar apenas missões não concluídas e relevantes para HOJE
    const dailyMissions = appData.missions.filter(mission => {
        if (mission.completed || mission.failed) return false;
        
        // Para missões diárias: verificar se estão disponíveis HOJE
        if (mission.type === 'diaria') {
            // Se tiver availableDate, verificar se é hoje ou antes
            if (mission.availableDate) {
                return mission.availableDate <= todayStr;
            }
            // Se não tiver availableDate, verificar se foi adicionada hoje ou antes
            if (mission.dateAdded) {
                return mission.dateAdded <= todayStr;
            }
            // Se não tiver data, mostrar sempre (compatibilidade)
            return true;
        }
        
        if (mission.type === 'semanal') {
            return mission.days && mission.days.includes(dayOfWeek);
        }
        
        if (mission.type === 'eventual') {
            if (!mission.date) return false;
            const missionDateStr = getLocalDateString(parseLocalDateString(mission.date));
            return missionDateStr === todayStr;
        }
        
        if (mission.type === 'epica') {
            if (!mission.deadline) return false;
            const deadline = parseLocalDateString(mission.deadline);
            const deadlineStr = getLocalDateString(deadline);
            return deadlineStr >= todayStr;
        }
        
        return false;
    });
    
    console.log(`Missões filtradas para hoje (${todayStr}): ${dailyMissions.length}`);
    
    if (dailyMissions.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma missão para hoje. Adicione novas missões na aba de gerenciamento.</p>';
        return;
    }
    
    dailyMissions.forEach(mission => {
        const missionCard = document.createElement('div');
        missionCard.className = 'mission-card';
        
        const attributesText = mission.attributes.map(attrId => {
            const attr = appData.attributes.find(a => a.id === attrId);
            return attr ? `${attr.emoji} ${attr.name}` : '';
        }).filter(text => text).join(', ');
        const className = mission.classId ? getClassNameById(mission.classId) : '';
        const classLine = className ? `<p>Classe: ${className}</p>` : '';
        
        missionCard.innerHTML = `
            <div class="mission-header">
                <div class="mission-name">
                    <span class="mission-emoji">${mission.emoji || '🎯'}</span>
                    <span>${mission.name}</span>
                </div>
                <span class="mission-type ${mission.type}">${getMissionTypeName(mission.type)}</span>
            </div>
            <div class="mission-details">
                ${mission.type === 'epica' ? `<p>Prazo: ${formatDate(mission.deadline)}</p>` : ''}
                ${mission.type === 'eventual' ? `<p>Data: ${formatDate(mission.date)}</p>` : ''}
                ${mission.type === 'semanal' ? `<p>Dias: ${getDaysNames(mission.days)}</p>` : ''}
                ${classLine}
            </div>
            <div class="mission-attributes">
                ${attributesText ? `<p>Atributos: ${attributesText}</p>` : ''}
            </div>
            <div class="mission-actions">
                <button class="complete-btn" data-id="${mission.id}">
                    <i class="fas fa-check"></i> Concluir
                </button>
            </div>
        `;
        
        container.appendChild(missionCard);
    });
    
    // Adicionar eventos aos botões de conclusão
    container.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            showMissionCompletionModal(id);
        });
    });
}

function updateCompletedMissions() {
    const container = document.getElementById('completed-missions');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (appData.completedMissions.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma missão concluída ainda.</p>';
        return;
    }
    
    // Mostrar apenas as últimas 10 missões (concluídas ou falhadas)
    const recentMissions = appData.completedMissions.slice(-10).reverse();
    
    recentMissions.forEach(mission => {
        const missionCard = document.createElement('div');
        missionCard.className = `mission-card ${mission.failed ? 'failed' : 'completed'}`;
        
        const statusText = mission.failed ? 'FALHOU' : 'CONCLUÍDA';
        const statusClass = mission.failed ? 'failed-status' : 'completed-status';
        const rewardText = mission.failed ? 'Penalidade: -1 vida' : 
                         mission.type === 'epica' ? 'Recompensa: 20 XP + 10 moedas' : 
                         'Recompensa: 1 XP + 1 moeda';
        const className = mission.classId ? getClassNameById(mission.classId) : '';
        const classLine = className ? `<p>Classe: ${className}</p>` : '';
        
        missionCard.innerHTML = `
            <div class="mission-header">
                <div class="mission-name">
                    <span class="mission-emoji">${mission.emoji || '🎯'}</span>
                    <span>${mission.name}</span>
                </div>
                <span class="mission-status ${statusClass}">${statusText}</span>
                <span class="mission-type ${mission.type}">${getMissionTypeName(mission.type)}</span>
            </div>
            <div class="mission-details">
                <p>${mission.failed ? 'Falhou em' : 'Concluída em'}: ${formatDate(mission.completedDate || mission.failedDate)}</p>
                <p>${rewardText}</p>
                ${classLine}
                ${mission.reason ? `<p class="mission-reason">Motivo: ${mission.reason}</p>` : ''}
                ${mission.feedback ? `<p class="mission-feedback">Feedback: ${mission.feedback}</p>` : ''}
            </div>
        `;
        
        container.appendChild(missionCard);
    });
}


// Verificar missões atrasadas diariamente (função ajustada)
function checkOverdueMissions() {
    const today = new Date();
    const todayStr = getLocalDateString();
    
    // Verificar missões que já deveriam ter sido feitas
    appData.missions.forEach(mission => {
        // Verificar missões eventuais com data passada
        if (mission.type === 'eventual' && mission.date) {
            const missionDate = parseLocalDateString(mission.date);
            const missionDateStr = getLocalDateString(missionDate);
            
            // Se a data da missão é anterior a hoje e não foi concluída
            if (missionDateStr < todayStr && !mission.completed && !mission.failed) {
                // Missão eventual atrasada - falhar automaticamente
                failMission(mission.id, 'Data da missão já passou');
            }
        }
        
        // Verificar missões épicas com prazo expirado
        if (mission.type === 'epica' && mission.deadline) {
            const deadline = parseLocalDateString(mission.deadline);
            const deadlineStr = getLocalDateString(deadline);
            
            if (deadlineStr < todayStr && !mission.failed && !mission.completed) {
                // Missão épica atrasada - falhar automaticamente
                failMission(mission.id, 'Prazo expirado');
            }
        }
    });
    
    // Para missões diárias: remover as concluídas do dia anterior e recriar para hoje
    recreateDailyMissionsForToday();
}

// Atualizar lista de missões cadastradas
function updateMissionsList() {
    const container = document.getElementById('missions-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (appData.missions.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma missão cadastrada.</p>';
        return;
    }
    
    appData.missions.forEach(mission => {
        // Verificar se a missão está atrasada
        const today = new Date();
        const isOverdue = mission.type === 'epica' && 
                         mission.deadline && 
                         parseLocalDateString(mission.deadline) < today;
        const className = mission.classId ? getClassNameById(mission.classId) : '';
        const classInfo = className ? `<div class="item-type">Classe: ${className}</div>` : '';
        
        const missionCard = document.createElement('div');
        missionCard.className = `item-card ${isOverdue ? 'overdue' : ''}`;
        
        let deadlineInfo = '';
        if (mission.type === 'epica' && mission.deadline) {
            const deadline = parseLocalDateString(mission.deadline);
            const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            deadlineInfo = `<div class="mission-deadline">Prazo: ${formatDate(mission.deadline)} (${daysLeft} dias)</div>`;
        }
        
        missionCard.innerHTML = `
            <div class="item-info">
                <span class="item-emoji">${mission.emoji || '🎯'}</span>
                <div>
                    <div class="item-name">${mission.name}</div>
                    <div class="item-type">${getMissionTypeName(mission.type)}</div>
                    ${classInfo}
                    ${deadlineInfo}
                    ${isOverdue ? '<div class="overdue-warning">ATRASADA!</div>' : ''}
                </div>
            </div>
            <div class="item-actions">
                ${isOverdue ? `<button class="action-btn fail-btn" data-id="${mission.id}">Falhar</button>` : ''}
                <button class="action-btn edit-btn" data-id="${mission.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${mission.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        container.appendChild(missionCard);
    });
    
    // Adicionar eventos aos botões
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editMission(id);
        });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteMission(id);
        });
    });
    
    // Adicionar eventos aos botões de falhar
    container.querySelectorAll('.fail-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const reason = prompt('Digite o motivo da falha (opcional):');
            failMission(id, reason);
        });
    });
}
// Atualizar chefões
function updateBosses() {
    appData.bosses.forEach(boss => {
        const bossKey = boss.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const hpElement = document.getElementById(`boss-${bossKey}-hp`);
        const barElement = document.getElementById(`boss-${bossKey}-bar`);
        
        if (hpElement) {
            hpElement.textContent = boss.hp;
        }
        
        if (barElement) {
            const percentage = (boss.hp / boss.maxHp) * 100;
            barElement.style.width = `${percentage}%`;
            
            // Atualizar cor baseado na vida
            if (percentage > 50) {
                barElement.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
            } else if (percentage > 25) {
                barElement.style.background = 'linear-gradient(to right, #FF9800, #FFC107)';
            } else {
                barElement.style.background = 'linear-gradient(to right, #F44336, #FF5722)';
            }
        }
        
        // Atualizar status de derrotado
        if (boss.hp <= 0 && !boss.defeated) {
            boss.defeated = true;
            boss.bonusActive = true;
            alert(`Chefe ${boss.name} derrotado! Você ganha +1 XP de bônus em todas as atividades até a próxima restauração.`);
        }
    });
}

// Atualizar streaks display
function updateStreaksDisplay() {
    updateMaxStreaks();
    document.getElementById('streak-general').textContent = `${appData.hero.streak.general} dias`;
    document.getElementById('streak-physical').textContent = `${appData.hero.streak.physical} dias`;
    document.getElementById('streak-mental').textContent = `${appData.hero.streak.mental} dias`;

    const generalRecord = document.getElementById('streak-general-record');
    const physicalRecord = document.getElementById('streak-physical-record');
    const mentalRecord = document.getElementById('streak-mental-record');
    if (generalRecord) generalRecord.textContent = `Recorde: ${appData.statistics.maxStreakGeneral || 0} dias`;
    if (physicalRecord) physicalRecord.textContent = `Recorde: ${appData.statistics.maxStreakPhysical || 0} dias`;
    if (mentalRecord) mentalRecord.textContent = `Recorde: ${appData.statistics.maxStreakMental || 0} dias`;
}

function updateMaxStreaks() {
    if (!appData.statistics) appData.statistics = {};
    appData.statistics.maxStreakGeneral = Math.max(appData.statistics.maxStreakGeneral || 0, appData.hero.streak.general || 0);
    appData.statistics.maxStreakPhysical = Math.max(appData.statistics.maxStreakPhysical || 0, appData.hero.streak.physical || 0);
    appData.statistics.maxStreakMental = Math.max(appData.statistics.maxStreakMental || 0, appData.hero.streak.mental || 0);
}


// Atualizar estatísticas
function updateStatistics() {
    document.getElementById('stat-workouts-done').textContent = appData.statistics.workoutsDone || 0;
    document.getElementById('stat-workouts-ignored').textContent = appData.statistics.workoutsIgnored || 0;
    document.getElementById('stat-studies-done').textContent = appData.statistics.studiesDone || 0;
    document.getElementById('stat-studies-ignored').textContent = appData.statistics.studiesIgnored || 0;
    document.getElementById('stat-books-read').textContent = appData.statistics.booksRead || 0;
    document.getElementById('stat-missions-done').textContent = appData.statistics.missionsDone || 0;
    document.getElementById('stat-missions-failed').textContent = appData.statistics.missionsFailed || 0;
    document.getElementById('stat-justice-done').textContent = appData.statistics.justiceDone || 0;
    
    // Atualizar tabela de detalhes de treinos
    updateWorkoutDetailsTable();
    
    // Atualizar records
    updateRecords();
    
    // Atualizar dias produtivos
    updateProductiveDays();
}

// Atualizar tabela de detalhes de treinos
function updateWorkoutDetailsTable() {
    const tbody = document.querySelector('#workout-details-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    appData.workouts.forEach(workout => {
        const row = document.createElement('tr');
        
        let totalReps = 0;
        let totalDistance = 0;
        let totalTime = 0;
        let timesDone = 0;
        
        if (workout.stats) {
            totalReps = workout.stats.totalReps || 0;
            totalDistance = workout.stats.totalDistance || 0;
            totalTime = workout.stats.totalTime || 0;
            timesDone = workout.stats.completed || 0;
        }
        
        row.innerHTML = `
            <td>${workout.emoji} ${workout.name}</td>
            <td>${workout.type === 'repeticao' ? totalReps : '-'}</td>
            <td>${workout.type === 'distancia' ? totalDistance.toFixed(2) + ' km' : '-'}</td>
            <td>${workout.type === 'maior-tempo' || workout.type === 'menor-tempo' ? totalTime.toFixed(1) + ' min' : '-'}</td>
            <td>${timesDone}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Atualizar records
function updateRecords() {
    const container = document.getElementById('personal-records');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Records de treinos
    appData.workouts.forEach(workout => {
        if (workout.stats) {
            let recordText = '';
            
            if (workout.type === 'repeticao' && workout.stats.bestReps > 0) {
                recordText = `${workout.emoji} ${workout.name}: ${workout.stats.bestReps} repetições`;
            } else if (workout.type === 'distancia' && workout.stats.bestDistance > 0) {
                recordText = `${workout.emoji} ${workout.name}: ${workout.stats.bestDistance.toFixed(2)} km`;
            } else if ((workout.type === 'maior-tempo' || workout.type === 'menor-tempo') && workout.stats.bestTime > 0) {
                recordText = `${workout.emoji} ${workout.name}: ${workout.stats.bestTime.toFixed(1)} min`;
            }
            
            if (recordText) {
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';
                recordItem.textContent = recordText;
                container.appendChild(recordItem);
            }
        }
    });
    
    // Records de missões
    if (appData.statistics.dailyRecords && appData.statistics.dailyRecords.maxMissionsPerDay) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `🎯 Máximo de missões em um dia: ${appData.statistics.dailyRecords.maxMissionsPerDay}`;
        container.appendChild(recordItem);
    }

    // Records de estudos
    const maxStudiesPerDay = Math.max(
        0,
        ...Object.values(appData.statistics.dailyRecords || {}).map(r => r.studies || 0)
    );
    if (maxStudiesPerDay > 0) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `📚 Máximo de estudos em um dia: ${maxStudiesPerDay}`;
        container.appendChild(recordItem);
    }

    // Records de treinos
    const maxWorkoutsPerDay = Math.max(
        0,
        ...Object.values(appData.statistics.dailyRecords || {}).map(r => r.workouts || 0)
    );
    if (maxWorkoutsPerDay > 0) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `💪 Máximo de treinos em um dia: ${maxWorkoutsPerDay}`;
        container.appendChild(recordItem);
    }

    // Records de streaks
    if (appData.statistics.maxStreakGeneral) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `🔥 Maior streak geral: ${appData.statistics.maxStreakGeneral} dias`;
        container.appendChild(recordItem);
    }
    if (appData.statistics.maxStreakPhysical) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `💪 Maior streak físico: ${appData.statistics.maxStreakPhysical} dias`;
        container.appendChild(recordItem);
    }
    if (appData.statistics.maxStreakMental) {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.textContent = `📚 Maior streak mental: ${appData.statistics.maxStreakMental} dias`;
        container.appendChild(recordItem);
    }
}

// Atualizar dias produtivos
function updateProductiveDays() {
    const tbody = document.querySelector('#productive-days-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Ordenar dias por total XP
    const productiveDays = Object.entries(appData.statistics.productiveDays || {})
        .filter(([date]) => !isRestDay(date))
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => b.totalXP - a.totalXP)
        .slice(0, 10); // Top 10 dias
    
    productiveDays.forEach(day => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(day.date)}</td>
            <td>${day.missions || 0}</td>
            <td>${day.workouts || 0}</td>
            <td>${day.studies || 0}</td>
            <td>${day.totalXP || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

// Atualizar diário
function updateDiary() {
    updateDiaryEntries();
}

// Atualizar entradas do diário
function updateDiaryEntries() {
    const container = document.getElementById('diary-entries-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!diaryLoaded) {
        container.innerHTML = '<p class="empty-message">Carregando diário...</p>';
        return;
    }

    const entries = diaryDbAvailable ? diaryCache : (appData.diaryEntries || []);

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma entrada no diário ainda.</p>';
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedEntries = [...entries].sort((a, b) => parseLocalDateString(b.date) - parseLocalDateString(a.date));
    
    sortedEntries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'diary-entry';
        
        const date = parseLocalDateString(entry.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const attributesText = entry.attributes && entry.attributes.length > 0
            ? entry.attributes.map(attrId => {
                const attr = appData.attributes.find(a => a.id === attrId);
                return attr ? `${attr.emoji} ${attr.name}` : '';
            }).filter(text => text).join(', ')
            : 'Nenhum atributo selecionado';
        
        entryElement.innerHTML = `
            <div class="diary-entry-header">
                <div class="diary-entry-title">${entry.title || 'Sem título'}</div>
                <div class="diary-entry-date">${formattedDate}</div>
            </div>
            <div class="diary-entry-content">${entry.content}</div>
            <div class="diary-entry-attributes">
                <strong>Atributos:</strong> ${attributesText}
            </div>
            ${entry.xpGained ? `<div class="diary-entry-xp">XP ganho: ${entry.xpGained}</div>` : ''}
        `;
        
        container.appendChild(entryElement);
    });
}

function updateFinanceSummary() {
    const incomeEl = document.getElementById('finance-income');
    const expenseEl = document.getElementById('finance-expense');
    const balanceEl = document.getElementById('finance-balance');
    if (!incomeEl || !expenseEl || !balanceEl) return;
    
    const entries = getFinanceFilteredEntries();
    const income = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    const expense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    const balance = income - expense;
    
    const formatBRL = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    incomeEl.textContent = formatBRL(income);
    expenseEl.textContent = formatBRL(expense);
    balanceEl.textContent = formatBRL(balance);
}

function updateFinanceView() {
    updateFinanceSummary();
    renderFinanceList();
    updateFinanceCharts();
}

function renderFinanceList() {
    const list = document.getElementById('finance-list');
    if (!list) return;
    
    const entries = getFinanceFilteredEntries().sort((a, b) => parseLocalDateString(b.date) - parseLocalDateString(a.date));
    list.innerHTML = '';
    
    if (entries.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhum lançamento para os filtros selecionados.</p>';
        return;
    }
    
    const formatBRL = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = `finance-item ${entry.type}`;
        const dateLabel = formatDate(entry.date);
        const catLabel = entry.category ? ` • ${entry.category}` : '';
        const descLabel = entry.description ? ` • ${entry.description}` : '';
        item.innerHTML = `
            <div>
                <div class="finance-item-title">${entry.type === 'income' ? 'Receita' : 'Despesa'}</div>
                <div class="finance-item-meta">${dateLabel}${catLabel}${descLabel}</div>
            </div>
            <div class="finance-item-actions">
                <div class="finance-item-value">${formatBRL(entry.amount)}</div>
                <button class="finance-delete-btn" data-id="${entry.id}">Excluir</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    list.querySelectorAll('.finance-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            deleteFinanceEntry(id);
        });
    });
}

function getFinanceFilteredEntries() {
    const monthFilter = document.getElementById('finance-month')?.value || 'all';
    const typeFilter = document.getElementById('finance-filter-type')?.value || 'all';
    const categoryFilter = (document.getElementById('finance-filter-category')?.value || '').trim().toLowerCase();
    
    return appData.financeEntries.filter(entry => {
        if (monthFilter !== 'all' && getMonthKey(entry.date) !== monthFilter) return false;
        if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
        if (categoryFilter) {
            const cat = (entry.category || '').toLowerCase();
            if (!cat.includes(categoryFilter)) return false;
        }
        return true;
    });
}

function populateFinanceMonthOptions() {
    const select = document.getElementById('finance-month');
    if (!select) return;
    
    const current = getLocalDateString().slice(0, 7);
    const months = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = getLocalDateString(d).slice(0, 7);
        months.push(key);
    }
    
    select.innerHTML = '<option value="all">Todos</option>' + 
        months.map(m => `<option value="${m}">${m}</option>`).join('');
    select.value = current;
}

function updateFinanceCharts() {
    if (typeof Chart === 'undefined') return;
    
    const entries = getFinanceFilteredEntries();
    const income = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    
    const pieCtx = document.getElementById('finance-pie-chart');
    if (pieCtx) {
        if (pieCtx.chart) pieCtx.chart.destroy();
        pieCtx.chart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['rgba(124, 255, 178, 0.7)', 'rgba(255, 77, 141, 0.7)'],
                    borderColor: ['rgba(124, 255, 178, 1)', 'rgba(255, 77, 141, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#C9D1E7'
                        }
                    }
                }
            }
        });
    }
    
    const balanceCtx = document.getElementById('finance-balance-chart');
    if (balanceCtx) {
        if (balanceCtx.chart) balanceCtx.chart.destroy();
        
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(getLocalDateString(d).slice(0, 7));
        }
        
        const balances = months.map(monthKey => {
            const monthEntries = appData.financeEntries.filter(e => getMonthKey(e.date) === monthKey);
            const inc = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
            const exp = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
            return inc - exp;
        });
        
        balanceCtx.chart = new Chart(balanceCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Saldo',
                    data: balances,
                    backgroundColor: 'rgba(0, 229, 255, 0.35)',
                    borderColor: 'rgba(0, 229, 255, 0.9)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#C9D1E7' },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    },
                    x: {
                        ticks: { color: '#C9D1E7' },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#C9D1E7'
                        }
                    }
                }
            }
        });
    }

    const categoryCtx = document.getElementById('finance-category-chart');
    if (categoryCtx) {
        if (categoryCtx.chart) categoryCtx.chart.destroy();
        
        const categoryTotals = {};
        entries.forEach(e => {
            const key = (e.category || 'Sem categoria').trim() || 'Sem categoria';
            if (!categoryTotals[key]) categoryTotals[key] = 0;
            categoryTotals[key] += e.type === 'expense' ? -e.amount : e.amount;
        });
        
        const categoryLabels = Object.keys(categoryTotals);
        const categoryData = categoryLabels.map(k => categoryTotals[k]);
        
        categoryCtx.chart = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Saldo por Categoria',
                    data: categoryData,
                    backgroundColor: 'rgba(124, 92, 255, 0.35)',
                    borderColor: 'rgba(124, 92, 255, 0.9)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#C9D1E7' },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    },
                    x: {
                        ticks: { color: '#C9D1E7' },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#C9D1E7'
                        }
                    }
                }
            }
        });
    }
}

function deleteFinanceEntry(entryId) {
    if (!confirm('Deseja excluir este lançamento?')) return;
    const index = appData.financeEntries.findIndex(e => e.id === entryId);
    if (index === -1) return;
    appData.financeEntries.splice(index, 1);
    updateUI({ mode: 'finance' });
}

// Atualizar treinos do dia
function updateDailyWorkouts() {
    const container = document.getElementById('daily-workouts');
    if (!container) return;
    
    container.innerHTML = '';
    
    const today = getLocalDateString();
    const dailyWorkouts = appData.dailyWorkouts.filter(dw => dw.date === today && !dw.completed);
    
    if (dailyWorkouts.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum treino para hoje. Aproveite o descanso!</p>';
        return;
    }
    
    dailyWorkouts.forEach(workoutDay => {
        const workout = appData.workouts.find(w => w.id === workoutDay.workoutId);
        if (!workout) return;
        
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-card';
        
        let inputFields = '';
        if (workout.type === 'repeticao') {
            inputFields = `
                <div class="series-inputs">
                    <h4>Séries:</h4>
                    ${[1, 2, 3].map(i => `
                        <div class="series-input">
                            <label>Série ${i}:</label>
                            <input type="number" min="0" class="series-input-field" data-series="${i}" 
                                   value="${workoutDay.series[i-1] || ''}" placeholder="Repetições">
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (workout.type === 'distancia') {
            inputFields = `
                <div class="distance-input">
                    <label>Distância (km):</label>
                    <input type="number" min="0" step="0.1" class="distance-input-field" 
                           value="${workoutDay.distance || ''}">
                </div>
            `;
        } else if (workout.type === 'maior-tempo' || workout.type === 'menor-tempo') {
            inputFields = `
                <div class="time-input">
                    <label>Tempo (minutos):</label>
                    <input type="number" min="0" step="0.1" class="time-input-field" 
                           value="${workoutDay.time || ''}">
                </div>
            `;
        }
        
        workoutCard.innerHTML = `
            <div class="workout-header">
                <div class="workout-name">
                    <span class="workout-emoji">${workout.emoji}</span>
                    <span>${workout.name}</span>
                </div>
                <span class="workout-type ${workout.type}">${getWorkoutTypeName(workout.type)}</span>
            </div>
            <div class="workout-details">
                ${inputFields}
            </div>
            <div class="workout-actions">
                <button class="complete-workout-btn" data-id="${workoutDay.id}">
                    <i class="fas fa-check"></i> Concluir Treino
                </button>
            </div>
        `;
        
        container.appendChild(workoutCard);
    });
}

// Atualizar estudos do dia
function updateDailyStudies() {
    const container = document.getElementById('daily-studies');
    if (!container) return;
    
    container.innerHTML = '';
    
    const today = getLocalDateString();
    const dailyStudies = appData.dailyStudies.filter(ds => ds.date === today && !ds.completed);
    
    if (dailyStudies.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum estudo para hoje.</p>';
        return;
    }
    
    dailyStudies.forEach(studyDay => {
        const study = appData.studies.find(s => s.id === studyDay.studyId);
        if (!study) return;
        
        const studyCard = document.createElement('div');
        studyCard.className = 'study-card';
        
        studyCard.innerHTML = `
            <div class="study-header">
                <div class="study-name">
                    <span class="study-emoji">${study.emoji}</span>
                    <span>${study.name}</span>
                </div>
                <span class="study-type ${study.type}">${study.type === 'logico' ? 'Lógico' : 'Criativo'}</span>
            </div>
            <div class="study-details">
                <label class="applied-checkbox">
                    <input type="checkbox" class="apply-study-checkbox" data-id="${studyDay.id}" 
                           ${studyDay.applied ? 'checked' : ''}>
                    Aplicado (conhecimento usado na prática)
                </label>
            </div>
            <div class="study-actions">
                <button class="complete-study-btn" data-id="${studyDay.id}">
                    <i class="fas fa-check"></i> Concluir Estudo
                </button>
            </div>
        `;
        
        container.appendChild(studyCard);
    });
}

// Renderizar calendário de missões (diárias, semanais, eventuais e épicas)
function renderMissionsCalendar() {
    const grid = document.getElementById('cal-missions-grid');
    const title = document.getElementById('cal-month-title');
    if (!grid || !title) return;
    
    const month = calendarState.month;
    const year = calendarState.year;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    title.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    grid.innerHTML = '';
    
    // Dias do mês anterior para preencher a primeira semana
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
        const dayNumber = prevLastDay - i;
        const cell = createCalendarCell(year, month - 1, dayNumber, true);
        grid.appendChild(cell);
    }
    
    // Dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
        const cell = createCalendarCell(year, month, day, false);
        grid.appendChild(cell);
    }
    
    // Dias do próximo mês para completar a última semana
    const endWeekday = lastDay.getDay();
    const remaining = 6 - endWeekday;
    for (let i = 1; i <= remaining; i++) {
        const cell = createCalendarCell(year, month + 1, i, true);
        grid.appendChild(cell);
    }

    // Priorizar a data selecionada, se estiver no mês atual
    if (calendarState.selectedDate) {
        const selectedCell = grid.querySelector(`[data-date="${calendarState.selectedDate}"]`);
        if (selectedCell) {
            setCalendarSelection(selectedCell);
            return;
        }
    }
    
    // Selecionar automaticamente o dia de hoje, se estiver no mês atual
    const today = new Date();
    if (today.getMonth() === month && today.getFullYear() === year) {
        const todayCell = grid.querySelector(`[data-date="${getLocalDateString(today)}"]`);
        if (todayCell) {
            setCalendarSelection(todayCell);
            return;
        }
    }
    
    calendarState.selectedDate = null;
    resetCalendarDetails();
}

function createCalendarCell(year, monthIndex, dayNumber, isOtherMonth) {
    const date = new Date(year, monthIndex, dayNumber);
    const dateStr = getLocalDateString(date);
    const todayStr = getLocalDateString();
    
    const cell = document.createElement('div');
    cell.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${dateStr === todayStr ? 'today' : ''}`.trim();
    cell.dataset.date = dateStr;
    
    const markers = getCalendarMarkersForDate(date);
    const markersHtml = markers.map(type => `<span class="marker ${type}"></span>`).join('');
    
    cell.innerHTML = `
        <div class="calendar-day-number">${dayNumber}</div>
        <div class="calendar-markers">${markersHtml}</div>
    `;
    
    cell.addEventListener('click', () => {
        setCalendarSelection(cell);
    });
    
    return cell;
}

function setCalendarSelection(cell) {
    const grid = document.getElementById('cal-missions-grid');
    if (!grid) return;
    grid.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    cell.classList.add('selected');
    const dateStr = cell.dataset.date;
    if (dateStr) {
        calendarState.selectedDate = dateStr;
        renderCalendarDetails(dateStr);
    }
}

function renderCalendarDetails(dateStr) {
    const detailsTitle = document.getElementById('cal-details-title');
    const detailsList = document.getElementById('cal-details-list');
    const restStatus = document.getElementById('cal-rest-status');
    const restToggle = document.getElementById('cal-rest-toggle');
    const detailsFilter = document.getElementById('cal-details-filter');
    if (!detailsTitle || !detailsList) return;
    
    const dateObj = parseLocalDateString(dateStr);
    detailsTitle.textContent = `Detalhes de ${dateObj.toLocaleDateString('pt-BR')}`;
    
    if (restStatus && restToggle) {
        const isRest = isRestDay(dateStr);
        restStatus.textContent = isRest ? 'Descanso planejado' : 'Dia normal';
        restStatus.classList.toggle('active', isRest);
        restToggle.textContent = isRest ? 'Remover descanso' : 'Marcar descanso';
    }

    if (detailsFilter) {
        detailsFilter.value = calendarState.detailsFilter || 'all';
    }
    
    const items = getCalendarItemsForDate(dateStr);
    const filterValue = (calendarState.detailsFilter || 'all');
    const filteredItems = filterValue === 'all'
        ? items
        : items.filter(item => item.typeClass === filterValue);
    detailsList.innerHTML = '';
    
    if (filteredItems.length === 0) {
        detailsList.innerHTML = '<p class="empty-message">Nenhuma atividade para este filtro.</p>';
        return;
    }
    
    filteredItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'calendar-details-item';
        
        const statusTag = item.status === 'failed' ? 'Falhou' : item.status === 'done' ? 'Concluída' : 'Pendente';
        const statusClass = item.status === 'failed' ? 'failed' : item.status === 'done' ? 'done' : '';
        
        row.innerHTML = `
            <div class="calendar-details-title">
                <span>${item.emoji || '🎯'}</span>
                <span>${item.name}</span>
            </div>
            <div class="calendar-details-tags">
                <span class="calendar-tag kind ${item.kindClass}">${item.kindLabel}</span>
                <span class="calendar-tag ${item.typeClass}">${item.typeLabel}</span>
                <span class="calendar-tag ${statusClass}">${statusTag}</span>
            </div>
        `;
        
        detailsList.appendChild(row);
    });
}

function resetCalendarDetails() {
    const detailsTitle = document.getElementById('cal-details-title');
    const detailsList = document.getElementById('cal-details-list');
    const restStatus = document.getElementById('cal-rest-status');
    const restToggle = document.getElementById('cal-rest-toggle');
    const detailsFilter = document.getElementById('cal-details-filter');
    if (!detailsTitle || !detailsList) return;
    
    detailsTitle.textContent = 'Detalhes do dia';
    detailsList.innerHTML = '<p class="empty-message">Selecione um dia para ver as missões.</p>';
    
    if (restStatus && restToggle) {
        restStatus.textContent = 'Dia normal';
        restStatus.classList.remove('active');
        restToggle.textContent = 'Marcar descanso';
    }

    if (detailsFilter) {
        detailsFilter.value = calendarState.detailsFilter || 'all';
    }
}

function getCalendarItemsForDate(dateStr) {
    const items = [];
    const dateObj = parseLocalDateString(dateStr);
    const dayOfWeek = dateObj.getDay();
    
    // Missões ativas
    appData.missions.forEach(mission => {
        const typeInfo = getMissionTypeInfo(mission.type);
        if (!typeInfo) return;
        
        if (mission.type === 'diaria') {
            items.push({ ...typeInfo, ...mission, status: 'pending' });
        }
        
        if (mission.type === 'semanal' && mission.days && mission.days.includes(dayOfWeek)) {
            items.push({ ...typeInfo, ...mission, status: 'pending' });
        }
        
        if (mission.type === 'eventual' && mission.date) {
            const missionDateStr = getLocalDateString(parseLocalDateString(mission.date));
            if (missionDateStr === dateStr) {
                items.push({ ...typeInfo, ...mission, status: 'pending' });
            }
        }
        
        if (mission.type === 'epica' && mission.deadline) {
            const deadlineStr = getLocalDateString(parseLocalDateString(mission.deadline));
            if (dateStr <= deadlineStr) {
                items.push({ ...typeInfo, ...mission, status: 'pending' });
            }
        }
    });
    
    // Missões concluídas/falhadas
    appData.completedMissions.forEach(mission => {
        const typeInfo = getMissionTypeInfo(mission.type);
        if (!typeInfo) return;
        const completedDate = mission.completedDate || mission.failedDate;
        if (completedDate === dateStr) {
            items.push({
                ...typeInfo,
                ...mission,
                status: mission.failed ? 'failed' : 'done'
            });
        }
    });

    // Treinos do dia (agenda)
    appData.workouts.forEach(workout => {
        if (workout.days && workout.days.includes(dayOfWeek)) {
            items.push({
                kindLabel: 'Treino',
                kindClass: 'workout',
                typeLabel: getWorkoutTypeName(workout.type),
                typeClass: 'workout',
                status: 'pending',
                id: `workout-${workout.id}`,
                name: workout.name,
                emoji: workout.emoji
            });
        }
    });
    
    // Estudos do dia (agenda)
    appData.studies.forEach(study => {
        if (study.days && study.days.includes(dayOfWeek)) {
            items.push({
                kindLabel: 'Estudo',
                kindClass: 'study',
                typeLabel: study.type === 'logico' ? 'Lógico' : 'Criativo',
                typeClass: 'study',
                status: 'pending',
                id: `study-${study.id}`,
                name: study.name,
                emoji: study.emoji
            });
        }
    });
    
    // Treinos concluídos/falhados
    appData.completedWorkouts.forEach(entry => {
        if (entry.date === dateStr || entry.completedDate === dateStr || entry.failedDate === dateStr) {
            items.push({
                kindLabel: 'Treino',
                kindClass: 'workout',
                typeLabel: getWorkoutTypeName(entry.type),
                typeClass: 'workout',
                status: entry.failed ? 'failed' : 'done',
                id: `workout-${entry.workoutId}-${entry.date}`,
                name: entry.name,
                emoji: entry.emoji
            });
        }
    });
    
    // Estudos concluídos/falhados
    appData.completedStudies.forEach(entry => {
        if (entry.date === dateStr || entry.completedDate === dateStr || entry.failedDate === dateStr) {
            items.push({
                kindLabel: 'Estudo',
                kindClass: 'study',
                typeLabel: entry.type === 'logico' ? 'Lógico' : 'Criativo',
                typeClass: 'study',
                status: entry.failed ? 'failed' : 'done',
                id: `study-${entry.studyId}-${entry.date}`,
                name: entry.name,
                emoji: entry.emoji
            });
        }
    });
    
    // Remover pendentes quando há concluídas/falhadas no mesmo dia
    const doneKeys = new Set(
        items
            .filter(i => i.status !== 'pending')
            .map(i => `${i.kindLabel}-${i.name}-${dateStr}`)
    );
    
    const filtered = items.filter(i => {
        if (i.status !== 'pending') return true;
        return !doneKeys.has(`${i.kindLabel}-${i.name}-${dateStr}`);
    });
    
    // Remover duplicidade por id e status
    const byId = new Map();
    filtered.forEach(item => {
        const key = `${item.id}-${item.status}`;
        byId.set(key, item);
    });
    return Array.from(byId.values());
}

function getMissionTypeInfo(type) {
    switch(type) {
        case 'diaria':
            return { kindLabel: 'Missão', kindClass: 'kind', type: 'daily', typeLabel: 'Diária', typeClass: 'daily' };
        case 'semanal':
            return { kindLabel: 'Missão', kindClass: 'kind', type: 'weekly', typeLabel: 'Semanal', typeClass: 'weekly' };
        case 'eventual':
            return { kindLabel: 'Missão', kindClass: 'kind', type: 'eventual', typeLabel: 'Eventual', typeClass: 'eventual' };
        case 'epica':
            return { kindLabel: 'Missão', kindClass: 'kind', type: 'epic', typeLabel: 'Épica', typeClass: 'epic' };
        default:
            return null;
    }
}

function getCalendarMarkersForDate(date) {
    const markers = new Set();
    const dayOfWeek = date.getDay();
    const dateStr = getLocalDateString(date);
    
    appData.missions.forEach(mission => {
        if (mission.completed || mission.failed) return;
        
        if (mission.type === 'diaria') {
            markers.add('daily');
        }
        
        if (mission.type === 'semanal' && mission.days && mission.days.includes(dayOfWeek)) {
            markers.add('weekly');
        }
        
        if (mission.type === 'eventual' && mission.date) {
            const missionDateStr = getLocalDateString(parseLocalDateString(mission.date));
            if (missionDateStr === dateStr) {
                markers.add('eventual');
            }
        }
        
        if (mission.type === 'epica' && mission.deadline) {
            const deadlineStr = getLocalDateString(parseLocalDateString(mission.deadline));
            if (dateStr <= deadlineStr) {
                markers.add('epic');
            }
        }
    });
    
    // Treinos agendados
    if (appData.workouts.some(w => w.days && w.days.includes(dayOfWeek))) {
        markers.add('workout');
    }
    
    // Estudos agendados
    if (appData.studies.some(s => s.days && s.days.includes(dayOfWeek))) {
        markers.add('study');
    }
    
    // Descanso planejado
    if (isRestDay(dateStr)) {
        markers.add('rest');
    }
    
    return Array.from(markers);
}

function isRestDay(dateStr) {
    return appData.restDays && appData.restDays.includes(dateStr);
}

function toggleRestDay(dateStr) {
    if (!appData.restDays) appData.restDays = [];
    const index = appData.restDays.indexOf(dateStr);
    if (index >= 0) {
        appData.restDays.splice(index, 1);
        addHeroLog('rest', 'Descanso removido', `Dia ${dateStr} voltou ao normal.`);
    } else {
        const monthKey = getMonthKey(dateStr);
        const monthCount = appData.restDays.filter(d => getMonthKey(d) === monthKey).length;
        if (monthCount >= REST_DAYS_PER_MONTH_LIMIT) {
            alert(`Limite de descanso do mês atingido (${REST_DAYS_PER_MONTH_LIMIT}).`);
            return;
        }
        appData.restDays.push(dateStr);
        addHeroLog('rest', 'Descanso planejado', `Dia ${dateStr} marcado como descanso.`);
    }
    updateUI({ mode: 'activity', forceCalendar: true });
}

function getMonthKey(dateStr) {
    // dateStr no formato YYYY-MM-DD
    return dateStr.slice(0, 7);
}

function parseLocalDateString(dateStr) {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    const parts = dateStr.split('-').map(p => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return new Date(dateStr);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Atualizar histórico de treinos (concluídos e falhas)
function updateWorkoutHistory() {
    const completedContainer = document.getElementById('completed-workouts');
    if (!completedContainer) return;
    
    completedContainer.innerHTML = '';
    const allEntries = appData.completedWorkouts;
    
    if (allEntries.length === 0) {
        completedContainer.innerHTML = '<p class="empty-message">Nenhum histórico de treino ainda.</p>';
        return;
    }
    
    const recent = allEntries.slice(-30).reverse();
    const prevTotalsByEntryId = new Map();
    const lastTotalsByWorkoutId = new Map();
    const prevDistancesByEntryId = new Map();
    const lastDistancesByWorkoutId = new Map();
    allEntries.forEach(entry => {
        if (entry.failed) return;
        if (entry.type === 'repeticao' && Array.isArray(entry.series)) {
            const totalReps = entry.series.reduce((sum, val) => sum + (parseInt(val) || 0), 0);
            const prevTotal = lastTotalsByWorkoutId.get(entry.workoutId);
            if (prevTotal !== undefined) {
                prevTotalsByEntryId.set(entry.id, prevTotal);
            }
            lastTotalsByWorkoutId.set(entry.workoutId, totalReps);
        }
        if (entry.type === 'distancia' && entry.distance !== null && entry.distance !== undefined) {
            const distance = Number(entry.distance);
            if (Number.isFinite(distance)) {
                const prevDistance = lastDistancesByWorkoutId.get(entry.workoutId);
                if (prevDistance !== undefined) {
                    prevDistancesByEntryId.set(entry.id, prevDistance);
                }
                lastDistancesByWorkoutId.set(entry.workoutId, distance);
            }
        }
    });
    recent.forEach(entry => {
        const card = document.createElement('div');
        card.className = `history-card ${entry.failed ? 'failed' : ''}`.trim();
        
        const details = [];
        if (entry.failed) {
            details.push(`<p>Falhou em: ${formatDate(entry.failedDate || entry.date)}</p>`);
        } else {
            details.push(`<p>Concluído em: ${formatDate(entry.completedDate || entry.date)}</p>`);
        }
        details.push(`<p>Tipo: ${getWorkoutTypeName(entry.type)}</p>`);
        
        if (!entry.failed && entry.type === 'repeticao' && Array.isArray(entry.series)) {
            const totalReps = entry.series.reduce((sum, val) => sum + (parseInt(val) || 0), 0);
            const prevTotal = prevTotalsByEntryId.get(entry.id);
            let trend = '';
            if (prevTotal !== undefined) {
                if (totalReps > prevTotal) trend = ' <span class="trend-up">&uarr;</span>';
                else if (totalReps < prevTotal) trend = ' <span class="trend-down">&darr;</span>';
            }
            details.push(`<p>Séries: ${entry.series.map(v => v || 0).join(' / ')} (Total: ${totalReps})${trend}</p>`);
        }
        if (!entry.failed && entry.type === 'distancia' && entry.distance !== null && entry.distance !== undefined) {
            const distance = Number(entry.distance);
            let trend = '';
            const prevDistance = prevDistancesByEntryId.get(entry.id);
            if (prevDistance !== undefined && Number.isFinite(distance)) {
                if (distance > prevDistance) trend = ' <span class="trend-up">&uarr;</span>';
                else if (distance < prevDistance) trend = ' <span class="trend-down">&darr;</span>';
            }
            details.push(`<p>Distância: ${entry.distance} km${trend}</p>`);
        }
        if (!entry.failed && (entry.type === 'maior-tempo' || entry.type === 'menor-tempo') && entry.time !== null && entry.time !== undefined) {
            details.push(`<p>Tempo: ${entry.time} min</p>`);
        }
        if (entry.reason) {
            details.push(`<p class="mission-reason">Motivo: ${entry.reason}</p>`);
        }
        if (entry.feedback) {
            details.push(`<p>Feedback: ${entry.feedback}</p>`);
        }
        
        card.innerHTML = `
            <div class="history-header">
                <div class="history-title">
                    <span class="history-emoji">${entry.emoji || '💪'}</span>
                    <span>${entry.name}</span>
                </div>
                <span class="history-status ${entry.failed ? 'failed-status' : 'completed-status'}">
                    ${entry.failed ? 'FALHOU' : 'CONCLUÍDO'}
                </span>
            </div>
            <div class="history-details">
                ${details.join('')}
            </div>
        `;
        
        completedContainer.appendChild(card);
    });
}

// Atualizar histórico de estudos (concluídos e falhas)
function updateStudyHistory() {
    const completedContainer = document.getElementById('completed-studies');
    if (!completedContainer) return;
    
    completedContainer.innerHTML = '';
    const allEntries = appData.completedStudies;
    
    if (allEntries.length === 0) {
        completedContainer.innerHTML = '<p class="empty-message">Nenhum histórico de estudo ainda.</p>';
        return;
    }
    
    const recent = allEntries.slice(-30).reverse();
    recent.forEach(entry => {
        const card = document.createElement('div');
        card.className = `history-card ${entry.failed ? 'failed' : ''}`.trim();
        
        const details = [];
        if (entry.failed) {
            details.push(`<p>Falhou em: ${formatDate(entry.failedDate || entry.date)}</p>`);
        } else {
            details.push(`<p>Concluído em: ${formatDate(entry.completedDate || entry.date)}</p>`);
        }
        details.push(`<p>Tipo: ${entry.type === 'logico' ? 'Lógico' : 'Criativo'}</p>`);
        if (!entry.failed) {
            details.push(`<p>Aplicado: ${entry.applied ? 'Sim' : 'Não'}</p>`);
        }
        if (entry.reason) {
            details.push(`<p class="mission-reason">Motivo: ${entry.reason}</p>`);
        }
        if (entry.feedback) {
            details.push(`<p>Feedback: ${entry.feedback}</p>`);
        }
        
        card.innerHTML = `
            <div class="history-header">
                <div class="history-title">
                    <span class="history-emoji">${entry.emoji || '📚'}</span>
                    <span>${entry.name}</span>
                </div>
                <span class="history-status ${entry.failed ? 'failed-status' : 'completed-status'}">
                    ${entry.failed ? 'FALHOU' : 'CONCLUÍDO'}
                </span>
            </div>
            <div class="history-details">
                ${details.join('')}
            </div>
        `;
        
        completedContainer.appendChild(card);
    });
}

// Inicializar seletores de atributos
function initAttributesSelectors() {
    // Seletor para missões
    const missionAttributesContainer = document.getElementById('mission-attributes');
    if (missionAttributesContainer) {
        missionAttributesContainer.innerHTML = '';
        
        appData.attributes.forEach(attr => {
            const checkbox = document.createElement('div');
            checkbox.className = 'attribute-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="mission-attr-${attr.id}" value="${attr.id}">
                <label for="mission-attr-${attr.id}">${attr.emoji} ${attr.name}</label>
            `;
            missionAttributesContainer.appendChild(checkbox);
        });
    }
    
    // Seletor para diário
    const diaryAttributesContainer = document.getElementById('diary-attributes');
    if (diaryAttributesContainer) {
        diaryAttributesContainer.innerHTML = '';
        
        appData.attributes.forEach(attr => {
            const checkbox = document.createElement('div');
            checkbox.className = 'attribute-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="diary-attr-${attr.id}" value="${attr.id}" name="diary-attributes">
                <label for="diary-attr-${attr.id}">${attr.emoji} ${attr.name}</label>
            `;
            diaryAttributesContainer.appendChild(checkbox);
        });
    }
}

function initClassSelectors() {
    updateMissionClassOptions();
}

function isTabActive(tabId) {
    return document.getElementById(tabId)?.classList.contains('active') === true;
}

// Trocar entre abas principais
function switchTab(tabName) {
    // Remover a classe active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar a classe active à aba selecionada
    document.getElementById(tabName)?.classList.add('active');
    
    document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Atualizar a interface específica da aba
    if (tabName === 'estatisticas') {
        updateCharts();
    } else if (tabName === 'calendarios') {
        renderMissionsCalendar();
    }
}

// Trocar entre abas secundárias
function switchSubTab(subTabName, parentElement) {
    // Encontrar o container de conteúdo
    const subContent = parentElement.querySelector('.sub-content');
    if (!subContent) return;
    
    // Remover a classe active de todas as sub-abas
    subContent.querySelectorAll('.sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    parentElement.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar a classe active à sub-aba selecionada
    subContent.querySelector(`#${subTabName}`)?.classList.add('active');
    
    // Ativar o botão correspondente
    parentElement.querySelector(`.sub-nav-btn[data-subtab="${subTabName}"]`)?.classList.add('active');
}

// Mostrar modal para adicionar item
function showItemModal(itemType) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    
    if (!modal || !modalTitle || !form) return;
    
    // Limpar o formulário
    form.innerHTML = '';
    
    // Configurar título e formulário baseado no tipo de item
    let formHTML = '';
    
    switch(itemType) {
        case 'treino':
            modalTitle.textContent = 'Adicionar Novo Treino';
            formHTML = `
                <div class="form-group">
                    <label for="modal-item-name">Nome do Treino</label>
                    <input type="text" id="modal-item-name" required>
                </div>
                <div class="form-group">
                    <label for="modal-item-emoji">Emoji (opcional)</label>
                    <input type="text" id="modal-item-emoji" placeholder="💪">
                </div>
                <div class="form-group">
                    <label for="modal-item-type">Tipo de Treino</label>
                    <select id="modal-item-type" required>
                        <option value="repeticao">Repetição</option>
                        <option value="distancia">Distância</option>
                        <option value="maior-tempo">Maior Tempo</option>
                        <option value="menor-tempo">Menor Tempo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Dias da Semana</label>
                    <div class="days-selector">
                        <label class="day-checkbox"><input type="checkbox" value="0"> Dom</label>
                        <label class="day-checkbox"><input type="checkbox" value="1"> Seg</label>
                        <label class="day-checkbox"><input type="checkbox" value="2"> Ter</label>
                        <label class="day-checkbox"><input type="checkbox" value="3"> Qua</label>
                        <label class="day-checkbox"><input type="checkbox" value="4"> Qui</label>
                        <label class="day-checkbox"><input type="checkbox" value="5"> Sex</label>
                        <label class="day-checkbox"><input type="checkbox" value="6"> Sáb</label>
                    </div>
                </div>
                <input type="hidden" id="modal-item-category" value="workout">
            `;
            break;
            
        case 'estudo':
            modalTitle.textContent = 'Adicionar Novo Estudo';
            formHTML = `
                <div class="form-group">
                    <label for="modal-item-name">Nome do Estudo</label>
                    <input type="text" id="modal-item-name" required>
                </div>
                <div class="form-group">
                    <label for="modal-item-emoji">Emoji (opcional)</label>
                    <input type="text" id="modal-item-emoji" placeholder="📚">
                </div>
                <div class="form-group">
                    <label for="modal-item-type">Tipo de Estudo</label>
                    <select id="modal-item-type" required>
                        <option value="logico">Lógico</option>
                        <option value="criativo">Criativo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Dias da Semana</label>
                    <div class="days-selector">
                        <label class="day-checkbox"><input type="checkbox" value="0"> Dom</label>
                        <label class="day-checkbox"><input type="checkbox" value="1"> Seg</label>
                        <label class="day-checkbox"><input type="checkbox" value="2"> Ter</label>
                        <label class="day-checkbox"><input type="checkbox" value="3"> Qua</label>
                        <label class="day-checkbox"><input type="checkbox" value="4"> Qui</label>
                        <label class="day-checkbox"><input type="checkbox" value="5"> Sex</label>
                        <label class="day-checkbox"><input type="checkbox" value="6"> Sáb</label>
                    </div>
                </div>
                <input type="hidden" id="modal-item-category" value="study">
            `;
            break;
    }
    
    form.innerHTML = formHTML + `
        <button type="submit" class="submit-btn">Salvar</button>
    `;
    
    // Mostrar modal
    modal.classList.add('active');
}

// Mostrar modal para adicionar livro
function showBookModal() {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    
    if (!modal || !modalTitle || !form) return;
    
    modalTitle.textContent = 'Adicionar Novo Livro';
    form.innerHTML = `
        <div class="form-group">
            <label for="book-name">Nome do Livro</label>
            <input type="text" id="book-name" required>
        </div>
        <div class="form-group">
            <label for="book-author">Autor (opcional)</label>
            <input type="text" id="book-author">
        </div>
        <div class="form-group">
            <label for="book-emoji">Emoji (opcional)</label>
            <input type="text" id="book-emoji" placeholder="📖">
        </div>
        <input type="hidden" id="modal-item-category" value="book">
        <button type="submit" class="submit-btn">Salvar</button>
    `;
    
    modal.classList.add('active');
}

// Mostrar modal para conclusão de treino
function showWorkoutCompletionModal(workoutDayId) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    
    if (!modal || !modalTitle || !form) return;
    
    const workoutDay = appData.dailyWorkouts.find(dw => dw.id === workoutDayId);
    if (!workoutDay) return;
    
    const workout = appData.workouts.find(w => w.id === workoutDay.workoutId);
    if (!workout) return;
    
    modalTitle.textContent = `Concluir ${workout.name}`;
    
    let inputFields = '';
    const workoutCard = document.querySelector(`.complete-workout-btn[data-id="${workoutDayId}"]`)?.closest('.workout-card') || null;
    
    if (workout.type === 'repeticao') {
        // Obter valores dos campos de série
        const seriesInputs = workoutCard ? workoutCard.querySelectorAll('.series-input-field') : [];
        const seriesValues = seriesInputs.length > 0
            ? Array.from(seriesInputs).map(input => input.value || '0')
            : (workoutDay.series || [0, 0, 0]).map(v => v || 0);
        
        inputFields = seriesValues.map((value, index) => `
            <div class="form-group">
                <label>Série ${index + 1}: ${value} repetições</label>
                <input type="hidden" name="series-${index}" value="${value}">
            </div>
        `).join('');
    } else if (workout.type === 'distancia') {
        const distanceInput = workoutCard ? workoutCard.querySelector('.distance-input-field') : null;
        const distanceValue = distanceInput ? distanceInput.value : (workoutDay.distance ?? '0');
        
        inputFields = `
            <div class="form-group">
                <label>Distância: ${distanceValue} km</label>
                <input type="hidden" name="distance" value="${distanceValue}">
            </div>
        `;
    } else if (workout.type === 'maior-tempo' || workout.type === 'menor-tempo') {
        const timeInput = workoutCard ? workoutCard.querySelector('.time-input-field') : null;
        const timeValue = timeInput ? timeInput.value : (workoutDay.time ?? '0');
        
        inputFields = `
            <div class="form-group">
                <label>Tempo: ${timeValue} minutos</label>
                <input type="hidden" name="time" value="${timeValue}">
            </div>
        `;
    }
    
    form.innerHTML = `
        ${inputFields}
        <div class="form-group">
            <label for="workout-feedback">Feedback (opcional)</label>
            <textarea id="workout-feedback" rows="3" placeholder="Como foi o treino? O que você aprendeu?"></textarea>
        </div>
        <input type="hidden" id="workout-day-id" value="${workoutDayId}">
        <input type="hidden" id="modal-item-category" value="complete-workout">
        <button type="submit" class="submit-btn">Concluir e Salvar Feedback</button>
    `;
    
    modal.classList.add('active');
}

// Mostrar modal para conclusão de estudo
function showStudyCompletionModal(studyDayId) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    
    if (!modal || !modalTitle || !form) return;
    
    const studyDay = appData.dailyStudies.find(ds => ds.id === studyDayId);
    if (!studyDay) return;
    
    const study = appData.studies.find(s => s.id === studyDay.studyId);
    if (!study) return;
    
    modalTitle.textContent = `Concluir ${study.name}`;
    
    form.innerHTML = `
        <div class="form-group">
            <label>Status aplicado</label>
            <div class="status-chip">${studyDay.applied ? 'Aplicado' : 'Não aplicado'}</div>
        </div>
        <div class="form-group">
            <label for="study-feedback">Feedback (opcional)</label>
            <textarea id="study-feedback" rows="3" placeholder="O que você aprendeu? Como aplicou?"></textarea>
        </div>
        <input type="hidden" id="study-day-id" value="${studyDayId}">
        <input type="hidden" id="modal-item-category" value="complete-study">
        <button type="submit" class="submit-btn">Concluir e Salvar Feedback</button>
    `;
    
    modal.classList.add('active');
}

// Mostrar modal para conclusÃ£o de missÃ£o
function showMissionCompletionModal(missionId) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    
    if (!modal || !modalTitle || !form) return;
    
    const mission = appData.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    modalTitle.textContent = `Concluir ${mission.name}`;
    
    form.innerHTML = `
        <div class="form-group">
            <label for="mission-feedback">Feedback (opcional)</label>
            <textarea id="mission-feedback" rows="3" placeholder="O que foi feito? O que aprendeu?"></textarea>
        </div>
        <input type="hidden" id="mission-id" value="${missionId}">
        <input type="hidden" id="modal-item-category" value="complete-mission">
        <button type="submit" class="submit-btn">Concluir e Salvar Feedback</button>
    `;
    
    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Manipular envio do formulário de item
function handleItemFormSubmit(e) {
    e.preventDefault();
    
    const category = document.getElementById('modal-item-category').value;
    
    switch(category) {
        case 'workout':
            handleNewWorkout();
            break;
            
        case 'study':
            handleNewStudy();
            break;
            
        case 'book':
            handleNewBook();
            break;
            
        case 'complete-workout':
            handleWorkoutCompletion();
            break;
            
        case 'complete-study':
            handleStudyCompletion();
            break;

        case 'complete-mission':
            handleMissionCompletion();
            break;
    }
    
    closeModal();
}

// Manipular novo treino
function handleNewWorkout() {
    const name = document.getElementById('modal-item-name').value;
    const emoji = document.getElementById('modal-item-emoji').value;
    const type = document.getElementById('modal-item-type').value;
    
    const dayCheckboxes = document.querySelectorAll('#item-form .days-selector input[type="checkbox"]:checked');
    const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    
    const newWorkout = {
        id: appData.workouts.length > 0 ? Math.max(...appData.workouts.map(w => w.id)) + 1 : 1,
        name,
        emoji: emoji || '💪',
        type,
        days: days.length > 0 ? days : [1, 2, 3, 4, 5],
        xp: 0,
        level: 0,
        stats: {
            totalReps: 0,
            bestReps: 0,
            totalDistance: 0,
            bestDistance: 0,
            totalTime: 0,
            bestTime: 0,
            completed: 0
        }
    };
    
    appData.workouts.push(newWorkout);
    updateUI();
    alert('Treino cadastrado com sucesso!');
}

// Manipular novo estudo
function handleNewStudy() {
    const name = document.getElementById('modal-item-name').value;
    const emoji = document.getElementById('modal-item-emoji').value;
    const type = document.getElementById('modal-item-type').value;
    
    const dayCheckboxes = document.querySelectorAll('#item-form .days-selector input[type="checkbox"]:checked');
    const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    
    const newStudy = {
        id: appData.studies.length > 0 ? Math.max(...appData.studies.map(s => s.id)) + 1 : 1,
        name,
        emoji: emoji || '📚',
        type,
        days: days.length > 0 ? days : [1, 2, 3, 4, 5],
        xp: 0,
        level: 0,
        stats: {
            completed: 0,
            applied: 0
        }
    };
    
    appData.studies.push(newStudy);
    updateUI();
    alert('Estudo cadastrado com sucesso!');
}

// Manipular novo livro
function handleNewBook() {
    const name = document.getElementById('book-name').value;
    const author = document.getElementById('book-author').value;
    const emoji = document.getElementById('book-emoji').value;
    
    const newBook = {
        id: appData.books.length > 0 ? Math.max(...appData.books.map(b => b.id)) + 1 : 1,
        name,
        author: author || '',
        emoji: emoji || '📖',
        completed: false,
        dateAdded: getLocalDateString()
    };
    
    appData.books.push(newBook);
    updateUI();
    alert('Livro cadastrado com sucesso!');
}

// Manipular conclusão de treino
function handleWorkoutCompletion() {
    const workoutDayId = parseInt(document.getElementById('workout-day-id').value);
    const feedback = document.getElementById('workout-feedback')?.value || '';
    
    const workoutDay = appData.dailyWorkouts.find(dw => dw.id === workoutDayId);
    if (!workoutDay) return;
    
    const workout = appData.workouts.find(w => w.id === workoutDay.workoutId);
    if (!workout) return;
    
    // Atualizar valores
    if (workout.type === 'repeticao') {
        const series1 = parseInt(document.querySelector('input[name="series-0"]')?.value || 0);
        const series2 = parseInt(document.querySelector('input[name="series-1"]')?.value || 0);
        const series3 = parseInt(document.querySelector('input[name="series-2"]')?.value || 0);
        
        workoutDay.series = [series1, series2, series3];
        
        // Calcular total de repetições
        const totalReps = series1 + series2 + series3;
        
        // Atualizar estatísticas do treino
        if (!workout.stats) workout.stats = {};
        workout.stats.totalReps = (workout.stats.totalReps || 0) + totalReps;
        workout.stats.bestReps = Math.max(workout.stats.bestReps || 0, totalReps);
        workout.stats.completed = (workout.stats.completed || 0) + 1;
        
    } else if (workout.type === 'distancia') {
        const distance = parseFloat(document.querySelector('input[name="distance"]')?.value || 0);
        workoutDay.distance = distance;
        
        if (!workout.stats) workout.stats = {};
        workout.stats.totalDistance = (workout.stats.totalDistance || 0) + distance;
        workout.stats.bestDistance = Math.max(workout.stats.bestDistance || 0, distance);
        workout.stats.completed = (workout.stats.completed || 0) + 1;
        
    } else if (workout.type === 'maior-tempo' || workout.type === 'menor-tempo') {
        const time = parseFloat(document.querySelector('input[name="time"]')?.value || 0);
        workoutDay.time = time;
        
        if (!workout.stats) workout.stats = {};
        workout.stats.totalTime = (workout.stats.totalTime || 0) + time;
        
        if (workout.type === 'menor-tempo') {
            if (workout.stats.bestTime === undefined || time < workout.stats.bestTime) {
                workout.stats.bestTime = time;
            }
        } else {
            workout.stats.bestTime = Math.max(workout.stats.bestTime || 0, time);
        }
        workout.stats.completed = (workout.stats.completed || 0) + 1;
    }
    
    workoutDay.completed = true;
    workoutDay.feedback = feedback;
    
    // Adicionar feedback
    if (feedback) {
        appData.feedbacks.push({
            type: 'workout',
            activityId: workoutDay.workoutId,
            feedback: feedback,
            date: new Date().toISOString()
        });
    }

    // Registrar no histórico de treinos (evitar duplicidade)
    const workoutHistoryExists = appData.completedWorkouts.some(w => 
        w.workoutId === workoutDay.workoutId && w.date === workoutDay.date
    );
    if (!workoutHistoryExists) {
        appData.completedWorkouts.push({
            id: Date.now() + workoutDay.id,
            workoutId: workoutDay.workoutId,
            name: workout.name,
            emoji: workout.emoji,
            type: workout.type,
            date: workoutDay.date,
            completedDate: getLocalDateString(),
            failed: false,
            series: workoutDay.series || [null, null, null],
            distance: workoutDay.distance ?? null,
            time: workoutDay.time ?? null,
            feedback: workoutDay.feedback || ''
        });
    }
    
    // Calcular XP e recompensas
    let xpGained = 3; // XP geral base
    
    // XP de vigor (sempre)
    addAttributeXP(2, 1); // Vigor
    
    // XP adicional baseado no tipo de treino
    if (workout.type === 'menor-tempo') {
        addAttributeXP(3, 1); // Agilidade
    }
    
    if (workout.type === 'repeticao' || workout.type === 'maior-tempo') {
        addAttributeXP(1, 1); // Força
    }
    
    if (workout.type === 'distancia') {
        addAttributeXP(6, 1); // Disciplina
    }
    
    // Adicionar XP ao treino
    workout.xp += 10;
    if (workout.xp >= 100) {
        workout.xp = 0;
        workout.level++;
    }
    
    // Adicionar XP geral
    addXP(xpGained);
    
    // Adicionar moedas
    appData.hero.coins += 1;
    
    // Atualizar streak
    
    // Atualizar estatísticas
    appData.statistics.workoutsDone = (appData.statistics.workoutsDone || 0) + 1;
    
    // Atualizar dia produtivo
    updateProductiveDay(1, 0, 0, xpGained);
    
    // Causar dano ao chefe físico (5 treinos para derrotar)
    damageBoss('Físico', 20);

    addHeroLog(
        'workout',
        `Treino concluído: ${workout.name}`,
        `+${xpGained} XP, +1 moeda`
    );
    
    alert('Treino concluído com sucesso!');
    updateUI();
}

// Manipular conclusão de estudo via modal
function handleStudyCompletion() {
    const studyDayId = parseInt(document.getElementById('study-day-id').value);
    const feedback = document.getElementById('study-feedback')?.value || '';
    
    completeStudy(studyDayId, feedback);
}

// Manipular conclusÃ£o de missÃ£o via modal
function handleMissionCompletion() {
    const missionId = parseInt(document.getElementById('mission-id').value);
    const feedback = document.getElementById('mission-feedback')?.value || '';
    
    completeMission(missionId, feedback);
}

// Concluir estudo
function completeStudy(studyDayId, feedbackText = '') {
    const studyDay = appData.dailyStudies.find(ds => ds.id === studyDayId);
    if (!studyDay) return;
    
    const study = appData.studies.find(s => s.id === studyDay.studyId);
    if (!study) return;
    
    // Marcar como concluído
    studyDay.completed = true;
    studyDay.feedback = feedbackText;

    // Registrar no histórico de estudos (evitar duplicidade)
    const studyHistoryExists = appData.completedStudies.some(s => 
        s.studyId === studyDay.studyId && s.date === studyDay.date
    );
    if (!studyHistoryExists) {
        appData.completedStudies.push({
            id: Date.now() + studyDay.id,
            studyId: studyDay.studyId,
            name: study.name,
            emoji: study.emoji,
            type: study.type,
            date: studyDay.date,
            completedDate: getLocalDateString(),
            failed: false,
            applied: !!studyDay.applied,
            feedback: studyDay.feedback || ''
        });
    }

    // Adicionar feedback
    if (feedbackText) {
        appData.feedbacks.push({
            type: 'study',
            activityId: studyDay.studyId,
            feedback: feedbackText,
            date: new Date().toISOString()
        });
    }
    
    // Calcular XP
    let xpGained = 1; // XP geral base
    let knowledgeXP = 1; // XP de conhecimento base
    
    // XP de conhecimento
    addAttributeXP(12, knowledgeXP);
    
    // 3 XP de criatividade se for do tipo criativo
    if (study.type === 'criativo') {
        addAttributeXP(5, 3); // Criatividade
    }
    
    // Bônus se foi aplicado
    if (studyDay.applied) {
        xpGained += 2; // +2 XP geral
        addAttributeXP(12, 2); // +2 XP de conhecimento
        addAttributeXP(7, 3); // +3 XP de inteligência
    }
    
    // Adicionar XP ao estudo
    study.xp += 5;
    if (study.xp >= 100) {
        study.xp = 0;
        study.level++;
    }
    
    // Atualizar estatísticas do estudo
    if (!study.stats) study.stats = {};
    study.stats.completed = (study.stats.completed || 0) + 1;
    if (studyDay.applied) {
        study.stats.applied = (study.stats.applied || 0) + 1;
    }
    
    // Adicionar XP geral
    addXP(xpGained);
    
    // Adicionar moedas
    appData.hero.coins += 1;
    
    // Atualizar streak
    
    // Atualizar estatísticas
    appData.statistics.studiesDone = (appData.statistics.studiesDone || 0) + 1;
    
    // Atualizar dia produtivo
    updateProductiveDay(0, 0, 1, xpGained);
    
    // Causar dano ao chefe mental (maior se aplicado)
    const mentalDamage = studyDay.applied ? 80 : 50;
    damageBoss('Mental', mentalDamage);

    addHeroLog(
        'study',
        `Estudo concluído: ${study.name}`,
        `+${xpGained} XP, +1 moeda${studyDay.applied ? ' (aplicado)' : ''}`
    );
    
    alert('Estudo concluído com sucesso!');
    updateUI();
}

// Concluir livro
function completeBook(bookId) {
    const book = appData.books.find(b => b.id === bookId);
    if (!book) return;
    
    book.completed = true;
    book.dateCompleted = getLocalDateString();
    
    // Adicionar XP
    addXP(20); // 20 XP geral
    addAttributeXP(12, 20); // 20 XP de conhecimento
    
    // Atualizar estatísticas
    appData.statistics.booksRead = (appData.statistics.booksRead || 0) + 1;
    
    // Causar dano ao chefe mental
    damageBoss('Mental', 20);

    addHeroLog(
        'book',
        `Livro concluído: ${book.name}`,
        '+20 XP'
    );
    
    alert('Livro concluído com sucesso!');
    updateUI();
}

// Manipular envio do formulário de missão
function handleClassSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('class-name')?.value?.trim();
    const emoji = document.getElementById('class-emoji')?.value?.trim();
    if (!name) return;
    
    const newClass = {
        id: appData.classes.length > 0 ? Math.max(...appData.classes.map(c => c.id)) + 1 : 1,
        name,
        emoji: emoji || 'ðŸ’¼',
        xp: 0,
        maxXp: 100,
        level: 0
    };
    
    appData.classes.push(newClass);
    if (!appData.hero.primaryClassId) {
        appData.hero.primaryClassId = newClass.id;
    }
    
    e.target.reset();
    updateUI();
    alert('Classe cadastrada com sucesso!');
}

function handleMissionSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('mission-name').value;
    const emoji = document.getElementById('mission-emoji').value;
    const type = document.getElementById('mission-type').value;
    const classIdRaw = document.getElementById('mission-class')?.value;
    const classId = classIdRaw ? parseInt(classIdRaw) : null;
    
    // Obter atributos selecionados
    const attributeCheckboxes = document.querySelectorAll('#mission-attributes input[type="checkbox"]:checked');
    const attributes = Array.from(attributeCheckboxes).map(cb => parseInt(cb.value));
    
    const newMission = {
        id: appData.missions.length > 0 ? Math.max(...appData.missions.map(m => m.id)) + 1 : 1,
        name,
        emoji: emoji || '🎯',
        type,
        attributes,
        classId: Number.isFinite(classId) ? classId : null,
        completed: false,
        dateAdded: getLocalDateString()
    };
    
    // Adicionar campos específicos por tipo
    if (type === 'semanal') {
        const dayCheckboxes = document.querySelectorAll('#mission-days-container input[type="checkbox"]:checked');
        newMission.days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    } else if (type === 'eventual') {
        const date = document.getElementById('mission-date').value;
        newMission.date = date || getLocalDateString();
    } else if (type === 'epica') {
        const deadline = document.getElementById('mission-deadline').value;
        newMission.deadline = deadline;
    }
    
    appData.missions.push(newMission);
    
    // Limpar formulário
    e.target.reset();
    
    // Atualizar UI
    updateUI();
    
    // Mostrar mensagem de sucesso
    alert('Missão cadastrada com sucesso!');
}

// Manipular envio do formulário de treino
function handleWorkoutSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('workout-name').value;
    const emoji = document.getElementById('workout-emoji').value;
    const type = document.getElementById('workout-type').value;
    
    // Obter dias selecionados
    const dayCheckboxes = document.querySelectorAll('#workout-form .days-selector input[type="checkbox"]:checked');
    const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    
    const newWorkout = {
        id: appData.workouts.length > 0 ? Math.max(...appData.workouts.map(w => w.id)) + 1 : 1,
        name,
        emoji: emoji || '💪',
        type,
        days: days.length > 0 ? days : [1, 2, 3, 4, 5],
        xp: 0,
        level: 0,
        stats: {
            totalReps: 0,
            bestReps: 0,
            totalDistance: 0,
            bestDistance: 0,
            totalTime: 0,
            bestTime: 0,
            completed: 0
        }
    };
    
    appData.workouts.push(newWorkout);
    
    // Limpar formulário
    e.target.reset();
    
    // Atualizar UI
    updateUI();
    
    // Mostrar mensagem de sucesso
    alert('Treino cadastrado com sucesso!');
}

// Manipular envio do formulário de estudo
function handleStudySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('study-name').value;
    const emoji = document.getElementById('study-emoji').value;
    const type = document.getElementById('study-type').value;
    
    // Obter dias selecionados
    const dayCheckboxes = document.querySelectorAll('#study-form .days-selector input[type="checkbox"]:checked');
    const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));
    
    const newStudy = {
        id: appData.studies.length > 0 ? Math.max(...appData.studies.map(s => s.id)) + 1 : 1,
        name,
        emoji: emoji || '📚',
        type,
        days: days.length > 0 ? days : [1, 2, 3, 4, 5],
        xp: 0,
        level: 0,
        stats: {
            completed: 0,
            applied: 0
        }
    };
    
    appData.studies.push(newStudy);
    
    // Limpar formulário
    e.target.reset();
    
    // Atualizar UI
    updateUI();
    
    // Mostrar mensagem de sucesso
    alert('Estudo cadastrado com sucesso!');
}

function handleFinanceSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('finance-type').value;
    const amount = parseFloat(document.getElementById('finance-amount').value);
    const category = document.getElementById('finance-category').value.trim();
    const description = document.getElementById('finance-desc').value.trim();
    
    if (!type || isNaN(amount) || amount <= 0) {
        alert('Informe um valor válido.');
        return;
    }
    
    appData.financeEntries.push({
        id: Date.now(),
        type,
        amount,
        category,
        description,
        date: getLocalDateString()
    });
    
    e.target.reset();
    updateUI({ mode: 'finance' });
}

//Formulário de missão baseado no tipo
function updateMissionForm(missionType) {
    const daysContainer = document.getElementById('mission-days-container');
    const dateContainer = document.getElementById('mission-date-container');
    const deadlineContainer = document.getElementById('mission-deadline-container');
    
    // Esconder todos os containers
    daysContainer.style.display = 'none';
    dateContainer.style.display = 'none';
    deadlineContainer.style.display = 'none';
    
    // Mostrar o container apropriado
    switch(missionType) {
        case 'semanal':
            daysContainer.style.display = 'block';
            break;
        case 'eventual':
            dateContainer.style.display = 'block';
            // Usar a nova função para obter data local correta
            document.getElementById('mission-date').value = getLocalDateString();
            break;
        case 'epica':
            deadlineContainer.style.display = 'block';
            // Definir prazo padrão para uma semana a partir de hoje
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            document.getElementById('mission-deadline').value = getLocalDateString(nextWeek);
            break;
    }
}

// Completar uma missão (função corrigida - VERSÃO FINAL)
function completeMission(missionId, feedbackText = '') {
    const missionIndex = appData.missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return;
    
    const mission = appData.missions[missionIndex];
    const todayStr = getLocalDateString();

    // Marcar como concluída
    mission.completed = true;
    mission.completedDate = todayStr;

    // Registrar feedback (opcional)
    if (feedbackText) {
        mission.feedback = feedbackText;
        appData.feedbacks.push({
            type: 'mission',
            activityId: missionId,
            feedback: feedbackText,
            date: new Date().toISOString()
        });
    }
    
    // 1. PRIMEIRO: Mover para missões concluídas
    appData.completedMissions.push({...mission});
    
    // 2. SEGUNDO: Remover da lista de missões ativas (IMEDIATAMENTE)
    appData.missions.splice(missionIndex, 1);
    
    // 3. Se for missão diária, recriar para amanhã
    if (mission.type === 'diaria') {
        recreateDailyMissionForTomorrow(mission);
    }
    
    // 4. Aplicar recompensas
    let xpGained = 1;
    let coinsGained = 1;
    
    if (mission.type === 'epica') {
        xpGained = 20;
        coinsGained = 10;
        mission.attributes.forEach(attrId => {
            const attrXp = attrId === 14 ? 100 : 20;
            addAttributeXP(attrId, attrXp);
        });
    } else {
        mission.attributes.forEach(attrId => {
            const attrXp = attrId === 14 ? 20 : 1;
            addAttributeXP(attrId, attrXp);
        });
    }
    
    if (mission.classId) {
        addClassXP(mission.classId, xpGained);
    }
    
    // Adicionar XP e moedas
    addXP(xpGained);
    appData.hero.coins += coinsGained;
    
    // Atualizar estatísticas
    appData.statistics.missionsDone = (appData.statistics.missionsDone || 0) + 1;
    updateProductiveDay(0, 1, 0, xpGained);
    updateMissionRecord();
    damageBossesByAttributes(mission.attributes);

    addHeroLog(
        'mission',
        `Missão concluída: ${mission.name}`,
        `+${xpGained} XP, +${coinsGained} moeda(s)`
    );
    
    // 5. ATUALIZAR UI IMEDIATAMENTE (ANTES DO ALERT)
    updateUI({ mode: 'activity' });
    
    // 6. Mostrar mensagem
    alert(`Missão "${mission.name}" concluída! ${mission.type === 'diaria' ? 'Ela reaparecerá amanhã.' : ''}`);
    saveToLocalStorage();
}

// Recriar missão diária para o próximo dia (VERSÃO CORRIGIDA)
function recreateDailyMissionForTomorrow(originalMission) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);
    
    // Criar nova missão com os mesmos dados, mas com data DE AMANHÃ
    const newMission = {
        id: appData.missions.length > 0 ? Math.max(...appData.missions.map(m => m.id)) + 1 : 1,
        name: originalMission.name,
        emoji: originalMission.emoji || '🎯',
        type: 'diaria',
        attributes: [...originalMission.attributes],
        classId: originalMission.classId || null,
        completed: false,
        dateAdded: tomorrowStr,  // Data de amanhã
        availableDate: tomorrowStr  // NOVO: Data em que estará disponível
    };
    
    // Adicionar à lista de missões
    appData.missions.push(newMission);
    
    console.log(`Missão diária "${originalMission.name}" recriada para ${tomorrowStr} (disponível amanhã)`);
}

// Recriar missões diárias para o dia atual (VERSÃO CORRIGIDA)
function recreateDailyMissionsForToday() {
    const today = new Date();
    const todayStr = getLocalDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    // Encontrar missões diárias concluídas ontem
    const yesterdayCompletedMissions = appData.completedMissions.filter(mission => 
        mission.type === 'diaria' && 
        mission.completedDate === yesterdayStr &&
        !mission.failed
    );
    
    // Recriar cada missão diária concluída ontem
    yesterdayCompletedMissions.forEach(originalMission => {
        // Verificar se já existe uma missão igual disponível HOJE
        const alreadyExists = appData.missions.some(mission => 
            mission.type === 'diaria' && 
            mission.name === originalMission.name &&
            !mission.completed &&
            !mission.failed &&
            mission.dateAdded === todayStr  // Adicionada hoje
        );
        
        if (!alreadyExists) {
            const newMission = {
                id: appData.missions.length > 0 ? Math.max(...appData.missions.map(m => m.id)) + 1 : 1,
                name: originalMission.name,
                emoji: originalMission.emoji || '🎯',
                type: 'diaria',
                attributes: [...originalMission.attributes],
                classId: originalMission.classId || null,
                completed: false,
                dateAdded: todayStr,
                availableDate: todayStr  // Disponível HOJE
            };
            
            appData.missions.push(newMission);
            console.log(`Missão diária "${originalMission.name}" recriada para HOJE (${todayStr})`);
        }
    });
}

// Limpar missões diárias antigas que não foram completadas
function cleanupOldDailyMissions() {
    const today = new Date();
    const todayStr = getLocalDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    // Remover missões diárias com dateAdded de ontem ou anterior que não foram concluídas
    // (isso limpa missões que o usuário pulou)
    const missionsToRemove = [];
    
    appData.missions.forEach((mission, index) => {
        if (mission.type === 'diaria' && 
            !mission.completed && 
            !mission.failed &&
            mission.dateAdded && 
            mission.dateAdded < todayStr) {
            
            console.log(`Removendo missão diária antiga: ${mission.name} (adicionada em ${mission.dateAdded})`);
            missionsToRemove.unshift(index); // Adicionar no início para remover do final
        }
    });
    
    // Remover do final para não afetar índices
    missionsToRemove.forEach(index => {
        appData.missions.splice(index, 1);
    });
    
    if (missionsToRemove.length > 0) {
        console.log(`Removidas ${missionsToRemove.length} missões diárias antigas`);
    }
}

// Atualizar recorde de missões por dia
function updateMissionRecord() {
    const today = getLocalDateString();
    
    if (!appData.statistics.dailyRecords) {
        appData.statistics.dailyRecords = {};
    }
    
    if (!appData.statistics.dailyRecords[today]) {
        appData.statistics.dailyRecords[today] = { missions: 0, workouts: 0, studies: 0 };
    }
    
    appData.statistics.dailyRecords[today].missions = 
        (appData.statistics.dailyRecords[today].missions || 0) + 1;
    
    // Atualizar máximo de missões por dia
    const todayMissions = appData.statistics.dailyRecords[today].missions;
    appData.statistics.dailyRecords.maxMissionsPerDay = 
        Math.max(appData.statistics.dailyRecords.maxMissionsPerDay || 0, todayMissions);
}

// Atualizar dia produtivo
function updateProductiveDay(workouts = 0, missions = 0, studies = 0, xp = 0) {
    const today = getLocalDateString();
    
    if (!appData.statistics.productiveDays) {
        appData.statistics.productiveDays = {};
    }
    
    if (!appData.statistics.productiveDays[today]) {
        appData.statistics.productiveDays[today] = {
            workouts: 0,
            missions: 0,
            studies: 0,
            totalXP: 0
        };
    }
    
    appData.statistics.productiveDays[today].workouts += workouts;
    appData.statistics.productiveDays[today].missions += missions;
    appData.statistics.productiveDays[today].studies += studies;
    appData.statistics.productiveDays[today].totalXP += xp;
}

// Comprar item (atualizado para verificar nível)
function buyItem(itemId) {
    const item = appData.shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Verificar nível
    if (appData.hero.level < item.level) {
        alert(`Você precisa estar no nível ${item.level} para comprar este item!`);
        return;
    }
    
    // Verificar se tem moedas suficientes
    if (appData.hero.coins < item.cost) {
        alert('Moedas insuficientes!');
        return;
    }
    
    // Subtrair moedas
    appData.hero.coins -= item.cost;
    
    // Adicionar ao inventário
    appData.inventory.push({
        id: itemId,
        purchaseDate: new Date().toISOString()
    });
    
    // Atualizar UI
    updateUI({ mode: 'shop' });
    
    // Mostrar mensagem de sucesso
    alert(`${item.name} comprado com sucesso!`);
}

// Usar item do inventário (atualizado para remover apenas 1 unidade)
function useItem(itemId) {
    // Encontrar o primeiro item deste tipo no inventário
    const itemIndex = appData.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = appData.shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Remover apenas 1 unidade do inventário
    appData.inventory.splice(itemIndex, 1);
    
    // Aplicar efeito
    switch(item.effect) {
        case 'heal':
            if (appData.hero.lives < appData.hero.maxLives) {
                appData.hero.lives++;
                alert('Poção usada! Vida restaurada.');
                addHeroLog('item', 'Poção usada', '+1 vida');
            } else {
                alert('Você já está com vida máxima!');
                // Devolver ao inventário
                appData.inventory.push({ id: itemId, purchaseDate: new Date().toISOString() });
            }
            break;
            
        case 'shield':
            alert('Escudo ativado! Você está protegido contra o próximo dano e quebra de streak.');
            // Aqui você precisaria implementar a lógica de escudo
            // Por exemplo, adicionar uma flag de proteção ao herói
            if (!appData.hero.protection) appData.hero.protection = {};
            appData.hero.protection.shield = true;
            addHeroLog('item', 'Escudo ativado', 'O próximo dano e quebra de streak serão evitados.');
            break;
            
        case 'bomb':
            const bossName = prompt('Selecione o chefe para atacar:\n1. Físico\n2. Mental\n3. Social\n4. Espiritual');
            let boss;
            
            switch(bossName) {
                case '1': boss = appData.bosses.find(b => b.name === 'Físico'); break;
                case '2': boss = appData.bosses.find(b => b.name === 'Mental'); break;
                case '3': boss = appData.bosses.find(b => b.name === 'Social'); break;
                case '4': boss = appData.bosses.find(b => b.name === 'Espiritual'); break;
                default: 
                    alert('Chefe inválido!');
                    appData.inventory.push({ id: itemId, purchaseDate: new Date().toISOString() });
                    return;
            }
            
            if (boss) {
                damageBoss(boss.name, 50);
                alert(`Bomba usada! Causou 50 de dano no chefe ${boss.name}.`);
                addHeroLog('item', 'Bomba usada', `Dano de 50 no chefe ${boss.name}.`);
            }
            break;
            
        case 'custom':
            alert(`${item.name} usado! Recompensa: ${item.description}`);
            // Aqui você pode adicionar lógica personalizada para itens customizados
            addHeroLog('item', `Item usado: ${item.name}`, item.description || 'Recompensa aplicada.');
            break;
    }
    
    // Atualizar UI
    updateUI();
}

// Adicionar XP ao herói
function addXP(amount) {
    // Aplicar bônus de chefões derrotados
    const bonusMultiplier = 1 + (appData.bosses.filter(b => b.bonusActive).length * 0.01); // +1% por chefe derrotado
    const finalAmount = Math.floor(amount * bonusMultiplier);
    
    appData.hero.xp += finalAmount;
    
    // Verificar se subiu de nível
    while (appData.hero.xp >= appData.hero.maxXp) {
        appData.hero.xp -= appData.hero.maxXp;
        appData.hero.level++;
        appData.hero.maxXp = Math.floor(appData.hero.maxXp * 1.5); // Aumentar XP necessário para próximo nível
        
        // Mostrar mensagem de novo nível
        alert(`Parabéns! Você alcançou o nível ${appData.hero.level}!`);
        addHeroLog(
            'level',
            `Nível ${appData.hero.level} alcançado`,
            `Novo XP necessário: ${appData.hero.maxXp}`
        );
    }
}

// Adicionar XP a um atributo
function addAttributeXP(attributeId, amount) {
    const attribute = appData.attributes.find(a => a.id === attributeId);
    if (!attribute) return;
    
    // Aplicar bônus de chefões derrotados
    const bonusMultiplier = 1 + (appData.bosses.filter(b => b.bonusActive).length * 0.01);
    const finalAmount = Math.floor(amount * bonusMultiplier);
    
    attribute.xp += finalAmount;
    
    // Verificar se subiu de nível
    const oldLevel = Math.floor((attribute.xp - finalAmount) / 100);
    const newLevel = Math.floor(attribute.xp / 100);
    
    if (newLevel > oldLevel) {
        // Mostrar mensagem de novo nível do atributo
        console.log(`Atributo ${attribute.name} alcançou o nível ${newLevel}!`);
    }
    
    // Ajustar maxXp se necessário
    attribute.maxXp = (newLevel + 1) * 100;
}

// Causar dano aos chefões baseado em atributos
function addClassXP(classId, amount) {
    if (!Array.isArray(appData.classes)) return;
    const cls = appData.classes.find(c => c.id === classId);
    if (!cls) return;
    
    // Aplicar bÃ´nus de chefÃµes derrotados
    const bonusMultiplier = 1 + (appData.bosses.filter(b => b.bonusActive).length * 0.01);
    const finalAmount = Math.floor(amount * bonusMultiplier);
    
    cls.xp += finalAmount;
    
    const oldLevel = Math.floor((cls.xp - finalAmount) / 100);
    const newLevel = Math.floor(cls.xp / 100);
    
    if (newLevel > oldLevel) {
        console.log(`Classe ${cls.name} alcanÃ§ou o nÃ­vel ${newLevel}!`);
    }
    
    cls.maxXp = (newLevel + 1) * 100;
    cls.level = newLevel;
}

function damageBossesByAttributes(attributeIds) {
    // Contar atributos por chefe
    const bossDamage = {
        'Físico': 0,
        'Mental': 0,
        'Social': 0,
        'Espiritual': 0
    };
    
    // Mapear atributos para chefões
    attributeIds.forEach(attrId => {
        // Força, Vigor, Agilidade, Habilidade -> Físico
        if ([1, 2, 3, 4].includes(attrId)) {
            bossDamage['Físico']++;
        }
        // Criatividade, Disciplina, Inteligência, Conhecimento -> Mental
        if ([5, 6, 7, 12].includes(attrId)) {
            bossDamage['Mental']++;
        }
        // Liderança, Sociabilidade -> Social
        if ([9, 10].includes(attrId)) {
            bossDamage['Social']++;
        }
        // Fé, Justiça, Casamento -> Espiritual
        if ([8, 11, 13].includes(attrId)) {
            bossDamage['Espiritual']++;
        }
    });
    
    // Aplicar dano
    Object.entries(bossDamage).forEach(([bossName, damage]) => {
        if (damage > 0) {
            damageBoss(bossName, damage * 5);
        }
    });
}

// Causar dano a um chefe específico
function damageBoss(bossName, damage) {
    const boss = appData.bosses.find(b => b.name === bossName);
    if (!boss) return;
    
    boss.hp = Math.max(0, boss.hp - damage);
    
    // Verificar se foi derrotado
    if (boss.hp <= 0 && !boss.defeated) {
        boss.defeated = true;
        boss.bonusActive = true;
        
        // Recompensas por derrotar chefe
        addXP(20);
        if (boss.attributes && boss.attributes.length > 0) {
            boss.attributes.forEach(attrId => addAttributeXP(attrId, 10));
        }
        addHeroLog(
            'boss',
            `Chefe derrotado: ${boss.name}`,
            '+20 XP e +10 XP em cada atributo associado'
        );
        
        // Atualizar streak do tipo de chefe
        switch(bossName) {
            case 'Físico':
                appData.hero.streak.physical = 0; // Reseta streak físico ao derrotar
                break;
            case 'Mental':
                appData.hero.streak.mental = 0; // Reseta streak mental ao derrotar
                break;
            case 'Social':
                break;
            case 'Espiritual':
                break;
        }
    }
}

// Adicione esta função para gerar resumos do herói
function generateHeroLogs() {
    const container = document.getElementById('hero-logs');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!appData.heroLogs || appData.heroLogs.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum registro ainda.</p>';
        return;
    }
    
    const recentLogs = appData.heroLogs.slice(-20).reverse();
    
    recentLogs.forEach(log => {
        const logElement = document.createElement('div');
        logElement.className = `log-item ${log.type}`;
        const logDate = parseLocalDateString(log.date).toLocaleString('pt-BR');
        logElement.innerHTML = `
            <div class="log-icon">📝</div>
            <div class="log-content">
                <div class="log-title">${log.title}</div>
                <div class="log-text">${log.content}</div>
                <div class="log-text">${logDate}</div>
            </div>
        `;
        container.appendChild(logElement);
    });
}

// Inicializar gráficos
function initCharts() {
    // Esta função será chamada quando a aba de estatísticas for acessada
    console.log('Gráficos inicializados');
}

// Adicione esta função para adicionar a quarta aba com calendário

// Atualizar gráficos
function updateCharts() {
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') return;
    
    // Atualizar gráfico de atributos
    updateAttributesChart();
    
    // Atualizar gráfico de atividades
    updateActivitiesChart();
    
    // Atualizar gráfico semanal
    updateWeeklyChart();
}

// Atualizar gráfico de atributos
function updateAttributesChart() {
    const ctx = document.getElementById('attributes-chart');
    if (!ctx) return;
    
    // Destruir gráfico existente se houver
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const labels = appData.attributes.map(attr => attr.name);
    const data = appData.attributes.map(attr => attr.xp % 100); // Mostrar progresso no nível atual
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progresso dos Atributos (%)',
                data: data,
                backgroundColor: 'rgba(74, 111, 165, 0.7)',
                borderColor: 'rgba(74, 111, 165, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Progresso (%)'
                    }
                }
            }
        }
    });
}

// Atualizar gráfico de atividades
function updateActivitiesChart() {
    const ctx = document.getElementById('activities-chart');
    if (!ctx) return;
    
    // Destruir gráfico existente se houver
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const data = {
        labels: ['Missões', 'Treinos', 'Estudos', 'Livros'],
        datasets: [{
            label: 'Atividades Realizadas',
            data: [
                appData.statistics.missionsDone || 0,
                appData.statistics.workoutsDone || 0,
                appData.statistics.studiesDone || 0,
                appData.statistics.booksRead || 0
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true
        }
    });
}

// Atualizar gráfico semanal
function updateWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    
    // Destruir gráfico existente se houver
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Obter dados da última semana
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(getLocalDateString(date));
    }
    
    const missionsData = last7Days.map(date => {
        const dayData = appData.statistics.productiveDays[date];
        return dayData ? dayData.missions : 0;
    });
    
    const workoutsData = last7Days.map(date => {
        const dayData = appData.statistics.productiveDays[date];
        return dayData ? dayData.workouts : 0;
    });
    
    const studiesData = last7Days.map(date => {
        const dayData = appData.statistics.productiveDays[date];
        return dayData ? dayData.studies : 0;
    });
    
    // Formatar datas para exibição
    const labels = last7Days.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Missões',
                    data: missionsData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Treinos',
                    data: workoutsData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Estudos',
                    data: studiesData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade'
                    }
                }
            }
        }
    });
}

// Timer de treino
function startWorkoutTimer() {
    if (appData.workoutTimer.running) return;
    
    appData.workoutTimer.running = true;
    appData.workoutTimer.startTime = Date.now() - (appData.workoutTimer.time * 1000);
    
    appData.workoutTimer.interval = setInterval(() => {
        appData.workoutTimer.time = Math.floor((Date.now() - appData.workoutTimer.startTime) / 1000);
        updateWorkoutTimerDisplay();
    }, 1000);
    
    // Atualizar botões
    document.getElementById('start-workout-timer').disabled = true;
    document.getElementById('pause-workout-timer').disabled = false;
}

function pauseWorkoutTimer() {
    if (!appData.workoutTimer.running) return;
    
    appData.workoutTimer.running = false;
    clearInterval(appData.workoutTimer.interval);
    
    // Atualizar botões
    document.getElementById('start-workout-timer').disabled = false;
    document.getElementById('pause-workout-timer').disabled = true;
}

function resetWorkoutTimer() {
    appData.workoutTimer.running = false;
    appData.workoutTimer.time = 0;
    clearInterval(appData.workoutTimer.interval);
    
    updateWorkoutTimerDisplay();
    
    // Atualizar botões
    document.getElementById('start-workout-timer').disabled = false;
    document.getElementById('pause-workout-timer').disabled = true;
}

function updateWorkoutTimerDisplay() {
    const timerElement = document.getElementById('workout-timer');
    if (!timerElement) return;
    
    const hours = Math.floor(appData.workoutTimer.time / 3600);
    const minutes = Math.floor((appData.workoutTimer.time % 3600) / 60);
    const seconds = appData.workoutTimer.time % 60;
    
    timerElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Atualizar contador para meia-noite
function updateMidnightCountdown() {
    const countdownElement = document.getElementById('midnight-countdown');
    if (!countdownElement) return;
    
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    countdownElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Atualizar data atual
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;
    
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Salvar entrada no diário
async function saveDiaryEntry() {
    const title = document.getElementById('diary-title').value;
    const content = document.getElementById('diary-content').value;
    
    if (!content.trim()) {
        alert('Por favor, escreva algo no diário.');
        return;
    }
    
    // Obter atributos selecionados
    const attributeCheckboxes = document.querySelectorAll('#diary-attributes input[type="checkbox"]:checked');
    const attributes = Array.from(attributeCheckboxes).map(cb => parseInt(cb.value));
    
    // Limitar a 3 atributos
    const selectedAttributes = attributes.slice(0, 3);
    
    const newEntry = {
        id: Date.now(),
        title: title || 'Sem título',
        content,
        attributes: selectedAttributes,
        date: new Date().toISOString(),
        xpGained: selectedAttributes.length * 5 // 5 XP por atributo
    };
    
    await saveDiaryEntryToStorage(newEntry);
    
    // Adicionar XP aos atributos selecionados
    selectedAttributes.forEach(attrId => {
        addAttributeXP(attrId, 5);
    });
    
    // Adicionar XP geral
    addXP(selectedAttributes.length * 2); // 2 XP geral por atributo
    
    // Limpar formulário
    document.getElementById('diary-title').value = '';
    document.getElementById('diary-content').value = '';
    
    // Desmarcar checkboxes
    attributeCheckboxes.forEach(cb => cb.checked = false);
    
    // Atualizar UI
    updateUI();
    
    // Mostrar mensagem de sucesso
    alert('Entrada do diário salva com sucesso!');
}

// Resetar progresso
function resetProgress() {
    if (confirm('Tem certeza que deseja resetar todo o progresso? Isso não pode ser desfeito.')) {
        // Limpar localStorage
        localStorage.removeItem('heroJourneyData');
        if (diaryDbAvailable) {
            replaceDiaryEntriesInDB([]).finally(() => {
                location.reload();
            });
            return;
        }
        // Recarregar a página
        location.reload();
    }
}

// Exportar dados
async function exportData() {
    const diaryEntries = diaryDbAvailable ? await getAllDiaryEntriesFromDB() : (appData.diaryEntries || []);
    const dataToExport = { ...appData, diaryEntries };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hero-journey-data-${getLocalDateString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Dados exportados com sucesso!');
}

// Importar dados
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validar dados importados
                if (!importedData.hero || !importedData.attributes) {
                    throw new Error('Arquivo inválido');
                }
                
                const importedDiaryEntries = Array.isArray(importedData.diaryEntries) ? importedData.diaryEntries : [];

                // Substituir dados atuais
                Object.assign(appData, importedData);
                ensureCoreAttributes();
                ensureClasses();
                ensureStartingLevels();
                populateFinanceMonthOptions();

                if (diaryDbAvailable) {
                    await replaceDiaryEntriesInDB(importedDiaryEntries);
                    await refreshDiaryCache();
                    appData.diaryEntries = [];
                } else {
                    appData.diaryEntries = importedDiaryEntries;
                    diaryCache = appData.diaryEntries;
                    diaryLoaded = true;
                }
                
                // Salvar no localStorage
                saveToLocalStorage();
                
                // Atualizar UI
                updateUI();
                
                alert('Dados importados com sucesso!');
            } catch (error) {
                alert('Erro ao importar dados: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Backup no Google Drive (simulação)
function backupToDrive() {
    // Esta é uma simulação - em um aplicativo real, você usaria a API do Google Drive
    alert('Em um aplicativo real, esta função enviaria os dados para o Google Drive. Por enquanto, use a função de exportação para salvar seus dados localmente.');
}

// Funções auxiliares
function getWorkoutTypeName(type) {
    const types = {
        'repeticao': 'Repetição',
        'distancia': 'Distância',
        'maior-tempo': 'Maior Tempo',
        'menor-tempo': 'Menor Tempo'
    };
    return types[type] || type;
}

function getMissionTypeName(type) {
    const types = {
        'diaria': 'Diária',
        'semanal': 'Semanal',
        'eventual': 'Eventual',
        'epica': 'Épica'
    };
    return types[type] || type;
}

function getMonthName(monthIndex) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthIndex] || '';
}

function getDaysNames(dayNumbers) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dayNumbers.map(num => days[num]).join(', ');
}

//função para corrigir a data
function getLocalDateString(date = new Date()) {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = parseLocalDateString(dateString);
    
    // Corrigir fuso horário
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    
    return localDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function editNamedEmojiItem(config) {
    const { list, id, namePrompt, emojiPrompt, updateMode } = config;
    const item = list.find(i => i.id === id);
    if (!item) return;
    
    const newName = prompt(namePrompt, item.name);
    if (newName) item.name = newName;
    
    const newEmoji = prompt(emojiPrompt, item.emoji);
    if (newEmoji) item.emoji = newEmoji;
    
    updateUI({ mode: updateMode });
}

function deleteNamedEmojiItem(config) {
    const { list, id, confirmText, successText, updateMode } = config;
    if (!confirm(confirmText)) return;
    
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return;
    
    list.splice(index, 1);
    updateUI({ mode: updateMode });
    alert(successText);
}

// Editar e excluir funções (implementações básicas)
function editWorkout(id) {
    editNamedEmojiItem({
        list: appData.workouts,
        id,
        namePrompt: 'Novo nome do treino:',
        emojiPrompt: 'Novo emoji (opcional):',
        updateMode: 'activity'
    });
}

function deleteWorkout(id) {
    deleteNamedEmojiItem({
        list: appData.workouts,
        id,
        confirmText: 'Tem certeza que deseja excluir este treino?',
        successText: 'Treino excluído com sucesso!',
        updateMode: 'activity'
    });
}

function editStudy(id) {
    editNamedEmojiItem({
        list: appData.studies,
        id,
        namePrompt: 'Novo nome do estudo:',
        emojiPrompt: 'Novo emoji (opcional):',
        updateMode: 'activity'
    });
}

function deleteStudy(id) {
    deleteNamedEmojiItem({
        list: appData.studies,
        id,
        confirmText: 'Tem certeza que deseja excluir este estudo?',
        successText: 'Estudo excluído com sucesso!',
        updateMode: 'activity'
    });
}

function editMission(id) {
    editNamedEmojiItem({
        list: appData.missions,
        id,
        namePrompt: 'Novo nome da missão:',
        emojiPrompt: 'Novo emoji (opcional):',
        updateMode: 'activity'
    });
}

function deleteMission(id) {
    deleteNamedEmojiItem({
        list: appData.missions,
        id,
        confirmText: 'Tem certeza que deseja excluir esta missão?',
        successText: 'Missão excluída com sucesso!',
        updateMode: 'activity'
    });
}

// Aplicar penalidades por não conclusão (deve ser chamada diariamente)
function editClass(id) {
    editNamedEmojiItem({
        list: appData.classes,
        id,
        namePrompt: 'Novo nome da classe:',
        emojiPrompt: 'Novo emoji (opcional):',
        updateMode: 'activity'
    });
}

function deleteClass(id) {
    if (!confirm('Tem certeza que deseja excluir esta classe?')) return;
    
    const index = appData.classes.findIndex(c => c.id === id);
    if (index === -1) return;
    
    appData.classes.splice(index, 1);
    
    appData.missions.forEach(m => {
        if (m.classId === id) m.classId = null;
    });
    appData.completedMissions.forEach(m => {
        if (m.classId === id) m.classId = null;
    });
    
    if (appData.hero.primaryClassId === id) {
        appData.hero.primaryClassId = appData.classes[0]?.id || null;
    }
    
    updateUI({ mode: 'activity' });
    alert('Classe excluÃ­da com sucesso!');
}

function applyPenalties(dateStr = getLocalDateString()) {
    const targetDateStr = dateStr;
    
    if (isRestDay(targetDateStr)) {
        return;
    }
    
    applyActivityPenalties({
        targetDateStr,
        dailyList: appData.dailyWorkouts,
        itemList: appData.workouts,
        completedList: appData.completedWorkouts,
        idKey: 'workoutId',
        nameFallback: 'Treino',
        emojiFallback: '💪',
        typeFallback: 'repeticao',
        statsKey: 'workoutsIgnored',
        streakKeys: ['general', 'physical'],
        alertFail: 'Você perdeu 1 vida por não completar treinos! Streak físico quebrado.',
        alertShield: 'Escudo consumido! Você evitou perder 1 vida e streaks.',
        logShieldTitle: 'Escudo consumido',
        logShieldContent: 'Treino não concluído, penalidade evitada.',
        logFailTitle: 'Treino não concluído',
        logFailContent: 'Perdeu 1 vida, streaks e -1 Disciplina.'
    });
    
    applyActivityPenalties({
        targetDateStr,
        dailyList: appData.dailyStudies,
        itemList: appData.studies,
        completedList: appData.completedStudies,
        idKey: 'studyId',
        nameFallback: 'Estudo',
        emojiFallback: '📚',
        typeFallback: 'logico',
        statsKey: 'studiesIgnored',
        streakKeys: ['general', 'mental'],
        alertFail: 'Você perdeu 1 vida por não completar estudos! Streak mental quebrado.',
        alertShield: 'Escudo consumido! Você evitou perder 1 vida e streaks.',
        logShieldTitle: 'Escudo consumido',
        logShieldContent: 'Estudo não concluído, penalidade evitada.',
        logFailTitle: 'Estudo não concluído',
        logFailContent: 'Perdeu 1 vida, streaks e -1 Disciplina.'
    });
    
    updateUI({ mode: 'activity' });
}







