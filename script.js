"use strict";

/* =========================================
   ASCEND
   Основная логика
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

const currentDateElement = $("#currentDate");
const todayDateElement = $("#todayDate");

const dailyProgressElement = $("#dailyProgress");
const dailyProgressCircleElement =
    $("#dailyProgressCircle");

const completedTasksElement =
    $("#completedTasks");

const totalTasksElement =
    $("#totalTasks");

const sidebarProgressElement =
    $("#sidebarProgress");

const sidebarProgressFillElement =
    $("#sidebarProgressFill");

const streakValueElement =
    $("#streakValue");

const ascendScoreElement =
    $("#ascendScore");

const progressMessageElement =
    $("#progressMessage");

const tasksContainerElement =
    $("#tasksContainer");

const addTaskButtonElement =
    $("#addTaskButton");

const createTaskButtonElement =
    $("#createTaskButton");

const addTaskPanelElement =
    $("#addTaskPanel");

const closeTaskPanelButtonElement =
    $("#closeTaskPanel");

const cancelTaskButtonElement =
    $("#cancelTaskButton");

const taskFormElement =
    $("#taskForm");

const taskTitleElement =
    $("#taskTitle");

const taskCategoryElement =
    $("#taskCategory");

const taskPriorityElement =
    $("#taskPriority");

const notificationButtonElement =
    $("#notificationButton");

const analyticsButtonElement =
    $("#analyticsButton");

const sidebarElement =
    $("#sidebar");

const mobileMenuButtonElement =
    $("#mobileMenuButton");

const mobileOverlayElement =
    $("#mobileOverlay");


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
            localStorage.getItem(
                STORAGE_KEY
            );

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
   ДАТА
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


function createTaskObject(
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


/* =========================================
   ДОБАВЛЕНИЕ ЗАДАЧИ
========================================= */

function openTaskPanel() {

    if (!addTaskPanelElement) {
        return;
    }

    addTaskPanelElement.classList.add(
        "active"
    );

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

    addTaskPanelElement.classList.remove(
        "active"
    );
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

    const newTask =
        createTaskObject(
            title,
            taskCategoryElement
                ? taskCategoryElement.value
                : "Личное",
            taskPriorityElement
                ? taskPriorityElement.value
                : "normal"
        );

    tasks.push(newTask);

    saveTasks();

    if (taskFormElement) {
        taskFormElement.reset();
    }

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

    } else {

        showToast(
            "Задача снова открыта."
        );
    }
}


/* =========================================
   РЕНДЕР ЗАДАЧ
========================================= */

