"use strict";

/* =========================================================
   ASCEND — ОСНОВНАЯ ЛОГИКА
========================================================= */

const TASKS_KEY = "ASCEND_TASKS_RU_V1";
const USER_KEY = "ASCEND_USERNAME_RU_V1";

let tasks = [];
let username = "ASCENDER";

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let toastTimer = null;


/* =========================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function pad(number) {
    return String(number).padStart(2, "0");
}

function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayKey() {
    return dateKey(new Date());
}

function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   УВЕДОМЛЕНИЕ
========================================================= */

function toast(message) {

    const element = $("#toast");

    if (!element) return;

    element.textContent = message;

    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 2200);
}


/* =========================================================
   СОХРАНЕНИЕ
========================================================= */

function saveTasks() {

    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}

function loadTasks() {

    try {

        const saved =
            localStorage.getItem(TASKS_KEY);

        if (!saved) {
            tasks = [];
            return;
        }

        const parsed =
            JSON.parse(saved);

        tasks =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(error);

        tasks = [];
    }
}

function saveUsername() {

    localStorage.setItem(
        USER_KEY,
        username
    );
}

function loadUsername() {

    const saved =
        localStorage.getItem(USER_KEY);

    if (
        saved &&
        saved.trim()
    ) {
        username = saved.trim();
    }
}


/* =========================================================
   СОЗДАНИЕ ЗАДАЧИ
========================================================= */

function createTask(
    title,
    category,
    priority,
    repeat,
    days
) {

    return {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .slice(2),

        title:
            title.trim(),

        category,

        priority,

        repeat,

        days,

        createdAt:
            todayKey(),

        completed: {}

    };
}


/* =========================================================
   ДОСТУПНОСТЬ ЗАДАЧИ
========================================================= */

function taskAvailableOn(task, key) {

    if (!task || !task.createdAt) {
        return false;
    }

    const targetDate =
        parseDate(key);

    const createdDate =
        parseDate(task.createdAt);

    if (targetDate < createdDate) {
        return false;
    }

    if (task.repeat === "once") {
        return key === task.createdAt;
    }

    if (task.repeat === "daily") {
        return true;
    }

    if (task.repeat === "weekdays") {

        const day =
            targetDate.getDay();

        return day >= 1 && day <= 5;
    }

    if (task.repeat === "custom") {

        const day =
            targetDate.getDay();

        return (
            Array.isArray(task.days) &&
            task.days.includes(day)
        );
    }

    return false;
}

function tasksForDate(key) {

    return tasks.filter(
        task => taskAvailableOn(task, key)
    );
}


/* =========================================================
   ПРОГРЕСС
========================================================= */

function progressForDate(key) {

    const list =
        tasksForDate(key);

    const total =
        list.length;

    if (total === 0) {

        return {
            completed: 0,
            total: 0,
            percent: 0
        };
    }

    const completed =
        list.filter(task => {

            return (
                task.completed &&
                task.completed[key] === true
            );

        }).length;

    const percent =
        Math.round(
            completed / total * 100
        );

    return {
        completed,
        total,
        percent
    };
}


/* =========================================================
   ВЫПОЛНЕНИЕ ЗАДАЧИ
========================================================= */

function toggleTask(taskId, key) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    if (!task.completed) {
        task.completed = {};
    }

    task.completed[key] =
        task.completed[key] !== true;

    saveTasks();

    renderEverything();

    if (task.completed[key]) {
        toast("Задача выполнена.");
    } else {
        toast("Выполнение отменено.");
    }
}


/* =========================================================
   УДАЛЕНИЕ
========================================================= */

function deleteTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    tasks =
        tasks.filter(
            item => item.id !== taskId
        );

    saveTasks();

    renderEverything();

    toast("Задача удалена.");
}


/* =========================================================
   ТЕКСТ ПОВТОРЕНИЯ
========================================================= */

