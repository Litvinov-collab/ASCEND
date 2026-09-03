const TASKS_KEY = "ASCEND_TASKS_RU_V2";
const USER_KEY = "ASCEND_USERNAME_RU_V2";

let tasks = [];
let username = "ASCENDER";

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let toastTimer = null;


/* ============================
   HELPERS
============================ */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function pad(number) {
    return String(number).padStart(2, "0");
}

function dateKey(date = new Date()) {
    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );
}

function todayKey() {
    return dateKey(new Date());
}

function parseDate(key) {

    const [year, month, day] =
        key.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* ============================
   TOAST
============================ */

function toast(message) {

    const element = $("#toast");

    element.textContent = message;

    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            element.classList.remove("show");

        }, 2200);
}


/* ============================
   STORAGE
============================ */

function saveTasks() {

    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}

function loadTasks() {

    try {

        const stored =
            localStorage.getItem(TASKS_KEY);

        tasks =
            stored
                ? JSON.parse(stored)
                : [];

    } catch {

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

    username =
        localStorage.getItem(USER_KEY)
        || "ASCENDER";
}


/* ============================
   TASK CREATION
============================ */

function createTask(
    title,
    category,
    priority,
    repeat,
    days
) {

    return {

        id:
            Date.now().toString()
            +
            Math.random()
                .toString(36)
                .slice(2),

        title: title.trim(),

        category,

        priority,

        repeat,

        days,

        createdAt: todayKey(),

        completed: {}
    };
}


/* ============================
   TASK SCHEDULE
============================ */

function taskAvailableOnDate(
    task,
    key
) {

    const target =
        parseDate(key);

    const created =
        parseDate(task.createdAt);

    if (target < created) {
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
            target.getDay();

        return day >= 1 && day <= 5;
    }

    if (task.repeat === "custom") {

        const weekday =
            target.getDay();

        return (
            Array.isArray(task.days)
            &&
            task.days.includes(weekday)
        );
    }

    return false;
}

function tasksForDate(key) {

    return tasks.filter(task =>
        taskAvailableOnDate(
            task,
            key
        )
    );
}


/* ============================
   PROGRESS
============================ */

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
        list.filter(task =>
            task.completed
            &&
            task.completed[key] === true
        ).length;

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


/* ============================
   SCORE
============================ */

function totalScore() {

    let score = 0;

    tasks.forEach(task => {

        if (!task.completed) {
            return;
        }

        Object.values(
            task.completed
        ).forEach(done => {

            if (done) {
                score += 10;
            }
        });
    });

    return score;
}


/* ============================
   STREAK
============================ */

function calculateStreak() {

    let streak = 0;

    const cursor =
        new Date();

    for (
        let index = 0;
        index < 365;
        index++
    ) {

        const key =
            dateKey(cursor);

        const progress =
            progressForDate(key);

        if (
            progress.total === 0
            ||
            progress.percent < 100
        ) {
            break;
        }

        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    return streak;
}


/* ============================
   TASK HTML
============================ */

function taskHTML(
    task,
    key
) {

    const done =
        task.completed
        &&
        task.completed[key] === true;

    const repeatNames = {

        once: "Один раз",

        daily: "Каждый день",

        weekdays: "По будням",

        custom: "По выбранным дням"
    };

    return `

        <div
            class="task ${done ? "done" : ""}"
        >

            <button
                type="button"
                class="check"
                data-action="toggle"
                data-id="${task.id}"
                data-date="${key}"
            >
                ${done ? "✓" : ""}
            </button>

            <div class="task-info">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">
                    ${repeatNames[task.repeat] || ""}
                </div>

            </div>

            <span class="category">
                ${escapeHTML(task.category)}
            </span>

            <button
                type="button"
                class="delete"
                data-action="delete"
                data-id="${task.id}"
                title="Удалить"
            >
                ×
            </button>

        </div>
    `;
}


/* ============================
   DASHBOARD
============================ */

function renderDashboard() {

    const key =
        todayKey();

    const list =
        tasksForDate(key);

    const progress =
        progressForDate(key);

    $("#dailyPercent").textContent =
        progress.percent + "%";

    $("#taskCount").textContent =
        progress.completed
        +
        " / "
        +
        progress.total;

    const streak =
        calculateStreak();

    $("#streak").textContent =
        streak
        +
        (
            streak === 1
                ? " день"
                : " дней"
        );

    const score =
        totalScore();

    $("#score").textContent =
        score;

    $("#sidebarScore").textContent =
        "Очки: " + score;

    $("#sidebarPercent").textContent =
        progress.percent + "%";

    $("#sidebarFill").style
        .setProperty(
            "--mini-progress",
            progress.percent + "%"
        );

    $("#circleNumber").textContent =
        progress.percent + "%";

    $("#progressCircle").style
        .setProperty(
            "--progress",
            progress.percent + "%"
        );

    $("#todayTasks").innerHTML =
        list.length
            ? list
                .map(task =>
                    taskHTML(
                        task,
                        key
                    )
                )
                .join("")
            : `
                <div class="empty">
                    На сегодня задач пока нет.
                </div>
            `;

    renderProgressMessage(
        progress.percent
    );

    updateCharacter(
        progress.percent
    );
}


/* ============================
   PROGRESS MESSAGE
============================ */

function renderProgressMessage(
    percent
) {

    let title =
        "Начни свой день.";

    let text =
        "Первое выполненное действие запускает движение.";

    if (percent === 100) {

        title =
            "Идеальный день.";

        text =
            "Ты закрыл всё. Именно так строится дисциплина.";

    } else if (percent >= 75) {

        title =
            "Почти готово.";

        text =
            "Осталось немного. Дожми день.";

    } else if (percent >= 50) {

        title =
            "Хороший темп.";

        text =
            "Половина позади. Не останавливайся.";

    } else if (percent > 0) {

        title =
            "Движение началось.";

        text =
            "Продолжай. Каждый выполненный пункт имеет значение.";
    }

    $("#progressMessage").innerHTML = `

        <strong>
            ${title}
        </strong>

        <p>
            ${text}
        </p>
    `;
}


/* ============================
   CHARACTER
============================ */

function updateCharacter(
    percent
) {

    const character =
        $("#character");

    const message =
        $("#characterMessage");

    character.classList.remove(
        "state-low",
        "state-medium",
        "state-high",
        "state-perfect"
    );

    if (percent === 100) {

        character.classList.add(
            "state-perfect"
        );

        message.textContent =
            "Сегодня ты сделал всё. Запомни это состояние.";

    } else if (percent >= 70) {

        character.classList.add(
            "state-high"
        );

        message.textContent =
            "Ты близко. Не останавливайся сейчас.";

    } else if (percent >= 30) {

        character.classList.add(
            "state-medium"
        );

        message.textContent =
            "Темп есть. Продолжай двигаться.";

    } else {

        character.classList.add(
            "state-low"
        );

        message.textContent =
            "Начни день. Сделай первое действие.";
    }
}


/* ============================
   TOGGLE TASK
============================ */

function toggleTask(
    taskId,
    key
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {
        return;
    }

    if (!task.completed) {

        task.completed = {};
    }

    task.completed[key] =
        !task.completed[key];

    saveTasks();

    renderEverything();

    if (
        task.completed[key]
    ) {

        toast(
            "Задача выполнена. +10 очков"
        );

    } else {

        toast(
            "Выполнение отменено."
        );
    }
}


/* ============================
   DELETE
============================ */

function deleteTask(
    taskId
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {
        return;
    }

    tasks =
        tasks.filter(
            item =>
                item.id !== taskId
        );

    saveTasks();

    renderEverything();

    toast(
        "Задача удалена."
    );
}


/* ============================
   ALL TASKS
============================ */

function renderAllTasks() {

    const container =
        $("#allTasks");

    if (!tasks.length) {

        container.innerHTML = `

            <div class="empty">
                Пока нет ни одной задачи.
            </div>
        `;

        return;
    }

    const key =
        todayKey();

    container.innerHTML =
        tasks
            .map(task =>
                taskHTML(
                    task,
                    key
                )
            )
            .join("");
}


/* ============================
   CALENDAR
============================ */

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

function buildCalendarHTML() {

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

    let weekday =
        firstDay.getDay();

    weekday =
        weekday === 0
            ? 6
            : weekday - 1;

    const weekdays = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Вс"
    ];

    let html =
        weekdays
            .map(day => `
                <div class="weekday">
                    ${day}
                </div>
            `)
            .join("");

    for (
        let i = 0;
        i < weekday;
        i++
    ) {

        html += `
            <div
                class="calendar-day blank"
            ></div>
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

            <button
                type="button"
                class="
                    calendar-day
                    ${isToday ? "today" : ""}
                "
                data-calendar-date="${key}"
            >

                <div class="calendar-number">
                    ${day}
                </div>

                <div
                    class="
                        calendar-percent
                        ${
                            progress.percent === 100
                                ? "complete"
                                : ""
                        }
                    "
                >
                    ${
                        progress.total
                            ? progress.percent + "%"
                            : "—"
                    }
                </div>

            </button>
        `;
    }

    return html;
}

function renderCalendar() {

    const name =
        monthNames[currentMonth]
        +
        " "
        +
        currentYear;

    $("#monthName").textContent =
        name;

    $("#monthName2").textContent =
        name;

    const html =
        buildCalendarHTML();

    $("#calendar").innerHTML =
        html;

    $("#calendar2").innerHTML =
        html;
}


/* ============================
   ANALYTICS
============================ */

function analyticsData() {

    const result = [];

    const today =
        new Date();

    for (
        let offset = 29;
        offset >= 0;
        offset--
    ) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() - offset
        );

        const key =
            dateKey(date);

        const progress =
            progressForDate(key);

        result.push({

            key,

            date,

            ...progress
        });
    }

    return result;
}

