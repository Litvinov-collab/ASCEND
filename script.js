"use strict";

/* =========================================================
   ASCEND
   ========================================================= */

const TASKS_KEY = "ASCEND_TASKS_V4";
const USER_KEY = "ASCEND_USERNAME_V1";

let tasks = [];
let username = "ASCENDER";
let calendarDate = new Date();


/* =========================================================
   HELPERS
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

    return new Date(
        year,
        month - 1,
        day
    );
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
   TOAST
   ========================================================= */

function toast(message) {

    const element = $("#toast");

    if (!element) return;

    element.textContent = message;

    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 2400);
}


/* =========================================================
   STORAGE
   ========================================================= */

function saveTasks() {
    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}

function loadTasks() {

    try {

        const data =
            localStorage.getItem(TASKS_KEY);

        if (!data) {
            tasks = [];
            return;
        }

        const parsed =
            JSON.parse(data);

        tasks =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(error);

        tasks = [];
    }
}

function loadUsername() {

    const saved =
        localStorage.getItem(USER_KEY);

    if (saved && saved.trim()) {
        username = saved.trim();
    }
}

function saveUsername() {

    localStorage.setItem(
        USER_KEY,
        username
    );
}


/* =========================================================
   TASK CREATION
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
            Math.random().toString(36).slice(2),

        title,
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
   TASK AVAILABILITY
   ========================================================= */

function taskAvailable(task, key) {

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

        let day =
            targetDate.getDay();

        if (day === 0) {
            day = 7;
        }

        return Array.isArray(task.days)
            && task.days.includes(day);
    }

    return false;
}


/* =========================================================
   TASKS FOR DATE
   ========================================================= */

function tasksForDate(key) {

    return tasks.filter(task =>
        taskAvailable(task, key)
    );
}


/* =========================================================
   PROGRESS
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
        list.filter(task =>
            task.completed &&
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


/* =========================================================
   TOGGLE
   ========================================================= */

function toggleTask(
    taskId,
    key
) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    if (!task.completed) {
        task.completed = {};
    }

    task.completed[key] =
        !task.completed[key];

    saveTasks();

    renderEverything();

    if (task.completed[key]) {
        toast("Задача выполнена.");
    }
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    const confirmed =
        confirm(
            `Удалить задачу "${task.title}"?\n\nОна будет удалена полностью из ASCEND.`
        );

    if (!confirmed) {
        return;
    }

    /*
       ВАЖНО:
       полностью заменяем массив,
       поэтому задача действительно исчезает
       из localStorage.
    */

    tasks =
        tasks.filter(
            item => item.id !== taskId
        );

    saveTasks();

    renderEverything();

    toast("Задача удалена.");
}


/* =========================================================
   REPEAT TEXT
   ========================================================= */

function repeatText(task) {

    if (task.repeat === "once") {
        return "Сегодня";
    }

    if (task.repeat === "daily") {
        return "Каждый день";
    }

    if (task.repeat === "weekdays") {
        return "Пн–Пт";
    }

    if (task.repeat === "custom") {

        const names = {
            1: "ПН",
            2: "ВТ",
            3: "СР",
            4: "ЧТ",
            5: "ПТ",
            6: "СБ",
            7: "ВС"
        };

        return (task.days || [])
            .map(day => names[day])
            .join(" · ");
    }

    return "";
}


/* =========================================================
   TASK HTML
   ========================================================= */

function taskHTML(
    task,
    key
) {

    const completed =
        task.completed &&
        task.completed[key] === true;

    return `
        <div class="task ${completed ? "completed" : ""}">

            <button
                class="check"
                data-action="toggle"
                data-id="${task.id}"
                data-date="${key}"
                title="Выполнить"
            >
                ${completed ? "✓" : ""}
            </button>

            <div class="task-body">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">

                    <span class="badge">
                        ${escapeHTML(task.category)}
                    </span>

                    <span class="badge">
                        ${escapeHTML(task.priority)}
                    </span>

                    <span class="badge">
                        ${escapeHTML(repeatText(task))}
                    </span>

                </div>

            </div>

            <button
                class="delete"
                data-action="delete"
                data-id="${task.id}"
                title="Удалить задачу"
            >
                🗑
            </button>

        </div>
    `;
}