function repeatText(task) {

    if (task.repeat === "once") {
        return "Один раз";
    }

    if (task.repeat === "daily") {
        return "Каждый день";
    }

    if (task.repeat === "weekdays") {
        return "По будням";
    }

    if (task.repeat === "custom") {

        const names = [
            "Вс",
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт",
            "Сб"
        ];

        if (!Array.isArray(task.days)) {
            return "Свои дни";
        }

        return task.days
            .sort((a, b) => a - b)
            .map(day => names[day])
            .join(", ");
    }

    return "";
}


/* =========================================================
   HTML ЗАДАЧИ
========================================================= */

function taskHTML(task, key) {

    const completed =
        task.completed &&
        task.completed[key] === true;

    return `
        <div class="task ${completed ? "completed" : ""}">

            <button
                type="button"
                class="check"
                data-action="toggle"
                data-id="${escapeHTML(task.id)}"
                data-date="${escapeHTML(key)}">

                ${completed ? "✓" : ""}

            </button>

            <div class="task-content">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">
                    ${escapeHTML(task.category)}
                    ·
                    ${escapeHTML(task.priority)}
                    ·
                    ${escapeHTML(repeatText(task))}
                </div>

            </div>

            <button
                type="button"
                class="delete"
                data-action="delete"
                data-id="${escapeHTML(task.id)}"
                title="Удалить задачу">

                ×

            </button>

        </div>
    `;
}


/* =========================================================
   ЗАДАЧИ СЕГОДНЯ
========================================================= */

function renderTodayTasks() {

    const container =
        $("#todayTasks");

    if (!container) return;

    const key =
        todayKey();

    const list =
        tasksForDate(key);

    if (list.length === 0) {

        container.innerHTML = `
            <div class="empty">
                На сегодня задач нет.
            </div>
        `;

        return;
    }

    container.innerHTML =
        list
            .map(task =>
                taskHTML(task, key)
            )
            .join("");
}


/* =========================================================
   ВСЕ ЗАДАЧИ
========================================================= */