function renderAnalytics() {

    const data =
        analyticsData();

    const daysWithTasks =
        data.filter(
            item =>
                item.total > 0
        );

    let average = 0;

    if (daysWithTasks.length) {

        average =
            Math.round(
                daysWithTasks.reduce(
                    (sum,item) =>
                        sum + item.percent,
                    0
                )
                /
                daysWithTasks.length
            );
    }

    $("#average").textContent =
        average + "%";

    let best = null;

    daysWithTasks.forEach(item => {

        if (
            !best
            ||
            item.percent > best.percent
        ) {

            best = item;
        }
    });

    $("#bestDay").textContent =
        best
            ? (
                pad(
                    best.date.getDate()
                )
                +
                "."
                +
                pad(
                    best.date.getMonth() + 1
                )
            )
            : "—";

    const totalDone =
        tasks.reduce(
            (total, task) => {

                if (!task.completed) {

                    return total;
                }

                return (
                    total
                    +
                    Object.values(
                        task.completed
                    )
                    .filter(Boolean)
                    .length
                );

            },
            0
        );

    $("#totalDone").textContent =
        totalDone;

    $("#chart").innerHTML =
        data
            .map(item => {

                const height =
                    Math.max(
                        item.percent,
                        2
                    );

                return `

                    <div class="chart-column">

                        <div class="bar-holder">

                            <div
                                class="bar"
                                style="
                                    height:${height}%;
                                    opacity:${
                                        item.total
                                            ? 1
                                            : .15
                                    }
                                "
                                title="${item.percent}%"
                            ></div>

                        </div>

                        <div class="bar-label">
                            ${pad(item.date.getDate())}
                        </div>

                    </div>
                `;
            })
            .join("");
}


