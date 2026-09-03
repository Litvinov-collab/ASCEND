"use strict";

/* =========================================
   ASCEND
   Основная логика приложения
========================================= */

const STORAGE_KEY = "ASCEND_TASKS_V2";

let tasks = [];


/* =========================================
   DOM
========================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================
   ЭЛЕМЕНТЫ
========================================= */

const currentDate = $("#currentDate");
const todayDate = $("#todayDate");

const dailyProgress = $("#dailyProgress");
const dailyProgressCircle = $("#dailyProgressCircle");

const completedTasks = $("#completedTasks");
const totalTasks = $("#totalTasks");

const sidebarProgress = $("#sidebarProgress");
const sidebarProgressFill = $("#sidebarProgressFill");

const streakValue = $("#streakValue");
const ascendScore = $("#ascendScore");

const progressMessage = $("#progressMessage");

const tasksContainer = $("#tasksContainer");

const addTaskButton = $("#addTaskButton");
const createTaskButton = $("#createTaskButton");

const addTaskPanel = $("#addTaskPanel");
const closeTaskPanel = $("#closeTaskPanel");
const cancelTaskButton = $("#cancelTaskButton");

const taskForm = $("#taskForm");
const taskTitle = $("#taskTitle");
const taskCategory = $("#taskCategory");
const taskPriority = $("#taskPriority");

const notificationButton = $("#notificationButton");
const analyticsButton = $("#analyticsButton");

const sidebar = $("#sidebar");
const mobileMenuButton = $("#mobileMenuButton");
const mobileOverlay = $("#mobileOverlay");


/* =========================================
   ДАТЫ
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
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


/* =========================================
   LOCAL STORAGE
========================================= */

function loadTasks() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

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

        console.error(
            "Ошибка загрузки задач:",
            error
        );

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

        console.error(
            "Ошибка сохранения задач:",
            error
        );
    }
}


/* =========================================
   ДАТА НА ЭКРАНЕ
========================================= */

function updateDate() {

    const now = new Date();

    if (currentDate) {

        currentDate.textContent =
            formatFullDate(now);
    }

    if (todayDate) {

        todayDate.textContent =
            formatShortDate(now);
    }
}


/* =========================================
   ЗАДАЧИ
========================================= */

function getTodayTasks() {

    const today =
        getTodayKey();

    return tasks.filter(
        task => task.date === today
    );
}


function getTasksForDate(dateKey) {

    return tasks.filter(
        task => task.date === dateKey
    );
}


function createTask(
    title,
    category,
    priority
) {

    return {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 8),

        title:
            title.trim(),

        category:
            category || "Личное",

        priority:
            priority || "normal",

        completed:
            false,

        date:
            getTodayKey(),

        createdAt:
            new Date().toISOString()
    };
}


/* =========================================
   ДОБАВЛЕНИЕ ЗАДАЧИ
========================================= */

function openTaskPanel() {

    if (!addTaskPanel) {
        return;
    }

    addTaskPanel.classList.add("active");

    setTimeout(() => {

        taskTitle?.focus();

    }, 100);
}


function closeTaskPanel() {

    addTaskPanel?.classList.remove(
        "active"
    );
}


function handleTaskSubmit(event) {

    event.preventDefault();

    const title =
        taskTitle.value.trim();

    if (!title) {

        taskTitle.focus();

        return;
    }

    const newTask =
        createTask(
            title,
            taskCategory.value,
            taskPriority.value
        );

    tasks.push(newTask);

    saveTasks();

    taskForm.reset();

    closeTaskPanel();

    renderAll();

    showToast(
        "Задача добавлена."
    );
}


/* =========================================
   ПЕРЕКЛЮЧЕНИЕ ЗАДАЧИ
========================================= */

function toggleTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    task.completed =
        !task.completed;

    saveTasks();

    renderAll();

    if (task.completed) {

        showToast(
            "Задача выполнена."
        );
    }
}


/* =========================================
   ПРОГРЕСС
========================================= */

function calculateProgress(taskList) {

    if (!taskList.length) {
        return 0;
    }

    const completed =
        taskList.filter(
            task => task.completed
        ).length;

    return Math.round(
        completed /
        taskList.length *
        100
    );
}


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
        calculateProgress(
            todayTasks
        );


    completedTasks.textContent =
        completed;

    totalTasks.textContent =
        total;

    dailyProgress.textContent =
        `${percentage}%`;

    sidebarProgress.textContent =
        `${percentage}%`;

    sidebarProgressFill.style.width =
        `${percentage}%`;


    updateProgressRing(
        percentage
    );

    updateProgressMessage(
        percentage,
        total
    );
}


