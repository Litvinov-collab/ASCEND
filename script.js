"use strict";

/* =========================================================
   ASCEND — DISCIPLINE SYSTEM
   ========================================================= */

const STORAGE_KEY = "ASCEND_TASKS_V3";

let tasks = [];
let currentPage = "dashboard";

let calendarDate = new Date();


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function pad(number) {
    return String(number).padStart(2, "0");
}

function getDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTodayKey() {
    return getDateKey(new Date());
}

function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================================================
   STORAGE
   ========================================================= */

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            tasks = [];
            return;
        }

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
            tasks = parsed;
        } else {
            tasks = [];
        }

    } catch (error) {
        console.error("Ошибка загрузки задач:", error);
        tasks = [];
    }
}


/* =========================================================
   TASK MODEL
   =========================================================

   repeat:
   once      — только дата создания
   daily     — каждый день
   weekdays  — понедельник-пятница
   custom    — выбранные дни недели

   completed:
   {
      "2026-09-03": true,
      "2026-09-04": false
   }

   ========================================================= */

function createTaskObject(title, category, priority, repeat, days) {

    return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title,
        category,
        priority,
        repeat,
        days,
        createdAt: getTodayKey(),
        completed: {}
    };
}


/* =========================================================
   TASK AVAILABILITY
   ========================================================= */

function isTaskAvailableOnDate(task, dateKey) {

    const date = parseDate(dateKey);

    const createdDate = parseDate(task.createdAt);

    /*
       Задача не появляется раньше даты создания.
    */

    if (date < createdDate) {
        return false;
    }

    switch (task.repeat) {

        case "once":
            return dateKey === task.createdAt;

        case "daily":
            return true;

        case "weekdays": {
            const day = date.getDay();

            return day >= 1 && day <= 5;
        }

        case "custom": {
            const day = date.getDay();

            const normalizedDay = day === 0 ? 7 : day;

            return Array.isArray(task.days)
                && task.days.includes(normalizedDay);
        }

        default:
            return false;
    }
}


/* =========================================================
   GET TASKS FOR DATE
   ========================================================= */

function getTasksForDate(dateKey) {
    return tasks.filter(task => isTaskAvailableOnDate(task, dateKey));
}


/* =========================================================
   TASK COMPLETION
   ========================================================= */

function isTaskCompleted(task, dateKey) {
    return task.completed?.[dateKey] === true;
}

function toggleTask(taskId, dateKey) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    if (!task.completed) {
        task.completed = {};
    }

    task.completed[dateKey] = !isTaskCompleted(task, dateKey);

    saveTasks();

    renderAll();

    const completed = task.completed[dateKey];

    if (completed) {
        showToast("Задача выполнена. Так держать.");
    }
}


/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const confirmed = confirm(
        `Удалить задачу "${task.title}"?\n\nОна будет удалена полностью, включая расписание и историю выполнения.`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(item => item.id !== taskId);

    saveTasks();

    renderAll();

    showToast("Задача удалена.");
}


/* =========================================================
   RENDER TASK ITEM
   ========================================================= */

function createTaskHTML(task, dateKey, showRepeat = false) {

    const completed = isTaskCompleted(task, dateKey);

    let repeatText = "";

    if (task.repeat === "once") {
        repeatText = "Сегодня";
    }

    if (task.repeat === "daily") {
        repeatText = "Каждый день";
    }

    if (task.repeat === "weekdays") {
        repeatText = "Пн–Пт";
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

        repeatText = (task.days || [])
            .map(day => names[day])
            .join(" · ");
    }

    return `
        <div class="task-item ${completed ? "completed" : ""}">

            <button
                class="task-checkbox"
                data-action="toggle-task"
                data-id="${task.id}"
                data-date="${dateKey}"
                aria-label="Выполнить задачу"
            >
                ${completed ? "✓" : ""}
            </button>

            <div class="task-content">

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

                    ${
                        showRepeat
                            ? `<span class="badge">${escapeHTML(repeatText)}</span>`
                            : ""
                    }

                </div>

            </div>

            <div class="task-actions">

                <button
                    class="delete-task"
                    data-action="delete-task"
                    data-id="${task.id}"
                    title="Удалить"
                >
                    🗑
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DASHBOARD TASKS
   ========================================================= */

function renderTodayTasks() {

    const container = $("#tasksContainer");

    if (!container) return;

    const today = getTodayKey();

    const todayTasks = getTasksForDate(today);

    if (todayTasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                На сегодня задач нет.<br><br>
                Создай свою первую задачу.
            </div>
        `;

        return;
    }

    container.innerHTML = todayTasks
        .map(task => createTaskHTML(task, today, true))
        .join("");
}