function renderAllTasks() {

    const container =
        $("#allTasks");

    if (!container) return;

    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty">
                У тебя пока нет задач.
            </div>
        `;

        return;
    }

    const key =
        todayKey();

    container.innerHTML =
        tasks
            .map(task =>
                taskHTML(task, key)
            )
            .join("");
}


/* =========================================================
   ГЛАВНАЯ
========================================================= */

function renderDashboard() {

    const key =
        todayKey();

    const progress =
        progressForDate(key);

    $("#dailyPercent").textContent =
        progress.percent;

    $("#taskCount").textContent =
        progress.total;

    $("#sidebarPercent").textContent =
        progress.percent;

    $("#sidebarFill").style.width =
        `${progress.percent}%`;

    $("#circleNumber").textContent =
        `${progress.percent}%`;


    const circle =
        $("#progressCircle");

    const degrees =
        progress.percent * 3.6;

    circle.style.background = `
        radial-gradient(
            circle,
            #101010 63%,
            transparent 64%
        ),
        conic-gradient(
            white ${degrees}deg,
            #222 ${degrees}deg
        )
    `;


    let message =
        "Начни свой день.";

    if (progress.percent >= 100) {

        message =
            "Идеальный день. Ты сделал это.";

    } else if (progress.percent >= 75) {

        message =
            "Почти готово. Дожми.";

    } else if (progress.percent >= 50) {

        message =
            "Половина позади. Не останавливайся.";

    } else if (progress.percent > 0) {

        message =
            "Хорошее начало. Продолжай.";

    }

    $("#progressMessage").textContent =
        message;

    renderTodayTasks();
}


/* =========================================================
   ОЧКИ
========================================================= */

function calculateScore() {

    let score = 0;

    tasks.forEach(task => {

        if (!task.completed) return;

        Object.values(
            task.completed
        ).forEach(completed => {

            if (completed === true) {
                score += 10;
            }

        });
    });

    return score;
}


/* =========================================================
   СЕРИЯ
========================================================= */

function calculateStreak() {

    let streak = 0;

    const current =
        new Date();

    while (true) {

        const key =
            dateKey(current);

        const progress =
            progressForDate(key);

        if (
            progress.total === 0 ||
            progress.percent < 100
        ) {
            break;
        }

        streak++;

        current.setDate(
            current.getDate() - 1
        );
    }

    return streak;
}


function renderScore() {

    const score =
        calculateScore();

    const streak =
        calculateStreak();

    $("#score").textContent =
        score;

    $("#streak").textContent =
        streak;

    $("#sidebarScore").textContent =
        score;

    $("#profileScore").textContent =
        score;

    $("#profileStreak").textContent =
        streak;
}


/* =========================================================
   КАЛЕНДАРЬ
========================================================= */

const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
];

const weekNames = [
    "Вс",
    "Пн",
    "Вт",
    "Ср",
    "Чт",
    "Пт",
    "Сб"
];


function renderCalendar() {

    const calendar =
        $("#calendar");

    if (!calendar) return;

    const firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        );

    const daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();

    $("#monthName").textContent =
        `${monthNames[currentMonth]} ${currentYear}`;

    let html = "";


    weekNames.forEach(day => {

        html += `
            <div class="calendar-weekday">
                ${day}
            </div>
        `;

    });


    for (
        let i = 0;
        i < firstDay.getDay();
        i++
    ) {

        html += `
            <div class="calendar-day empty-day"></div>
        `;

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                currentYear,
                currentMonth,
                day
            );

        const key =
            dateKey(date);

        const progress =
            progressForDate(key);

        const isToday =
            key === todayKey();


        html += `
            <div
                class="calendar-day ${isToday ? "today" : ""}"
                data-calendar="${key}">

                <div class="calendar-day-number">
                    ${day}
                </div>

                <div class="calendar-day-percent">
                    ${
                        progress.total > 0
                            ? progress.percent + "%"
                            : "—"
                    }
                </div>

            </div>
        `;
    }


    calendar.innerHTML =
        html;
}


/* =========================================================
   АНАЛИТИКА
========================================================= */

function renderAnalytics() {

    const percentages = [];

    let totalDone = 0;

    let bestPercent = -1;

    let bestDate = null;


    for (
        let i = 29;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const key =
            dateKey(date);

        const progress =
            progressForDate(key);

        percentages.push({
            key,
            percent: progress.percent
        });

        totalDone +=
            progress.completed;


        if (
            progress.total > 0 &&
            progress.percent > bestPercent
        ) {

            bestPercent =
                progress.percent;

            bestDate =
                key;
        }
    }


    const daysWithTasks =
        percentages.filter(
            item =>
                progressForDate(
                    item.key
                ).total > 0
        );


    const average =
        daysWithTasks.length > 0
            ? Math.round(
                daysWithTasks.reduce(
                    (sum, item) =>
                        sum + item.percent,
                    0
                ) /
                daysWithTasks.length
            )
            : 0;


    $("#average").textContent =
        `${average}%`;

    $("#totalDone").textContent =
        totalDone;


    if (bestDate) {

        const date =
            parseDate(bestDate);

        $("#bestDay").textContent =
            `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;

    } else {

        $("#bestDay").textContent =
            "—";
    }


    const chart =
        $("#chart");

    chart.innerHTML = "";


    percentages.forEach(item => {

        const bar =
            document.createElement("div");

        bar.className =
            "chart-bar";

        bar.style.height =
            `${Math.max(item.percent, 3)}%`;

        bar.title =
            `${item.key}: ${item.percent}%`;


        const label =
            document.createElement("div");

        label.className =
            "chart-label";

        label.textContent =
            item.key.slice(8);

        bar.appendChild(label);

        chart.appendChild(bar);

    });
}


/* =========================================================
   НИК
========================================================= */

function renderUsername() {

    $("#profileName").textContent =
        username;

    $("#characterName").textContent =
        username;

    $("#nameInput").value =
        username;


    const first =
        username
            .charAt(0)
            .toUpperCase();

    $("#avatar").textContent =
        first || "A";
}