function updateProgressRing(
    percentage
) {

    const radius = 58;

    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        percentage /
        100 *
        circumference;

    dailyProgressCircle.style.strokeDasharray =
        circumference;

    dailyProgressCircle.style.strokeDashoffset =
        offset;
}


function updateProgressMessage(
    percentage,
    total
) {

    if (total === 0) {

        progressMessage.textContent =
            "Создай первую задачу.";

        return;
    }

    if (percentage === 0) {

        progressMessage.textContent =
            "Начни день. Первый шаг за тобой.";

        return;
    }

    if (percentage < 50) {

        progressMessage.textContent =
            "Хорошее начало. Продолжай.";

        return;
    }

    if (percentage < 100) {

        progressMessage.textContent =
            "Ты близко. Доведи дело до конца.";

        return;
    }

    progressMessage.textContent =
        "День выполнен. Ты сделал это.";
}


/* =========================================
   РЕНДЕР ЗАДАЧ
========================================= */

function renderTasks() {

    const todayTasks =
        getTodayTasks();

    tasksContainer.innerHTML = "";


    if (!todayTasks.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-state";

        empty.innerHTML = `
            <div class="empty-icon">
                +
            </div>

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
                data-empty-create
            >
                Создать задачу
            </button>
        `;

        tasksContainer.appendChild(
            empty
        );

        empty
            .querySelector(
                "[data-empty-create]"
            )
            .addEventListener(
                "click",
                openTaskPanel
            );

        return;
    }


    todayTasks.forEach(
        task => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "task-item";

            if (task.completed) {

                item.classList.add(
                    "completed"
                );
            }


            const checkbox =
                document.createElement(
                    "button"
                );

            checkbox.type =
                "button";

            checkbox.className =
                "task-checkbox";

            checkbox.textContent =
                task.completed
                    ? "✓"
                    : "";

            checkbox.setAttribute(
                "aria-label",
                task.completed
                    ? "Отметить как невыполненную"
                    : "Отметить как выполненную"
            );


            checkbox.addEventListener(
                "click",
                () =>
                    toggleTask(
                        task.id
                    )
            );


            const content =
                document.createElement(
                    "div"
                );

            content.className =
                "task-content";


            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "task-title";

            title.textContent =
                task.title;


            const category =
                document.createElement(
                    "div"
                );

            category.className =
                "task-category";

            category.textContent =
                task.category;


            content.appendChild(
                title
            );

            content.appendChild(
                category
            );


            const status =
                document.createElement(
                    "div"
                );

            status.className =
                "task-status";

            status.textContent =
                task.completed
                    ? "ВЫПОЛНЕНО"
                    : "ОТКРЫТО";


            item.appendChild(
                checkbox
            );

            item.appendChild(
                content
            );

            item.appendChild(
                status
            );


            tasksContainer.appendChild(
                item
            );
        }
    );
}


/* =========================================
   НЕДЕЛЯ
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
        result.getDate() +
        difference
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

    const start =
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


    $$(".week-day")
        .forEach(dayElement => {

            const dayName =
                dayElement.dataset.day;

            const index =
                dayNames.indexOf(
                    dayName
                );

            if (index === -1) {
                return;
            }


            const date =
                new Date(start);

            date.setDate(
                start.getDate() +
                index
            );


            const dateKey =
                getDateKey(date);

            const dayTasks =
                getTasksForDate(
                    dateKey
                );

            const percentage =
                calculateProgress(
                    dayTasks
                );


            const progress =
                dayElement.querySelector(
                    ".week-day-progress"
                );

            const fill =
                dayElement.querySelector(
                    ".week-day-fill"
                );


            progress.textContent =
                `${percentage}%`;

            fill.style.width =
                `${percentage}%`;


            dayElement.classList.toggle(
                "active",
                dateKey ===
                getTodayKey()
            );
        });
}


/* =========================================
   STREAK
========================================= */

function isCompletedDay(
    dateKey
) {

    const dayTasks =
        getTasksForDate(
            dateKey
        );

    if (!dayTasks.length) {
        return false;
    }

    return dayTasks.every(
        task => task.completed
    );
}