/* ============================
   PROFILE
============================ */

function renderProfile() {

    const firstLetter =
        username
            .trim()
            .charAt(0)
            .toUpperCase()
        || "A";

    $("#avatar").textContent =
        firstLetter;

    $("#profileName").textContent =
        username;

    $("#nameInput").value =
        username;

    $("#characterName").textContent =
        username;

    $("#profileScore").textContent =
        totalScore();

    $("#profileStreak").textContent =
        calculateStreak();
}

function saveProfileName() {

    const value =
        $("#nameInput")
            .value
            .trim();

    if (!value) {

        toast(
            "Введите никнейм."
        );

        return;
    }

    username =
        value.slice(0,24);

    saveUsername();

    renderProfile();

    toast(
        "Никнейм сохранён."
    );
}


/* ============================
   DATE HEADER
============================ */

function renderCurrentDate() {

    const now =
        new Date();

    const weekdays = [
        "Воскресенье",
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота"
    ];

    const text =
        `${now.getDate()} `
        +
        `${monthNames[now.getMonth()].toLowerCase()}, `
        +
        `${weekdays[now.getDay()]}`;

    $("#currentDate").textContent =
        text;
}


/* ============================
   MODAL
============================ */

function openModal() {

    $("#taskForm").reset();

    $("#days").classList.remove(
        "visible"
    );

    $("#modal").classList.add(
        "open"
    );

    setTimeout(() => {

        $("#taskTitle").focus();

    },100);
}

