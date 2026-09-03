"use strict";

/* =========================================
   ASCEND
   Полностью синхронизированная логика
========================================= */

const STORAGE_KEY = "ASCEND_TASKS_V3";

let tasks = [];


/* =========================================
   DOM HELPERS
========================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}


/* =========================================
   DOM ELEMENTS
========================================= */

const currentDateElement = $("#currentDate");
const todayDateElement = $("#todayDate");

const dailyProgressElement = $("#dailyProgress");
const dailyProgressCircleElement = $("#dailyProgressCircle");

const completedTasksElement = $("#completedTasks");
const totalTasksElement = $("#totalTasks");

const sidebarProgressElement = $("#sidebarProgress");
const sidebarProgressFillElement = $("#sidebarProgressFill");

const streakValueElement = $("#streakValue");
const ascendScoreElement = $("#ascendScore");

const progressMessageElement = $("#progressMessage");

const tasksContainerElement = $("#tasksContainer");
const tasksPageContainerElement = $("#tasksPageContainer");

const addTaskButtonElement = $("#addTaskButton");
const createTaskButtonElement = $("#createTaskButton");
const tasksPageAddButtonElement = $("#tasksPageAddButton");

const addTaskPanelElement = $("#addTaskPanel");
const closeTaskPanelButtonElement = $("#closeTaskPanel");
const cancelTaskButtonElement = $("#cancelTaskButton");

const taskFormElement = $("#taskForm");
const taskTitleElement = $("#taskTitle");
const taskCategoryElement = $("#taskCategory");
const taskPriorityElement = $("#taskPriority");

const notificationButtonElement = $("#notificationButton");
const analyticsButtonElement = $("#analyticsButton");

const sidebarElement = $("#sidebar");
const mobileMenuButtonElement = $("#mobileMenuButton");
const mobileOverlayElement = $("#mobileOverlay");

const profileNameElement = $("#profileName");
const profileScoreElement = $("#profileScore");
const profileStreakElement = $("#profileStreak");
const profileCompletedElement = $("#profileCompleted");

const analyticsTotalElement = $("#analyticsTotal");
const analyticsCompletedElement = $("#analyticsCompleted");
const analyticsPercentElement = $("#analyticsPercent");


/* =========================================
   DATE
========================================= */

function pad(number) {
    return String(number).padStart(2, "0");
}


function getDateKey(date = new Date()) {
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");
}


function getTodayKey() {
    return getDateKey(new Date());
}


function formatFullDate(date = new Date()) {
    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


function formatShortDate(date = new Date()) {
    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


/* =========================================
   STORAGE
========================================= */

function loadTasks() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            tasks = [];
            return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            tasks = [];
            return;
        }

        tasks = parsed.filter(task => {

            return (
                task &&
                typeof task === "object" &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.date === "string"
            );

        });

    } catch (error) {

        console.error("ASCEND: ошибка загрузки:", error);

        tasks = [];
    }
}


function saveTasks() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );

    } catch (error) {

        console.error("ASCEND: ошибка сохранения:", error);
    }
}


/* =========================================
   DATE UI
========================================= */

function updateDate() {

    const now = new Date();

    if (currentDateElement) {
        currentDateElement.textContent =
            formatFullDate(now);
    }

    if (todayDateElement) {
        todayDateElement.textContent =
            formatShortDate(now);
    }
}


/* =========================================
   TASKS
========================================= */

function getTodayTasks() {

    const today = getTodayKey();

    return tasks.filter(task => task.date === today);
}


function getTasksForDate(dateKey) {

    return tasks.filter(task => task.date === dateKey);
}


function createTaskObject(
    title,
    category,
    priority
) {

    return {

        id:
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 10),

        title: title.trim(),

        category:
            category || "Личное",

        priority:
            priority || "normal",

        completed: false,

        date: getTodayKey(),

        createdAt: new Date().toISOString()
    };
}


/* =========================================
   PROGRESS
========================================= */

function calculateProgress(taskList) {

    if (!taskList || taskList.length === 0) {
        return 0;
    }

    const completed = taskList.filter(
        task => task.completed
    ).length;

    return Math.round(
        completed / taskList.length * 100
    );
}


/* =========================================
   TASK MODAL
========================================= */