function renderTasks() {

    if (!tasksContainerElement) {
        return;
    }

    const todayTasks =
        getTodayTasks();

    tasksContainerElement.innerHTML = "";


    /* Нет задач */

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
                data-create-empty-task
            >
                Создать задачу
            </button>
        `;

        tasksContainerElement.appendChild(
            empty
        );


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


    /* Есть задачи */

    todayTasks.forEach(task => {

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


        /* Checkbox */

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
                ? "Отметить задачу как невыполненную"
                : "Отметить задачу как выполненную"
        );


        checkbox.addEventListener(
            "click",
            () => {

                toggleTask(
                    task.id
                );

            }
        );


        /* Контент */

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


        /* Статус */

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


        tasksContainerElement.appendChild(
            item
        );

    });
}


/* =========================================
   ДНЕВНОЙ ПРОГРЕСС
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
        calculateProgress(
            todayTasks
        );


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


    updateProgressRing(
        percentage
    );

    updateProgressMessage(
        percentage,
        total
    );
}


/* =========================================
   КРУГ ПРОГРЕССА
========================================= */

function updateProgressRing(
    percentage
) {

    if (!dailyProgressCircleElement) {
        return;
    }

    const radius = 58;

    const circumference =
        2 *
        Math.PI *
        radius;

    const offset =
        circumference -
        (
            percentage /
            100
        ) *
        circumference;


    dailyProgressCircleElement.style.strokeDasharray =
        `${circumference}`;

    dailyProgressCircleElement.style.strokeDashoffset =
        `${offset}`;
}


/* =========================================
   СООБЩЕНИЕ ПРОГРЕССА
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
   НЕДЕЛЬНЫЙ ПРОГРЕСС
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
                new Date(
                    weekStart
                );

            date.setDate(
                weekStart.getDate() +
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
       Если сегодня ещё не завершён,
       проверяем вчерашний день.
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

    if (streakValueElement) {

        streakValueElement.textContent =
            calculateStreak();
    }
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

    if (ascendScoreElement) {

        ascendScoreElement.textContent =
            calculateScore();
    }
}


/* =========================================
   КАЛЕНДАРЬ
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


    /* Дни недели */

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
            document.createElement(
                "div"
            );

        element.className =
            "calendar-weekday";

        element.textContent =
            day;

        calendarGrid.appendChild(
            element
        );
    });


    /* Первый день месяца */

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


    /* Количество дней */

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* Пустые клетки */

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

        calendarGrid.appendChild(
            empty
        );
    }


    /* Дни */

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
                ${
                    percentage > 0
                        ? percentage + "%"
                        : ""
                }
            </div>
        `;


        calendarGrid.appendChild(
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


                    /* Активная кнопка */

                    $$(".nav-link")
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    link.classList.add(
                        "active"
                    );


                    /* Скрываем страницы */

                    $$(".page")
                        .forEach(pageElement => {

                            pageElement.classList.remove(
                                "active"
                            );

                        });


                    /* Показываем нужную */

                    const target =
                        $(`#page-${page}`);


                    if (target) {

                        target.classList.add(
                            "active"
                        );
                    }


                    /* Обновляем календарь */

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

    if (sidebarElement) {

        sidebarElement.classList.add(
            "open"
        );
    }


    if (mobileOverlayElement) {

        mobileOverlayElement.classList.add(
            "active"
        );
    }
}


function closeMobileMenu() {

    if (sidebarElement) {

        sidebarElement.classList.remove(
            "open"
        );
    }


    if (mobileOverlayElement) {

        mobileOverlayElement.classList.remove(
            "active"
        );
    }
}


function toggleMobileMenu() {

    if (!sidebarElement) {
        return;
    }


    const opened =
        sidebarElement.classList.contains(
            "open"
        );


    if (opened) {

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

    const oldToast =
        $(".ascend-toast");


    if (oldToast) {
        oldToast.remove();
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
   АНАЛИТИКА
========================================= */

function openAnalytics() {

    const analyticsLink =
        $('.nav-link[data-page="analytics"]');


    if (analyticsLink) {

        analyticsLink.click();
    }
}


/* =========================================
   МОДАЛЬНОЕ ОКНО
========================================= */

function setupModal() {

    if (!addTaskPanelElement) {
        return;
    }


    addTaskPanelElement.addEventListener(
        "click",
        event => {

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
   СОБЫТИЯ
========================================= */

function setupEvents() {

    /* Добавить задачу */

    if (addTaskButtonElement) {

        addTaskButtonElement.addEventListener(
            "click",
            openTaskPanel
        );
    }


    /* Создать задачу */

    if (createTaskButtonElement) {

        createTaskButtonElement.addEventListener(
            "click",
            openTaskPanel
        );
    }


    /* Закрыть окно */

    if (closeTaskPanelButtonElement) {

        closeTaskPanelButtonElement.addEventListener(
            "click",
            closeTaskPanel
        );
    }


    /* Отмена */

    if (cancelTaskButtonElement) {

        cancelTaskButtonElement.addEventListener(
            "click",
            closeTaskPanel
        );
    }


    /* Форма */

    if (taskFormElement) {

        taskFormElement.addEventListener(
            "submit",
            handleTaskSubmit
        );
    }


    /* Мобильное меню */

    if (mobileMenuButtonElement) {

        mobileMenuButtonElement.addEventListener(
            "click",
            toggleMobileMenu
        );
    }


    /* Затемнение */

    if (mobileOverlayElement) {

        mobileOverlayElement.addEventListener(
            "click",
            closeMobileMenu
        );
    }


    /* Уведомления */

    if (notificationButtonElement) {

        notificationButtonElement.addEventListener(
            "click",
            showNotification
        );
    }


    /* Аналитика */

    if (analyticsButtonElement) {

        analyticsButtonElement.addEventListener(
            "click",
            openAnalytics
        );
    }
}


/* =========================================
   КЛАВИАТУРА
========================================= */

function setupKeyboard() {

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
   ОБНОВЛЕНИЕ
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
   ЗАПУСК
========================================= */

function init() {

    loadTasks();

    setupNavigation();

    setupEvents();

    setupModal();

    setupKeyboard();

    renderAll();

    console.log(
        "ASCEND успешно запущен."
    );
}


/* =========================================
   START
========================================= */

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