function saveNewUsername() {

    const input =
        $("#nameInput");

    const value =
        input.value.trim();

    if (!value) {

        toast(
            "Введите никнейм."
        );

        input.focus();

        return;
    }

    username =
        value.slice(0, 24);

    saveUsername();

    renderUsername();

    toast(
        "Никнейм сохранён."
    );
}


/* =========================================================
   ПЕРСОНАЖ
========================================================= */

function renderCharacter() {

    const progress =
        progressForDate(
            todayKey()
        );

    let message =
        "Сосредоточься.";

    if (progress.percent === 100) {

        message =
            "Сегодня ты победил.";

    } else if (progress.percent >= 75) {

        message =
            "Осталось немного. Дожми.";

    } else if (progress.percent >= 50) {

        message =
            "Не сбавляй темп.";

    } else if (progress.percent > 0) {

        message =
            "Хорошо. Продолжай.";

    }

    $("#characterMessage").textContent =
        message;
}


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
========================================================= */

function openPage(page) {

    $$(".page").forEach(
        item =>
            item.classList.remove("active")
    );

    $$(".nav-button").forEach(
        item =>
            item.classList.remove("active")
    );


    const target =
        $(`#page-${page}`);

    const button =
        document.querySelector(
            `[data-page="${page}"]`
        );


    if (!target) return;

    target.classList.add("active");

    if (button) {
        button.classList.add("active");
    }


    $("#sidebar")
        .classList
        .remove("open");


    if (page === "calendar") {
        renderCalendar();
    }

    if (page === "analytics") {
        renderAnalytics();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   МОДАЛЬНОЕ ОКНО
========================================================= */

function openModal() {

    const modal =
        $("#modal");

    modal.classList.add("show");

    $("#taskTitle").value = "";

    $("#category").value =
        "Дисциплина";

    $("#priority").value =
        "Обычный";


    const once =
        document.querySelector(
            'input[name="repeat"][value="once"]'
        );

    if (once) {
        once.checked = true;
    }


    $$("#days input")
        .forEach(
            checkbox =>
                checkbox.checked = false
        );


    updateDaysVisibility();


    setTimeout(() => {

        $("#taskTitle").focus();

    }, 50);
}


function closeModal() {

    $("#modal")
        .classList
        .remove("show");
}


/* =========================================================
   ПОВТОРЕНИЕ
========================================================= */

function getSelectedRepeat() {

    const checked =
        document.querySelector(
            'input[name="repeat"]:checked'
        );

    return checked
        ? checked.value
        : "once";
}


function updateDaysVisibility() {

    const repeat =
        getSelectedRepeat();

    $("#days")
        .classList
        .toggle(
            "show",
            repeat === "custom"
        );
}


/* =========================================================
   СОЗДАНИЕ
========================================================= */

function submitTask(event) {

    event.preventDefault();


    const title =
        $("#taskTitle")
            .value
            .trim();

    if (!title) {

        toast(
            "Введите название задачи."
        );

        return;
    }


    const category =
        $("#category").value;

    const priority =
        $("#priority").value;

    const repeat =
        getSelectedRepeat();


    let selectedDays = [];


    if (repeat === "custom") {

        selectedDays =
            $$("#days input:checked")
                .map(
                    input =>
                        Number(input.value)
                );


        if (
            selectedDays.length === 0
        ) {

            toast(
                "Выберите хотя бы один день."
            );

            return;
        }
    }


    const task =
        createTask(
            title,
            category,
            priority,
            repeat,
            selectedDays
        );


    tasks.push(task);

    saveTasks();

    closeModal();

    renderEverything();

    toast(
        "Задача создана."
    );
}


/* =========================================================
   СБРОС
========================================================= */

function resetEverything() {

    const accepted =
        window.confirm(
            "Удалить ВСЕ задачи и весь прогресс?"
        );

    if (!accepted) return;

    tasks = [];

    username =
        "ASCENDER";

    localStorage.removeItem(
        TASKS_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );

    renderEverything();

    toast(
        "Все данные удалены."
    );
}


/* =========================================================
   ДАТА
========================================================= */

function renderCurrentDate() {

    const formatter =
        new Intl.DateTimeFormat(
            "ru-RU",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    $("#currentDate").textContent =
        formatter.format(
            new Date()
        );
}


/* =========================================================
   СОБЫТИЯ
========================================================= */

function setupEvents() {

    /* Меню */

    $$(".nav-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openPage(
                        button.dataset.page
                    )
            );

        });


    /* Добавление */

    $("#addTask")
        .addEventListener(
            "click",
            openModal
        );

    $("#addTask2")
        .addEventListener(
            "click",
            openModal
        );


    /* Модальное окно */

    $("#closeModal")
        .addEventListener(
            "click",
            closeModal
        );

    $("#cancel")
        .addEventListener(
            "click",
            closeModal
        );


    $("#modal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("#modal")
                ) {
                    closeModal();
                }

            }
        );


    $("#taskForm")
        .addEventListener(
            "submit",
            submitTask
        );


    /* Повторение */

    $$('input[name="repeat"]')
        .forEach(input => {

            input.addEventListener(
                "change",
                updateDaysVisibility
            );

        });


    /* Задачи */

    document.addEventListener(
        "click",
        event => {

            const toggle =
                event.target.closest(
                    '[data-action="toggle"]'
                );

            if (toggle) {

                toggleTask(
                    toggle.dataset.id,
                    toggle.dataset.date
                );

                return;
            }


            const deleteButton =
                event.target.closest(
                    '[data-action="delete"]'
                );

            if (deleteButton) {

                deleteTask(
                    deleteButton.dataset.id
                );

                return;
            }


            const calendarDay =
                event.target.closest(
                    "[data-calendar]"
                );

            if (calendarDay) {

                const key =
                    calendarDay.dataset.calendar;

                const progress =
                    progressForDate(key);

                toast(
                    `${progress.percent}% выполнено`
                );
            }

        }
    );


    /* Календарь */

    $("#prevMonth")
        .addEventListener(
            "click",
            () => {

                currentMonth--;

                if (currentMonth < 0) {

                    currentMonth = 11;
                    currentYear--;

                }

                renderCalendar();
            }
        );


    $("#nextMonth")
        .addEventListener(
            "click",
            () => {

                currentMonth++;

                if (currentMonth > 11) {

                    currentMonth = 0;
                    currentYear++;

                }

                renderCalendar();
            }
        );


    /* Профиль */

    $("#saveName")
        .addEventListener(
            "click",
            saveNewUsername
        );


    $("#nameInput")
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    saveNewUsername();
                }

            }
        );


    /* Уведомление */

    $("#notification")
        .addEventListener(
            "click",
            () => {

                const progress =
                    progressForDate(
                        todayKey()
                    );

                toast(
                    `Сегодня выполнено: ${progress.percent}%`
                );

            }
        );


    /* Мобильное меню */

    $("#mobileMenu")
        .addEventListener(
            "click",
            () => {

                $("#sidebar")
                    .classList
                    .toggle("open");

            }
        );


    /* Сброс */

    $("#reset")
        .addEventListener(
            "click",
            resetEverything
        );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {
                closeModal();
            }

        }
    );
}


/* =========================================================
   ОБНОВЛЕНИЕ ВСЕГО
========================================================= */

function renderEverything() {

    renderCurrentDate();

    renderDashboard();

    renderScore();

    renderCalendar();

    renderAnalytics();

    renderUsername();

    renderCharacter();

    renderAllTasks();
}


/* =========================================================
   ЗАПУСК
========================================================= */

function init() {

    loadTasks();

    loadUsername();

    setupEvents();

    updateDaysVisibility();

    renderEverything();

    console.log(
        "ASCEND успешно запущен."
    );
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