function openTaskPanel() {

    if (!addTaskPanelElement) {
        return;
    }

    addTaskPanelElement.classList.add("active");

    document.body.style.overflow = "hidden";

    setTimeout(() => {

        if (taskTitleElement) {
            taskTitleElement.focus();
        }

    }, 100);
}


function closeTaskPanel() {

    if (!addTaskPanelElement) {
        return;
    }

    addTaskPanelElement.classList.remove("active");

    document.body.style.overflow = "";
}


function handleTaskSubmit(event) {

    event.preventDefault();

    if (!taskTitleElement) {
        return;
    }

    const title =
        taskTitleElement.value.trim();

    if (!title) {

        taskTitleElement.focus();

        return;
    }

    const category =
        taskCategoryElement
            ? taskCategoryElement.value
            : "Личное";

    const priority =
        taskPriorityElement
            ? taskPriorityElement.value
            : "normal";

    const newTask =
        createTaskObject(
            title,
            category,
            priority
        );

    tasks.push(newTask);

    saveTasks();

    if (taskFormElement) {
        taskFormElement.reset();
    }

    closeTaskPanel();

    renderAll();

    showToast("Задача добавлена.");
}


/* =========================================
   TOGGLE TASK
========================================= */

function toggleTask(taskId) {

    const task =
        tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    task.completed =
        !Boolean(task.completed);

    saveTasks();

    renderAll();

    if (task.completed) {
        showToast("Задача выполнена ✓");
    } else {
        showToast("Задача снова открыта.");
    }
}


/* =========================================
   CREATE TASK ELEMENT
========================================= */

function createTaskElement(task) {

    const item =
        document.createElement("div");

    item.className = "task-item";

    if (task.completed) {
        item.classList.add("completed");
    }


    const checkbox =
        document.createElement("button");

    checkbox.type = "button";

    checkbox.className = "task-checkbox";

    checkbox.textContent =
        task.completed
            ? "✓"
            : "";

    checkbox.setAttribute(
        "aria-label",
        task.completed
            ? "Отметить невыполненной"
            : "Отметить выполненной"
    );

    checkbox.addEventListener(
        "click",
        function(event) {

            event.preventDefault();
            event.stopPropagation();

            toggleTask(task.id);
        }
    );


    const content =
        document.createElement("div");

    content.className = "task-content";


    const title =
        document.createElement("div");

    title.className = "task-title";

    title.textContent = task.title;


    const category =
        document.createElement("div");

    category.className = "task-category";

    category.textContent =
        `${task.category} • ${
            getPriorityName(task.priority)
        }`;


    content.appendChild(title);
    content.appendChild(category);


    const status =
        document.createElement("div");

    status.className = "task-status";

    status.textContent =
        task.completed
            ? "ВЫПОЛНЕНО"
            : "ОТКРЫТО";


    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(status);

    return item;
}


function getPriorityName(priority) {

    switch (priority) {

        case "high":
            return "Высокий";

        case "low":
            return "Низкий";

        default:
            return "Обычный";
    }
}


/* =========================================
   RENDER TODAY TASKS
========================================= */

function renderTasks() {

    if (!tasksContainerElement) {
        return;
    }

    const todayTasks =
        getTodayTasks();

    tasksContainerElement.innerHTML = "";


    if (todayTasks.length === 0) {

        const empty =
            document.createElement("div");

        empty.className = "empty-state";

        empty.innerHTML = `
            <div class="empty-icon">+</div>

            <h3>
                Пока нет задач
            </h3>

            <p>
                Создай первую задачу
                и начни сегодняшний день.
            </p>

            <button
                class="primary-button"
                type="button"
                data-create-empty-task
            >
                Создать задачу
            </button>
        `;

        tasksContainerElement.appendChild(empty);


        const button =
            empty.querySelector(
                "[data-create-empty-task]"
            );

        if (button) {

            button.addEventListener(
                "click",
                openTaskPanel
            );
        }

        return;
    }


    todayTasks.forEach(task => {

        tasksContainerElement.appendChild(
            createTaskElement(task)
        );

    });
}


/* =========================================
   TASKS PAGE
========================================= */