/* =========================================================
   TODAY TASKS
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
                На сегодня задач нет.<br><br>
                Добавь первую задачу.
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
   ALL TASKS
   ========================================================= */

function renderAllTasks() {

    const container =
        $("#allTasks");

    if (!container) return;

    const key =
        todayKey();

    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty">
                Пока нет задач.<br><br>
                Создай первую задачу.
            </div>
        `;

        return;
    }

    container.innerHTML =
        tasks
            .map(task =>
                taskHTML(task, key)
            )
            .join("");
}


/* =========================================================
   DASHBOARD PROGRESS
   ========================================================= */

function renderProgress() {

    const progress =
        progressForDate(
            todayKey()
        );

    $("#dailyPercent").textContent =
        `${progress.percent}%`;

    $("#taskCount").textContent =
        `${progress.completed}/${progress.total}`;

    $("#sidebarPercent").textContent =
        `${progress.percent}%`;

    $("#sidebarFill").style.width =
        `${progress.percent}%`;

    $("#circleNumber").textContent =
        `${progress.percent}%`;

    $("#progressCircle").style.strokeDasharray =
        `${2 * Math.PI * 75}`;

    $("#progressCircle").style.strokeDashoffset =
        `${2 * Math.PI * 75 -
        (progress.percent / 100) *
        (2 * Math.PI * 75)}`;

    let message =
        "Начни выполнять задачи.";

    if (progress.total === 0) {

        message =
            "Добавь задачи на сегодня.";

    } else if (progress.percent === 0) {

        message =
            "Первый шаг всегда самый важный.";

    } else if (progress.percent < 50) {

        message =
            "Хорошее начало. Продолжай.";

    } else if (progress.percent < 100) {

        message =
            "Больше половины. Дожми день.";

    } else {

        message =
            "100%. Сегодня ты сделал то, что обещал себе.";
    }

    $("#progressMessage").textContent =
        message;
}


/* =========================================================
   SCORE
   ========================================================= */

function calculateScore() {

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

function renderScore() {

    const score =
        calculateScore();

    $("#score").textContent =
        score;

    $("#sidebarScore").textContent =
        score;

    $("#profileScore").textContent =
        score;
}


/* =========================================================
   STREAK
   ========================================================= */

function calculateStreak() {

    let streak = 0;

    const date =
        new Date();

    while (true) {

        const key =
            dateKey(date);

        const progress =
            progressForDate(key);

        if (
            progress.total > 0 &&
            progress.percent === 100
        ) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

        } else {

            break;
        }
    }

    return streak;
}

function renderStreak() {

    const streak =
        calculateStreak();

    $("#streak").textContent =
        streak;

    $("#profileStreak").textContent =
        streak;
}


/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {

    const container =
        $("#calendar");

    if (!container) return;

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    $("#monthName").textContent =
        calendarDate.toLocaleDateString(
            "ru-RU",
            {
                month: "long",
                year: "numeric"
            }
        );

    const first =
        new Date(
            year,
            month,
            1
        );

    let start =
        first.getDay();

    start =
        start === 0
            ? 6
            : start - 1;

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();

    let html = "";

    /*
       Previous month
    */

    for (
        let i = start - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousDays - i;

        const date =
            new Date(
                year,
                month - 1,
                day
            );

        html += calendarDayHTML(
            date,
            true
        );
    }

    /*
       Current month
    */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        html += calendarDayHTML(
            date,
            false
        );
    }

    /*
       Next month
    */

    let next =
        1;

    while (
        html.match(/class="day/g)?.length < 42
    ) {

        const date =
            new Date(
                year,
                month + 1,
                next
            );

        html += calendarDayHTML(
            date,
            true
        );

        next++;
    }

    container.innerHTML =
        html;
}


function calendarDayHTML(
    date,
    other
) {

    const key =
        dateKey(date);

    const progress =
        progressForDate(key);

    const today =
        key === todayKey();

    return `
        <div
            class="day
                ${other ? "other" : ""}
                ${today ? "today" : ""}"
            data-calendar="${key}"
        >

            <div class="day-number">
                ${date.getDate()}
            </div>

            <div class="day-progress">

                <div class="day-percent">
                    ${
                        progress.total > 0
                            ? `${progress.percent}%`
                            : "—"
                    }
                </div>

                <div class="day-bar">

                    <div
                        class="day-fill"
                        style="width:${progress.percent}%"
                    ></div>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {

    const data = [];

    for (
        let i = 6;
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

        data.push({
            date,
            key,
            progress:
                progressForDate(key)
        });
    }

    const valid =
        data.filter(
            item => item.progress.total > 0
        );

    let average = 0;

    if (valid.length) {

        average =
            Math.round(
                valid.reduce(
                    (sum, item) =>
                        sum + item.progress.percent,
                    0
                ) / valid.length
            );
    }

    $("#average").textContent =
        `${average}%`;


    let best = null;

    valid.forEach(item => {

        if (
            !best ||
            item.progress.percent >
            best.progress.percent
        ) {

            best = item;
        }
    });

    $("#bestDay").textContent =
        best
            ? `${best.progress.percent}%`
            : "—";


    let totalDone = 0;

    tasks.forEach(task => {

        if (!task.completed) {
            return;
        }

        Object.values(
            task.completed
        ).forEach(done => {

            if (done) {
                totalDone++;
            }

        });
    });

    $("#totalDone").textContent =
        totalDone;


    const chart =
        $("#chart");

    chart.innerHTML =
        data.map(item => {

            const percent =
                item.progress.percent;

            const label =
                item.date
                    .toLocaleDateString(
                        "ru-RU",
                        {
                            weekday:"short"
                        }
                    )
                    .slice(0,2);

            return `
                <div class="chart-column">

                    <div
                        class="chart-bar"
                        style="height:${Math.max(percent,3)}%"
                        title="${percent}%"
                    ></div>

                    <div class="chart-label">
                        ${label}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   USERNAME
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

        toast("Введите ник.");

        input.focus();

        return;
    }

    username =
        value
            .slice(0,25);

    saveUsername();

    renderUsername();

    toast("Ник сохранён.");
}


/* =========================================================
   CHARACTER MESSAGE
   ========================================================= */

function renderCharacter() {

    const element =
        $("#characterMessage");

    const progress =
        progressForDate(
            todayKey()
        );

    if (progress.total === 0) {

        element.textContent =
            "Создай задачи. Дисциплина начинается с плана.";

    } else if (progress.percent === 0) {

        element.textContent =
            "Не жди мотивации. Сделай первую задачу.";

    } else if (progress.percent < 50) {

        element.textContent =
            "Начало положено. Теперь продолжай.";

    } else if (progress.percent < 100) {

        element.textContent =
            "Ты уже прошёл больше половины. Дожми день.";

    } else {

        element.textContent =
            "100%. Сегодня ты сделал то, что обещал себе.";
    }
}


/* =========================================================
   PAGE NAVIGATION
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

    $("#sidebar").classList.remove("open");

    if (page === "calendar") {
        renderCalendar();
    }

    if (page === "analytics") {
        renderAnalytics();
    }

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal() {

    $("#modal").classList.add("show");

    setTimeout(() => {

        $("#taskTitle").focus();

    },100);
}

function closeModal() {

    $("#modal").classList.remove("show");

    $("#taskForm").reset();

    $("#once").checked = true;

    updateDaysVisibility();
}


/* =========================================================
   REPEAT
   ========================================================= */

function selectedRepeat() {

    const selected =
        document.querySelector(
            'input[name="repeat"]:checked'
        );

    return selected
        ? selected.value
        : "once";
}

function updateDaysVisibility() {

    const value =
        selectedRepeat();

    if (value === "custom") {

        $("#days")
            .classList.add("show");

    } else {

        $("#days")
            .classList.remove("show");
    }
}


/* =========================================================
   CREATE TASK FROM FORM
   ========================================================= */

function submitTask(event) {

    event.preventDefault();

    const title =
        $("#taskTitle")
            .value
            .trim();

    if (!title) {

        toast("Введите название задачи.");

        return;
    }

    const category =
        $("#category").value;

    const priority =
        $("#priority").value;

    const repeat =
        selectedRepeat();

    let days = [];

    if (repeat === "custom") {

        days =
            $$("#days input:checked")
                .map(
                    input =>
                        Number(input.value)
                );

        if (!days.length) {

            toast(
                "Выбери хотя бы один день."
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

    if (repeat === "daily") {

        toast(
            "Задача добавлена на все дни."
        );

    } else if (repeat === "weekdays") {

        toast(
            "Задача добавлена на Пн–Пт."
        );

    } else if (repeat === "custom") {

        toast(
            "Расписание задачи сохранено."
        );

    } else {

        toast(
            "Задача создана."
        );
    }
}


/* =========================================================
   RESET
   ========================================================= */

function resetEverything() {

    const confirmed =
        confirm(
            "Удалить ВСЕ задачи и историю?\n\nЭто действие нельзя отменить."
        );

    if (!confirmed) {
        return;
    }

    tasks = [];

    saveTasks();

    renderEverything();

    toast("Все данные удалены.");
}


/* =========================================================
   CURRENT DATE
   ========================================================= */

function renderCurrentDate() {

    const date =
        new Date();

    $("#currentDate").textContent =
        date.toLocaleDateString(
            "ru-RU",
            {
                weekday:"long",
                day:"numeric",
                month:"long",
                year:"numeric"
            }
        );
}


/* =========================================================
   EVERYTHING
   ========================================================= */

function renderEverything() {

    renderCurrentDate();

    renderTodayTasks();

    renderAllTasks();

    renderProgress();

    renderScore();

    renderStreak();

    renderCalendar();

    renderAnalytics();

    renderUsername();

    renderCharacter();
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    /*
       Navigation
    */

    $$(".nav-button").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    button.dataset.page
                );

            }
        );

    });


    /*
       Add task
    */

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


    /*
       Modal
    */

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


    /*
       Form
    */

    $("#taskForm")
        .addEventListener(
            "submit",
            submitTask
        );


    /*
       Repeat
    */

    $$(
        'input[name="repeat"]'
    ).forEach(input => {

        input.addEventListener(
            "change",
            updateDaysVisibility
        );

    });


    /*
       Task actions
       Используем delegation,
       поэтому динамические задачи
       тоже работают.
    */

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

                const date =
                    parseDate(key);

                toast(
                    `${date.toLocaleDateString(
                        "ru-RU",
                        {
                            day:"numeric",
                            month:"long"
                        }
                    )}: ${progress.percent}%`
                );

            }

        }
    );


    /*
       Month
    */

    $("#prevMonth")
        .addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );

                renderCalendar();

            }
        );


    $("#nextMonth")
        .addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );

                renderCalendar();

            }
        );


    /*
       Username
    */

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


    /*
       Notification
    */

    $("#notification")
        .addEventListener(
            "click",
            () => {

                const progress =
                    progressForDate(
                        todayKey()
                    );

                if (progress.total === 0) {

                    toast(
                        "Сегодня ещё нет задач."
                    );

                } else if (
                    progress.percent === 100
                ) {

                    toast(
                        "Сегодняшний план выполнен на 100%."
                    );

                } else {

                    toast(
                        `Выполнено ${progress.percent}%. Осталось ${progress.total - progress.completed}.`
                    );
                }

            }
        );


    /*
       Mobile
    */

    $("#mobileMenu")
        .addEventListener(
            "click",
            () => {

                $("#sidebar")
                    .classList
                    .toggle("open");

            }
        );


    /*
       Reset
    */

    $("#reset")
        .addEventListener(
            "click",
            resetEverything
        );


    /*
       Escape
    */

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
   INIT
   ========================================================= */

function init() {

    loadTasks();

    loadUsername();

    setupEvents();

    updateDaysVisibility();

    renderEverything();

    console.log(
        "ASCEND V4 successfully started."
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}