function calculateStreak() {

    let streak = 0;

    const today =
        new Date();

    let cursor =
        new Date(today);


    /*
       Если сегодняшний день ещё
       не завершён, смотрим вчера.
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

    streakValue.textContent =
        calculateStreak();
}


/* =========================================
   ASCEND SCORE
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

    ascendScore.textContent =
        calculateScore();
}


/* =========================================
   КАЛЕНДАРЬ
========================================= */

function renderCalendar() {

    const grid =
        $("#calendarGrid");

    const monthTitle =
        $("#calendarMonth");

    if (!grid) {
        return;
    }


    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth();


    monthTitle.textContent =
        new Intl.DateTimeFormat(
            "ru-RU",
            {
                month: "long",
                year: "numeric"
            }
        ).format(now);


    grid.innerHTML = "";


    const weekdays = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Вс"
    ];


    weekdays.forEach(
        day => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "calendar-weekday";

            element.textContent =
                day;

            grid.appendChild(
                element
            );
        }
    );


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
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day empty";

        grid.appendChild(
            empty
        );
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
            getTasksForDate(
                dateKey
            );

        const percentage =
            calculateProgress(
                dayTasks
            );


        const element =
            document.createElement(
                "div"
            );

        element.className =
            "calendar-day";


        if (
            dateKey ===
            getTodayKey()
        ) {

            element.classList.add(
                "today"
            );
        }


        element.innerHTML = `
            <div class="calendar-day-number">
                ${day}
            </div>

            <div class="calendar-day-progress">
                ${percentage > 0
                    ? percentage + "%"
                    : ""}
            </div>
        `;


        grid.appendChild(
            element
        );
    }
}


/* =========================================
   НАВИГАЦИЯ
========================================= */

function setupNavigation() {

    $$(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    const page =
                        link.dataset.page;

                    $$(".nav-link")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    link.classList.add(
                        "active"
                    );


                    $$(".page")
                        .forEach(
                            section =>
                                section.classList.remove(
                                    "active"
                                )
                        );


                    const target =
                        $(`#page-${page}`);


                    if (target) {

                        target.classList.add(
                            "active"
                        );
                    }


                    if (
                        page ===
                        "calendar"
                    ) {

                        renderCalendar();
                    }


                    closeMobileMenu();

                    window.scrollTo(
                        {
                            top: 0,
                            behavior: "smooth"
                        }
                    );
                }
            );
        });
}


/* =========================================
   МОБИЛЬНОЕ МЕНЮ
========================================= */

function openMobileMenu() {

    sidebar.classList.add(
        "open"
    );

    mobileOverlay.classList.add(
        "active"
    );
}


function closeMobileMenu() {

    sidebar.classList.remove(
        "open"
    );

    mobileOverlay.classList.remove(
        "active"
    );
}


function toggleMobileMenu() {

    if (
        sidebar.classList.contains(
            "open"
        )
    ) {

        closeMobileMenu();

    } else {

        openMobileMenu();
    }
}


/* =========================================
   УВЕДОМЛЕНИЯ
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
            "Все задачи на сегодня выполнены."
        );

        return;
    }


    showToast(
        `Осталось задач: ${remaining}`
    );
}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    const old =
        $(".ascend-toast");

    if (old) {
        old.remove();
    }


    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "ascend-toast";

    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transition =
            "opacity 0.25s ease";

        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 1800);
}


/* =========================================
   КНОПКА АНАЛИТИКИ
========================================= */

function openAnalytics() {

    const analyticsLink =
        $('.nav-link[data-page="analytics"]');

    analyticsLink?.click();
}


/* =========================================
   ЗАКРЫТИЕ МОДАЛКИ
========================================= */

function setupModal() {

    addTaskPanel.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                addTaskPanel
            ) {

                closeTaskPanel();
            }
        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeTaskPanel();

                closeMobileMenu();
            }
        }
    );
}


/* =========================================
   ВСЁ ОБНОВИТЬ
========================================= */

function renderAll() {

    updateDate();

    renderTasks();

    updateDailyProgress();

    updateWeek();

    updateStreak();

    updateScore();

    renderCalendar();
}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    addTaskButton?.addEventListener(
        "click",
        openTaskPanel
    );


    createTaskButton?.addEventListener(
        "click",
        openTaskPanel
    );


    closeTaskPanel?.addEventListener(
        "click",
        closeTaskPanel
    );


    cancelTaskButton?.addEventListener(
        "click",
        closeTaskPanel
    );


    taskForm?.addEventListener(
        "submit",
        handleTaskSubmit
    );


    mobileMenuButton?.addEventListener(
        "click",
        toggleMobileMenu
    );


    mobileOverlay?.addEventListener(
        "click",
        closeMobileMenu
    );


    notificationButton?.addEventListener(
        "click",
        showNotification
    );


    analyticsButton?.addEventListener(
        "click",
        openAnalytics
    );
}


/* =========================================
   START ASCEND
========================================= */

function init() {

    loadTasks();

    setupNavigation();

    setupEvents();

    setupModal();

    renderAll();

    console.log(
        "ASCEND запущен."
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