function renderTasksPage() {

    if (!tasksPageContainerElement) {
        return;
    }

    const todayTasks =
        getTodayTasks();

    tasksPageContainerElement.innerHTML = "";


    if (!todayTasks.length) {

        const message =
            document.createElement("div");

        message.className = "empty-state";

        message.innerHTML = `
            <div class="empty-icon">✓</div>

            <h3>
                Список задач пуст
            </h3>

            <p>
                Добавь первую задачу.
            </p>
        `;

        tasksPageContainerElement.appendChild(
            message
        );

        return;
    }


    todayTasks.forEach(task => {

        tasksPageContainerElement.appendChild(
            createTaskElement(task)
        );

    });
}


/* =========================================
   DAILY PROGRESS
========================================= */

function updateDailyProgress() {

    const todayTasks =
        getTodayTasks();

    const total =
        todayTasks.length;

    const completed =
        todayTasks.filter(
            task => task.completed
        ).length;

    const percentage =
        calculateProgress(todayTasks);


    if (completedTasksElement) {
        completedTasksElement.textContent =
            completed;
    }

    if (totalTasksElement) {
        totalTasksElement.textContent =
            total;
    }

    if (dailyProgressElement) {
        dailyProgressElement.textContent =
            `${percentage}%`;
    }

    if (sidebarProgressElement) {
        sidebarProgressElement.textContent =
            `${percentage}%`;
    }

    if (sidebarProgressFillElement) {
        sidebarProgressFillElement.style.width =
            `${percentage}%`;
    }

    updateProgressRing(percentage);

    updateProgressMessage(
        percentage,
        total
    );
}


/* =========================================
   PROGRESS RING
========================================= */

function updateProgressRing(percentage) {

    if (!dailyProgressCircleElement) {
        return;
    }

    const radius = 58;

    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        percentage / 100 *
        circumference;


    dailyProgressCircleElement.style.strokeDasharray =
        `${circumference}`;

    dailyProgressCircleElement.style.strokeDashoffset =
        `${offset}`;
}


/* =========================================
   MESSAGE
========================================= */

function updateProgressMessage(
    percentage,
    total
) {

    if (!progressMessageElement) {
        return;
    }


    if (total === 0) {

        progressMessageElement.textContent =
            "Создай первую задачу.";

        return;
    }


    if (percentage === 0) {

        progressMessageElement.textContent =
            "Начни день. Первый шаг за тобой.";

        return;
    }


    if (percentage < 50) {

        progressMessageElement.textContent =
            "Хорошее начало. Продолжай.";

        return;
    }


    if (percentage < 100) {

        progressMessageElement.textContent =
            "Ты близко. Доведи дело до конца.";

        return;
    }


    progressMessageElement.textContent =
        "День выполнен. Ты сделал это.";
}


/* =========================================
   WEEK
========================================= */

function getStartOfWeek(
    date = new Date()
) {

    const result =
        new Date(date);

    const day =
        result.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() + difference
    );

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function updateWeek() {

    const weekStart =
        getStartOfWeek();

    const dayNames = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];


    $$(".week-day").forEach(
        dayElement => {

            const dayName =
                dayElement.dataset.day;

            const index =
                dayNames.indexOf(dayName);

            if (index === -1) {
                return;
            }


            const date =
                new Date(weekStart);

            date.setDate(
                weekStart.getDate() + index
            );


            const dateKey =
                getDateKey(date);

            const dayTasks =
                getTasksForDate(dateKey);

            const percentage =
                calculateProgress(dayTasks);


            const progress =
                dayElement.querySelector(
                    ".week-day-progress"
                );

            const fill =
                dayElement.querySelector(
                    ".week-day-fill"
                );


            if (progress) {
                progress.textContent =
                    `${percentage}%`;
            }

            if (fill) {
                fill.style.width =
                    `${percentage}%`;
            }


            dayElement.classList.toggle(
                "active",
                dateKey === getTodayKey()
            );
        }
    );
}


/* =========================================
   STREAK
========================================= */

function isCompletedDay(dateKey) {

    const dayTasks =
        getTasksForDate(dateKey);

    if (!dayTasks.length) {
        return false;
    }

    return dayTasks.every(
        task => task.completed
    );
}