function closeModal() {

    $("#modal").classList.remove(
        "open"
    );
}

function updateDaysVisibility() {

    const selected =
        document.querySelector(
            'input[name="repeat"]:checked'
        );

    if (
        selected
        &&
        selected.value === "custom"
    ) {

        $("#days").classList.add(
            "visible"
        );

    } else {

        $("#days").classList.remove(
            "visible"
        );
    }
}

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
        document.querySelector(
            'input[name="repeat"]:checked'
        ).value;

    let days = [];

    if (repeat === "custom") {

        days =
            $$("#days input:checked")
                .map(input =>
                    Number(input.value)
                );

        if (!days.length) {

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
            days
        );

    tasks.push(task);

    saveTasks();

    closeModal();

    renderEverything();

    toast(
        "Задача создана."
    );
}


/* ============================
   PAGE NAVIGATION
============================ */

function openPage(page) {

    $$(".page")
        .forEach(item =>
            item.classList.remove(
                "active"
            )
        );

    $$(".nav-button")
        .forEach(item =>
            item.classList.remove(
                "active"
            )
        );

    const target =
        $(`#page-${page}`);

    const button =
        document.querySelector(
            `[data-page="${page}"]`
        );

    if (!target) {
        return;
    }

    target.classList.add(
        "active"
    );

    if (button) {

        button.classList.add(
            "active"
        );
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


/* ============================
   RESET
============================ */

function resetApp() {

    const accepted =
        window.confirm(
            "Удалить ВСЕ задачи и весь прогресс?"
        );

    if (!accepted) {
        return;
    }

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
        "ASCEND сброшен."
    );
}


/* ============================
   RENDER EVERYTHING
============================ */

function renderEverything() {

    renderCurrentDate();

    renderDashboard();

    renderAllTasks();

    renderCalendar();

    renderAnalytics();

    renderProfile();
}


/* ============================
   EVENTS
============================ */

function setupEvents() {

    $$(".nav-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openPage(
                        button.dataset.page
                    );
                }
            );
        });

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

    $("#taskForm")
        .addEventListener(
            "submit",
            submitTask
        );

    $("#modal")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target.id
                    ===
                    "modal"
                ) {

                    closeModal();
                }
            }
        );

    $$(
        'input[name="repeat"]'
    ).forEach(input => {

        input.addEventListener(
            "change",
            updateDaysVisibility
        );
    });

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

            const remove =
                event.target.closest(
                    '[data-action="delete"]'
                );

            if (remove) {

                deleteTask(
                    remove.dataset.id
                );

                return;
            }

            const calendarDay =
                event.target.closest(
                    "[data-calendar-date]"
                );

            if (calendarDay) {

                const key =
                    calendarDay.dataset
                        .calendarDate;

                const progress =
                    progressForDate(key);

                toast(
                    progress.total
                        ? `Прогресс дня: ${progress.percent}%`
                        : "В этот день задач нет."
                );
            }
        }
    );

    function previousMonth() {

        currentMonth--;

        if (currentMonth < 0) {

            currentMonth = 11;

            currentYear--;
        }

        renderCalendar();
    }

    function nextMonth() {

        currentMonth++;

        if (currentMonth > 11) {

            currentMonth = 0;

            currentYear++;
        }

        renderCalendar();
    }

    $("#prevMonth")
        .addEventListener(
            "click",
            previousMonth
        );

    $("#prevMonth2")
        .addEventListener(
            "click",
            previousMonth
        );

    $("#nextMonth")
        .addEventListener(
            "click",
            nextMonth
        );

    $("#nextMonth2")
        .addEventListener(
            "click",
            nextMonth
        );

    $("#saveName")
        .addEventListener(
            "click",
            saveProfileName
        );

    $("#nameInput")
        .addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    saveProfileName();
                }
            }
        );

    $("#mobileMenu")
        .addEventListener(
            "click",
            () => {

                $("#sidebar")
                    .classList
                    .toggle("open");
            }
        );

    $("#notification")
        .addEventListener(
            "click",
            () => {

                toast(
                    "Уведомлений пока нет."
                );
            }
        );

    $("#reset")
        .addEventListener(
            "click",
            resetApp
        );

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


/* ============================
   INIT
============================ */

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
    document.readyState
    ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