/* =========================================================
   ALL TASKS PAGE
   ========================================================= */

function renderAllTasks() {

    const container = $("#allTasksContainer");

    if (!container) return;

    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Пока нет задач.<br><br>
                Создай первую задачу и начни строить свою систему.
            </div>
        `;

        return;
    }

    const today = getTodayKey();

    container.innerHTML = tasks
        .map(task => createTaskHTML(task, today, true))
        .join("");
}


/* =========================================================
   DAILY PROGRESS
   ========================================================= */

function getProgressForDate(dateKey) {

    const dateTasks = getTasksForDate(dateKey);

    if (dateTasks.length === 0) {
        return {
            percent: 0,
            completed: 0,
            total: 0
        };
    }

    const completed = dateTasks.filter(task =>
        isTaskCompleted(task, dateKey)
    ).length;

    const percent = Math.round(
        (completed / dateTasks.length) * 100
    );

    return {
        percent,
        completed,
        total: dateTasks.length
    };
}


/* =========================================================
   RENDER PROGRESS
   ========================================================= */

function renderProgress() {

    const today = getTodayKey();

    const progress = getProgressForDate(today);

    const dailyProgress = $("#dailyProgress");
    const completedTasks = $("#completedTasks");
    const progressCircleNumber = $("#progressCircleNumber");
    const sidebarProgress = $("#sidebarProgress");
    const sidebarProgressFill = $("#sidebarProgressFill");
    const progressMessage = $("#progressMessage");
    const circle = $("#dailyProgressCircle");

    if (dailyProgress) {
        dailyProgress.textContent = `${progress.percent}%`;
    }

    if (completedTasks) {
        completedTasks.textContent =
            `${progress.completed}/${progress.total}`;
    }

    if (progressCircleNumber) {
        progressCircleNumber.textContent =
            `${progress.percent}%`;
    }

    if (sidebarProgress) {
        sidebarProgress.textContent =
            `${progress.percent}%`;
    }

    if (sidebarProgressFill) {
        sidebarProgressFill.style.width =
            `${progress.percent}%`;
    }

    if (progressMessage) {

        if (progress.total === 0) {
            progressMessage.textContent =
                "Добавь задачи на сегодня.";
        } else if (progress.percent === 0) {
            progressMessage.textContent =
                "Начни выполнять задачи.";
        } else if (progress.percent < 50) {
            progressMessage.textContent =
                "Начало положено. Продолжай.";
        } else if (progress.percent < 100) {
            progressMessage.textContent =
                "Больше половины. Не останавливайся.";
        } else {
            progressMessage.textContent =
                "День выполнен на 100%. Сильно.";
        }
    }

    if (circle) {

        const radius = 80;
        const circumference = 2 * Math.PI * radius;

        circle.style.strokeDasharray = circumference;

        const offset =
            circumference -
            (progress.percent / 100) * circumference;

        circle.style.strokeDashoffset = offset;
    }
}


/* =========================================================
   STREAK
   ========================================================= */

function calculateStreak() {

    let streak = 0;

    const date = new Date();

    while (true) {

        const key = getDateKey(date);

        const progress = getProgressForDate(key);

        /*
           День считается выполненным только если
           есть задачи и выполнены все.
        */

        if (
            progress.total > 0 &&
            progress.percent === 100
        ) {

            streak++;

            date.setDate(date.getDate() - 1);

        } else {

            break;
        }
    }

    return streak;
}


/* =========================================================
   SCORE
   ========================================================= */

function calculateScore() {

    let score = 0;

    tasks.forEach(task => {

        if (!task.completed) return;

        Object.values(task.completed).forEach(done => {

            if (done) {
                score += 10;
            }

        });

    });

    return score;
}


/* =========================================================
   RENDER SCORE
   ========================================================= */

function renderScore() {

    const score = calculateScore();

    const ids = [
        "#ascendScore",
        "#dashboardScore",
        "#profileScore"
    ];

    ids.forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent = score;
        }

    });
}


/* =========================================================
   STREAK UI
   ========================================================= */

function renderStreak() {

    const streak = calculateStreak();

    const ids = [
        "#streakValue",
        "#profileStreak"
    ];

    ids.forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent = streak;
        }

    });
}


/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {

    const grid = $("#calendarGrid");
    const title = $("#calendarMonth");

    if (!grid || !title) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    title.textContent = calendarDate.toLocaleDateString(
        "ru-RU",
        {
            month: "long",
            year: "numeric"
        }
    );

    const firstDay = new Date(year, month, 1);

    let startDay = firstDay.getDay();

    /*
       JS:
       Sunday = 0
       Monday = 1

       Нам нужно:
       Monday = 0
       Sunday = 6
    */

    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();

    const previousMonthDays =
        new Date(year, month, 0).getDate();

    const cells = [];

    /*
       Предыдущий месяц
    */

    for (let i = startDay - 1; i >= 0; i--) {

        const day = previousMonthDays - i;

        const date = new Date(
            year,
            month - 1,
            day
        );

        cells.push({
            date,
            other: true
        });
    }

    /*
       Текущий месяц
    */

    for (let day = 1; day <= daysInMonth; day++) {

        cells.push({
            date: new Date(year, month, day),
            other: false
        });
    }

    /*
       Следующий месяц
    */

    let nextDay = 1;

    while (cells.length < 42) {

        cells.push({
            date: new Date(year, month + 1, nextDay),
            other: true
        });

        nextDay++;
    }

    const today = getTodayKey();

    grid.innerHTML = cells.map(cell => {

        const dateKey = getDateKey(cell.date);

        const progress =
            getProgressForDate(dateKey);

        const isToday =
            dateKey === today;

        return `
            <div
                class="calendar-day
                ${cell.other ? "other-month" : ""}
                ${isToday ? "today" : ""}"
                data-calendar-date="${dateKey}"
            >

                <div class="day-number">
                    ${cell.date.getDate()}
                </div>

                <div class="day-progress">

                    <div class="day-progress-text">
                        ${progress.total > 0
                            ? `${progress.percent}%`
                            : "—"}
                    </div>

                    <div class="day-progress-bar">

                        <div
                            class="day-progress-fill"
                            style="width:${progress.percent}%"
                        ></div>

                    </div>

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {

    const days = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(
            date.getDate() - i
        );

        const key = getDateKey(date);

        days.push({
            key,
            date,
            progress: getProgressForDate(key)
        });
    }

    const daysWithTasks =
        days.filter(day => day.progress.total > 0);

    let average = 0;

    if (daysWithTasks.length > 0) {

        average = Math.round(
            daysWithTasks.reduce(
                (sum, day) => sum + day.progress.percent,
                0
            ) / daysWithTasks.length
        );
    }

    const averageElement = $("#averageProgress");

    if (averageElement) {
        averageElement.textContent =
            `${average}%`;
    }

    /*
       Лучший день
    */

    let best = null;

    daysWithTasks.forEach(day => {

        if (
            !best ||
            day.progress.percent > best.progress.percent
        ) {
            best = day;
        }

    });

    const bestDay = $("#bestDay");

    if (bestDay) {

        bestDay.textContent = best
            ? `${best.progress.percent}%`
            : "—";
    }

    /*
       Всего выполнено
    */

    let totalCompleted = 0;

    tasks.forEach(task => {

        if (!task.completed) return;

        Object.values(task.completed).forEach(done => {

            if (done) {
                totalCompleted++;
            }

        });

    });

    const totalCompletedElement =
        $("#totalCompleted");

    if (totalCompletedElement) {
        totalCompletedElement.textContent =
            totalCompleted;
    }

    /*
       Chart
    */

    const chart = $("#weekChart");

    if (!chart) return;

    chart.innerHTML = days.map(day => {

        const percent =
            day.progress.percent;

        const label =
            day.date.toLocaleDateString(
                "ru-RU",
                { weekday: "short" }
            ).slice(0, 2);

        return `
            <div class="chart-column">

                <div
                    class="chart-bar"
                    style="height:${Math.max(percent, 3)}%"
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
   CHARACTER MESSAGE
   ========================================================= */

function renderCharacterMessage() {

    const element = $("#characterMessage");

    if (!element) return;

    const progress =
        getProgressForDate(getTodayKey());

    const messages = [];

    if (progress.total === 0) {

        messages.push(
            "Создай задачи. Дисциплина начинается с плана."
        );

    } else if (progress.percent === 0) {

        messages.push(
            "Не жди мотивации. Сделай первую задачу."
        );

    } else if (progress.percent < 50) {

        messages.push(
            "Хорошее начало. Теперь продолжай."
        );

    } else if (progress.percent < 100) {

        messages.push(
            "Ты уже прошёл больше половины. Дожми день."
        );

    } else {

        messages.push(
            "100%. Сегодня ты сделал то, что обещал себе."
        );
    }

    element.textContent =
        messages[Math.floor(Math.random() * messages.length)];
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function openPage(pageName) {

    const target =
        document.querySelector(`#page-${pageName}`);

    if (!target) return;

    $$(".page").forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    $$(".nav-link").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );

    });

    currentPage = pageName;

    /*
       Закрываем мобильное меню
    */

    const sidebar = $("#sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    /*
       При открытии страниц обновляем данные
    */

    if (pageName === "calendar") {
        renderCalendar();
    }

    if (pageName === "analytics") {
        renderAnalytics();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   MODAL
   ========================================================= */

function openTaskModal() {

    const modal = $("#addTaskPanel");

    if (!modal) return;

    modal.classList.add("active");

    setTimeout(() => {

        const input = $("#taskTitle");

        if (input) {
            input.focus();
        }

    }, 100);
}

function closeTaskModal() {

    const modal = $("#addTaskPanel");

    if (!modal) return;

    modal.classList.remove("active");

    const form = $("#taskForm");

    if (form) {
        form.reset();
    }

    /*
       После reset по умолчанию снова "Сегодня"
    */

    const repeatOnce = $("#repeatOnce");

    if (repeatOnce) {
        repeatOnce.checked = true;
    }

    updateRepeatDaysVisibility();
}


/* =========================================================
   REPEAT OPTIONS
   ========================================================= */

function getSelectedRepeat() {

    const selected =
        document.querySelector(
            'input[name="repeat"]:checked'
        );

    return selected
        ? selected.value
        : "once";
}

function updateRepeatDaysVisibility() {

    const repeat = getSelectedRepeat();

    const daysOptions =
        $("#daysOptions");

    if (!daysOptions) return;

    if (repeat === "custom") {
        daysOptions.classList.add("visible");
    } else {
        daysOptions.classList.remove("visible");
    }
}


/* =========================================================
   CREATE TASK
   ========================================================= */

function createTaskFromForm(event) {

    event.preventDefault();

    const titleInput = $("#taskTitle");

    const title =
        titleInput.value.trim();

    if (!title) {

        showToast("Введите название задачи.");

        titleInput.focus();

        return;
    }

    const category =
        $("#taskCategory").value;

    const priority =
        $("#taskPriority").value;

    const repeat =
        getSelectedRepeat();

    let days = [];

    if (repeat === "custom") {

        days = $$("#daysOptions input:checked")
            .map(input => Number(input.value));

        if (days.length === 0) {

            showToast(
                "Выбери хотя бы один день."
            );

            return;
        }
    }

    const task =
        createTaskObject(
            title,
            category,
            priority,
            repeat,
            days
        );

    tasks.push(task);

    saveTasks();

    closeTaskModal();

    renderAll();

    showToast(
        repeat === "daily"
            ? "Задача добавлена на все дни."
            : "Задача создана."
    );
}


/* =========================================================
   CALENDAR MONTH
   ========================================================= */

function changeMonth(amount) {

    calendarDate.setMonth(
        calendarDate.getMonth() + amount
    );

    renderCalendar();
}


/* =========================================================
   CALENDAR DATE CLICK
   ========================================================= */

function handleCalendarClick(dateKey) {

    const progress =
        getProgressForDate(dateKey);

    const date =
        parseDate(dateKey);

    showToast(
        `${formatDate(date)} — ${progress.percent}% (${progress.completed}/${progress.total})`
    );
}


/* =========================================================
   RESET DATA
   ========================================================= */

function resetAllData() {

    const confirmed = confirm(
        "Точно удалить ВСЕ задачи и историю?\n\nЭто действие нельзя отменить."
    );

    if (!confirmed) {
        return;
    }

    tasks = [];

    saveTasks();

    renderAll();

    showToast("Все данные удалены.");
}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification() {

    const progress =
        getProgressForDate(getTodayKey());

    if (progress.total === 0) {

        showToast(
            "Сегодня ещё нет задач."
        );

        return;
    }

    if (progress.percent === 100) {

        showToast(
            "Сегодняшний план выполнен на 100%."
        );

        return;
    }

    showToast(
        `Сегодня выполнено ${progress.percent}%. Осталось ${progress.total - progress.completed} задач.`
    );
}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

document.addEventListener("click", event => {

    /*
       Навигация
    */

    const navButton =
        event.target.closest(".nav-link");

    if (navButton) {

        const page =
            navButton.dataset.page;

        if (page) {
            openPage(page);
        }

        return;
    }

    /*
       Toggle task
    */

    const toggleButton =
        event.target.closest(
            '[data-action="toggle-task"]'
        );

    if (toggleButton) {

        const id =
            toggleButton.dataset.id;

        const date =
            toggleButton.dataset.date;

        toggleTask(id, date);

        return;
    }

    /*
       Delete task
    */

    const deleteButton =
        event.target.closest(
            '[data-action="delete-task"]'
        );

    if (deleteButton) {

        const id =
            deleteButton.dataset.id;

        deleteTask(id);

        return;
    }

    /*
       Calendar day
    */

    const calendarDay =
        event.target.closest(
            "[data-calendar-date]"
        );

    if (calendarDay) {

        handleCalendarClick(
            calendarDay.dataset.calendarDate
        );

        return;
    }

});


/* =========================================================
   DOM EVENTS
   ========================================================= */

function setupEvents() {

    /*
       Add task
    */

    const addTaskButton =
        $("#addTaskButton");

    if (addTaskButton) {
        addTaskButton.addEventListener(
            "click",
            openTaskModal
        );
    }

    /*
       Create task
    */

    const createTaskButton =
        $("#createTaskButton");

    if (createTaskButton) {
        createTaskButton.addEventListener(
            "click",
            openTaskModal
        );
    }

    /*
       Modal close
    */

    const closeButton =
        $("#closeTaskPanel");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeTaskModal
        );
    }

    /*
       Cancel
    */

    const cancelButton =
        $("#cancelTaskButton");

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeTaskModal
        );
    }

    /*
       Click outside modal
    */

    const modal =
        $("#addTaskPanel");

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {
                    closeTaskModal();
                }

            }
        );
    }

    /*
       Form
    */

    const form =
        $("#taskForm");

    if (form) {
        form.addEventListener(
            "submit",
            createTaskFromForm
        );
    }

    /*
       Repeat
    */

    $$('input[name="repeat"]').forEach(input => {

        input.addEventListener(
            "change",
            updateRepeatDaysVisibility
        );

    });

    /*
       Calendar
    */

    const previousMonth =
        $("#previousMonth");

    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => changeMonth(-1)
        );
    }

    const nextMonth =
        $("#nextMonth");

    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => changeMonth(1)
        );
    }

    /*
       Mobile menu
    */

    const mobileMenuButton =
        $("#mobileMenuButton");

    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            () => {

                const sidebar =
                    $("#sidebar");

                sidebar.classList.toggle("open");

            }
        );
    }

    /*
       Notification
    */

    const notificationButton =
        $("#notificationButton");

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            showNotification
        );
    }

    /*
       Reset
    */

    const resetButton =
        $("#resetDataButton");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetAllData
        );
    }

    /*
       Escape
    */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeTaskModal();
            }

        }
    );
}


/* =========================================================
   CURRENT DATE
   ========================================================= */

function renderCurrentDate() {

    const element =
        $("#currentDate");

    if (!element) return;

    const today =
        new Date();

    element.textContent =
        formatDate(today);
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

    renderCurrentDate();

    renderTodayTasks();

    renderAllTasks();

    renderProgress();

    renderStreak();

    renderScore();

    renderCalendar();

    renderAnalytics();

    renderCharacterMessage();
}


/* =========================================================
   INIT
   ========================================================= */

function init() {

    loadTasks();

    setupEvents();

    updateRepeatDaysVisibility();

    renderAll();

    openPage("dashboard");

    console.log(
        "ASCEND initialized successfully."
    );
}


/* =========================================================
   START
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}