function calculateStreak() {

    let streak = 0;

    const cursor =
        new Date();


    /*
        Сегодня полностью выполнен —
        считаем сегодня.

        Сегодня ещё не выполнен —
        начинаем со вчера.
    */

    if (
        !isCompletedDay(
            getDateKey(cursor)
        )
    ) {

        cursor.setDate(
            cursor.getDate() - 1
        );
    }


    while (
        isCompletedDay(
            getDateKey(cursor)
        )
    ) {

        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );
    }


    return streak;
}


function updateStreak() {

    const streak =
        calculateStreak();

    if (streakValueElement) {
        streakValueElement.textContent =
            streak;
    }

    if (profileStreakElement) {
        profileStreakElement.textContent =
            streak;
    }
}


/* =========================================
   SCORE
========================================= */

function calculateScore() {

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    return Math.min(
        completed * 10,
        1000
    );
}


function updateScore() {

    const score =
        calculateScore();

    if (ascendScoreElement) {
        ascendScoreElement.textContent =
            score;
    }

    if (profileScoreElement) {
        profileScoreElement.textContent =
            score;
    }
}


/* =========================================
   CALENDAR
========================================= */

function renderCalendar() {

    const calendarGrid =
        $("#calendarGrid");

    const calendarMonth =
        $("#calendarMonth");


    if (
        !calendarGrid ||
        !calendarMonth
    ) {
        return;
    }


    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth();


    calendarMonth.textContent =
        new Intl.DateTimeFormat(
            "ru-RU",
            {
                month: "long",
                year: "numeric"
            }
        ).format(now);


    calendarGrid.innerHTML = "";


    const weekdays = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Вс"
    ];


    weekdays.forEach(day => {

        const element =
            document.createElement("div");

        element.className =
            "calendar-weekday";

        element.textContent =
            day;

        calendarGrid.appendChild(element);

    });


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    let startDay =
        firstDay.getDay();

    if (startDay === 0) {
        startDay = 7;
    }


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 1;
        i < startDay;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day empty";

        calendarGrid.appendChild(empty);
    }


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

        const dateKey =
            getDateKey(date);

        const dayTasks =
            getTasksForDate(dateKey);

        const percentage =
            calculateProgress(dayTasks);


        const element =
            document.createElement("div");

        element.className =
            "calendar-day";


        if (dateKey === getTodayKey()) {
            element.classList.add("today");
        }


        element.innerHTML = `
            <div class="calendar-day-number">
                ${day}
            </div>

            <div class="calendar-day-progress">
                ${
                    dayTasks.length
                        ? `${percentage}%`
                        : ""
                }
            </div>
        `;


        calendarGrid.appendChild(element);
    }
}


/* =========================================
   ANALYTICS
========================================= */

function updateAnalytics() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    const percentage =
        total
            ? Math.round(
                completed / total * 100
            )
            : 0;


    if (analyticsTotalElement) {
        analyticsTotalElement.textContent =
            total;
    }

    if (analyticsCompletedElement) {
        analyticsCompletedElement.textContent =
            completed;
    }

    if (analyticsPercentElement) {
        analyticsPercentElement.textContent =
            `${percentage}%`;
    }

    if (profileCompletedElement) {
        profileCompletedElement.textContent =
            completed;
    }
}


/* =========================================
   NAVIGATION
========================================= */

function activatePage(pageName) {

    const target =
        $(`#page-${pageName}`);

    if (!target) {
        return;
    }


    $$(".page").forEach(page => {

        page.classList.remove("active");

    });


    target.classList.add("active");


    $$(".nav-link").forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );

    });


    if (pageName === "calendar") {
        renderCalendar();
    }

    if (pageName === "tasks") {
        renderTasksPage();
    }

    if (pageName === "analytics") {
        updateAnalytics();
    }

    if (pageName === "profile") {
        updateProfile();
    }


    closeMobileMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function setupNavigation() {

    $$(".nav-link").forEach(link => {

        link.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const page =
                    link.dataset.page;

                if (!page) {
                    return;
                }

                activatePage(page);
            }
        );

    });
}


/* =========================================
   PROFILE
========================================= */

function updateProfile() {

    const score =
        calculateScore();

    const streak =
        calculateStreak();

    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    if (profileNameElement) {
        profileNameElement.textContent =
            "ASCENDER";
    }

    if (profileScoreElement) {
        profileScoreElement.textContent =
            score;
    }

    if (profileStreakElement) {
        profileStreakElement.textContent =
            streak;
    }

    if (profileCompletedElement) {
        profileCompletedElement.textContent =
            completed;
    }
}


/* =========================================
   MOBILE MENU
========================================= */

function openMobileMenu() {

    if (sidebarElement) {
        sidebarElement.classList.add("open");
    }

    if (mobileOverlayElement) {
        mobileOverlayElement.classList.add("active");
    }
}


function closeMobileMenu() {

    if (sidebarElement) {
        sidebarElement.classList.remove("open");
    }

    if (mobileOverlayElement) {
        mobileOverlayElement.classList.remove("active");
    }
}


function toggleMobileMenu() {

    if (!sidebarElement) {
        return;
    }

    if (
        sidebarElement.classList.contains("open")
    ) {

        closeMobileMenu();

    } else {

        openMobileMenu();
    }
}


/* =========================================
   NOTIFICATIONS
========================================= */

function showNotification() {

    const todayTasks =
        getTodayTasks();


    if (!todayTasks.length) {

        showToast(
            "На сегодня задач нет."
        );

        return;
    }


    const remaining =
        todayTasks.filter(
            task => !task.completed
        ).length;


    if (remaining === 0) {

        showToast(
            "Все задачи на сегодня выполнены ✓"
        );

        return;
    }


    showToast(
        `Осталось задач: ${remaining}`
    );
}


/* =========================================
   ANALYTICS BUTTON
========================================= */

function openAnalytics() {
    activatePage("analytics");
}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    const oldToast =
        $(".ascend-toast");

    if (oldToast) {
        oldToast.remove();
    }


    const toast =
        document.createElement("div");

    toast.className =
        "ascend-toast";

    toast.textContent =
        message;


    document.body.appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transition =
            "opacity 0.25s ease";


        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 1800);
}


/* =========================================
   MODAL
========================================= */

function setupModal() {

    if (!addTaskPanelElement) {
        return;
    }


    addTaskPanelElement.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                addTaskPanelElement
            ) {

                closeTaskPanel();
            }
        }
    );
}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    if (addTaskButtonElement) {

        addTaskButtonElement.addEventListener(
            "click",
            openTaskPanel
        );
    }


    if (createTaskButtonElement) {

        createTaskButtonElement.addEventListener(
            "click",
            openTaskPanel
        );
    }


    if (tasksPageAddButtonElement) {

        tasksPageAddButtonElement.addEventListener(
            "click",
            openTaskPanel
        );
    }


    if (closeTaskPanelButtonElement) {

        closeTaskPanelButtonElement.addEventListener(
            "click",
            closeTaskPanel
        );
    }


    if (cancelTaskButtonElement) {

        cancelTaskButtonElement.addEventListener(
            "click",
            closeTaskPanel
        );
    }


    if (taskFormElement) {

        taskFormElement.addEventListener(
            "submit",
            handleTaskSubmit
        );
    }


    if (mobileMenuButtonElement) {

        mobileMenuButtonElement.addEventListener(
            "click",
            toggleMobileMenu
        );
    }


    if (mobileOverlayElement) {

        mobileOverlayElement.addEventListener(
            "click",
            closeMobileMenu
        );
    }


    if (notificationButtonElement) {

        notificationButtonElement.addEventListener(
            "click",
            showNotification
        );
    }


    if (analyticsButtonElement) {

        analyticsButtonElement.addEventListener(
            "click",
            openAnalytics
        );
    }
}


/* =========================================
   KEYBOARD
========================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Escape") {

                closeTaskPanel();
                closeMobileMenu();
            }
        }
    );
}


/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

    updateDate();

    renderTasks();

    renderTasksPage();

    updateDailyProgress();

    updateWeek();

    updateStreak();

    updateScore();

    updateAnalytics();

    updateProfile();

    renderCalendar();
}


/* =========================================
   INIT
========================================= */

function init() {

    console.log("ASCEND: запуск...");

    loadTasks();

    setupNavigation();

    setupEvents();

    setupModal();

    setupKeyboard();

    renderAll();

    console.log(
        "ASCEND: приложение успешно запущено."
    );
}


/* =========================================
   START
========================================= */

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
