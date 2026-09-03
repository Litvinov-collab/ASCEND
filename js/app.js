/* =========================================================
   ASCEND
   Main JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "ascend_tasks_v1";
const USER_KEY = "ascend_user_v1";

/* =========================================================
   DOM
   ========================================================= */

const elements = {
    currentDate: document.getElementById("currentDate"),
    todayDate: document.getElementById("todayDate"),

    dailyProgress: document.getElementById("dailyProgress"),
    dailyProgressCircle: document.getElementById("dailyProgressCircle"),

    completedTasks: document.getElementById("completedTasks"),
    totalTasks: document.getElementById("totalTasks"),

    sidebarProgress: document.getElementById("sidebarProgress"),
    sidebarProgressFill: document.getElementById("sidebarProgressFill"),

    streakValue: document.getElementById("streakValue"),
    ascendScore: document.getElementById("ascendScore"),

    progressMessage: document.getElementById("progressMessage"),

    tasksContainer: document.getElementById("tasksContainer"),
    emptyState: document.getElementById("emptyState"),

    addTaskPanel: document.getElementById("addTaskPanel"),

    addTaskButton: document.getElementById("addTaskButton"),
    createTaskButton: document.getElementById("createTaskButton"),

    closeTaskPanel: document.getElementById("closeTaskPanel"),
    cancelTaskButton: document.getElementById("cancelTaskButton"),

    taskForm: document.getElementById("taskForm"),
    taskTitle: document.getElementById("taskTitle"),
    taskCategory: document.getElementById("taskCategory"),
    taskPriority: document.getElementById("taskPriority"),

    analyticsButton: document.getElementById("analyticsButton"),
    notificationButton: document.getElementById("notificationButton"),

    sidebar: document.getElementById("sidebar"),
    mobileMenuButton: document.getElementById("mobileMenuButton"),
    mobileOverlay: document.getElementById("mobileOverlay"),

    sidebarAvatar: document.getElementById("sidebarAvatar"),
    sidebarUserName: document.getElementById("sidebarUserName"),
    topbarUsername: document.getElementById("topbarUsername")
};

/* =========================================================
   STATE
   ========================================================= */

let tasks = [];
let user = {
    name: "Alex",
    username: "alex"
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

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

function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function getTodayKey() {
    return getDateKey(new Date());
}

function formatCurrentDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function formatShortDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    }).format(date);
}

/* =========================================================
   STORAGE
   ========================================================= */

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
        console.error("ASCEND: Could not load tasks.", error);
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
        console.error("ASCEND: Could not save tasks.", error);
    }
}

function loadUser() {
    try {
        const saved = localStorage.getItem(USER_KEY);

        if (!saved) {
            return;
        }

        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
            user = {
                ...user,
                ...parsed
            };
        }
    } catch (error) {
        console.error("ASCEND: Could not load user.", error);
    }
}

/* =========================================================
   USER
   ========================================================= */

function updateUserUI() {
    const name = user.name || "Alex";
    const username = user.username || "alex";

    if (elements.sidebarUserName) {
        elements.sidebarUserName.textContent = name;
    }

    if (elements.topbarUsername) {
        elements.topbarUsername.textContent = name;
    }

    if (elements.sidebarAvatar) {
        elements.sidebarAvatar.textContent =
            name.charAt(0).toUpperCase();
    }

    const topbarAvatar = document.querySelector(".avatar-small");

    if (topbarAvatar) {
        topbarAvatar.textContent =
            name.charAt(0).toUpperCase();
    }

    const usernameElement =
        document.querySelector(".user-info span");

    if (usernameElement) {
        usernameElement.textContent = `@${username}`;
    }
}

/* =========================================================
   DATE UI
   ========================================================= */

function updateDateUI() {
    const today = new Date();

    if (elements.currentDate) {
        elements.currentDate.textContent =
            formatCurrentDate(today);
    }

    if (elements.todayDate) {
        elements.todayDate.textContent =
            formatShortDate(today);
    }
}

/* =========================================================
   TASK HELPERS
   ========================================================= */

function getTodayTasks() {
    const todayKey = getTodayKey();

    return tasks.filter(task => task.date === todayKey);
}

function getTasksForDate(dateKey) {
    return tasks.filter(task => task.date === dateKey);
}

function calculateProgress(taskList) {
    if (!taskList.length) {
        return 0;
    }

    const completed = taskList.filter(
        task => task.completed
    ).length;

    return Math.round(
        (completed / taskList.length) * 100
    );
}

function createTaskObject(title, category, priority) {
    return {
        id:
            Date.now().toString() +
            Math.random().toString(36).slice(2, 8),

        title: title.trim(),

        category: category || "Personal",

        priority: priority || "normal",

        completed: false,

        date: getTodayKey(),

        createdAt: new Date().toISOString()
    };
}

/* =========================================================
   TASK RENDERING
   ========================================================= */

function renderTasks() {
    if (!elements.tasksContainer) {
        return;
    }

    const todayTasks = getTodayTasks();

    elements.tasksContainer.innerHTML = "";

    if (todayTasks.length === 0) {
        elements.tasksContainer.appendChild(
            createEmptyState()
        );

        return;
    }

    todayTasks.forEach(task => {
        const taskElement = createTaskElement(task);

        elements.tasksContainer.appendChild(taskElement);
    });
}

function createEmptyState() {
    const wrapper = document.createElement("div");

    wrapper.className = "empty-state";
    wrapper.id = "emptyState";

    wrapper.innerHTML = `
        <div class="empty-icon">+</div>

        <h3>No tasks yet</h3>

        <p>
            Create your first task
            and start your journey.
        </p>

        <button
            class="primary-button"
            id="createTaskButton"
            type="button"
        >
            Create task
        </button>
    `;

    const button = wrapper.querySelector(
        "#createTaskButton"
    );

    button.addEventListener("click", openTaskPanel);

    return wrapper;
}

function createTaskElement(task) {
    const article = document.createElement("article");

    article.className = "task-item";

    if (task.completed) {
        article.classList.add("completed");
    }

    article.dataset.id = task.id;

    const checkbox = document.createElement("button");

    checkbox.type = "button";
    checkbox.className = "task-checkbox";

    checkbox.setAttribute(
        "aria-label",
        task.completed
            ? `Mark "${task.title}" incomplete`
            : `Complete "${task.title}"`
    );

    checkbox.setAttribute(
        "aria-pressed",
        String(task.completed)
    );

    checkbox.textContent = task.completed
        ? "✓"
        : "";

    checkbox.addEventListener(
        "click",
        () => toggleTask(task.id)
    );

    const content = document.createElement("div");

    content.className = "task-content";

    const title = document.createElement("div");

    title.className = "task-title";
    title.textContent = task.title;

    const category = document.createElement("div");

    category.className = "task-category";

    category.textContent =
        task.category +
        (
            task.priority === "high"
                ? " • HIGH PRIORITY"
                : ""
        );

    content.appendChild(title);
    content.appendChild(category);

    const status = document.createElement("div");

    status.className = "task-status";

    status.textContent = task.completed
        ? "COMPLETED"
        : "OPEN";

    article.appendChild(checkbox);
    article.appendChild(content);
    article.appendChild(status);

    return article;
}

/* =========================================================
   ADD TASK
   ========================================================= */

function openTaskPanel() {
    if (!elements.addTaskPanel) {
        return;
    }

    elements.addTaskPanel.hidden = false;

    setTimeout(() => {
        if (elements.taskTitle) {
            elements.taskTitle.focus();
        }
    }, 50);
}

function closeTaskPanel() {
    if (!elements.addTaskPanel) {
        return;
    }

    elements.addTaskPanel.hidden = true;
}

function handleTaskSubmit(event) {
    event.preventDefault();

    if (!elements.taskTitle) {
        return;
    }

    const title =
        elements.taskTitle.value.trim();

    const category =
        elements.taskCategory
            ? elements.taskCategory.value
            : "Personal";

    const priority =
        elements.taskPriority
            ? elements.taskPriority.value
            : "normal";

    if (!title) {
        elements.taskTitle.focus();
        return;
    }

    const newTask = createTaskObject(
        title,
        category,
        priority
    );

    tasks.push(newTask);

    saveTasks();

    elements.taskForm.reset();

    closeTaskPanel();

    renderAll();
}

/* =========================================================
   TOGGLE TASK
   ========================================================= */

function toggleTask(taskId) {
    const task = tasks.find(
        item => item.id === taskId
    );

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();

    renderAll();
}

/* =========================================================
   DAILY PROGRESS
   ========================================================= */

function updateDailyProgress() {
    const todayTasks = getTodayTasks();

    const total = todayTasks.length;

    const completed = todayTasks.filter(
        task => task.completed
    ).length;

    const percentage =
        calculateProgress(todayTasks);

    if (elements.completedTasks) {
        elements.completedTasks.textContent =
            completed;
    }

    if (elements.totalTasks) {
        elements.totalTasks.textContent =
            total;
    }

    if (elements.dailyProgress) {
        elements.dailyProgress.textContent =
            `${percentage}%`;
    }

    if (elements.sidebarProgress) {
        elements.sidebarProgress.textContent =
            `${percentage}%`;
    }

    if (elements.sidebarProgressFill) {
        elements.sidebarProgressFill.style.width =
            `${percentage}%`;
    }

    updateProgressCircle(percentage);

    updateProgressMessage(
        percentage,
        total
    );
}

function updateProgressCircle(percentage) {
    if (!elements.dailyProgressCircle) {
        return;
    }

    const radius = 58;

    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        (percentage / 100) * circumference;

    elements.dailyProgressCircle.style.strokeDasharray =
        `${circumference}`;

    elements.dailyProgressCircle.style.strokeDashoffset =
        `${offset}`;
}

function updateProgressMessage(
    percentage,
    total
) {
    if (!elements.progressMessage) {
        return;
    }

    let message = "Start your day.";

    if (total === 0) {
        message = "Create your first task.";
    } else if (percentage === 0) {
        message = "Start your day.";
    } else if (percentage < 25) {
        message = "One step at a time.";
    } else if (percentage < 50) {
        message = "Good start. Keep going.";
    } else if (percentage < 75) {
        message = "You're building momentum.";
    } else if (percentage < 100) {
        message = "Almost there. Finish strong.";
    } else {
        message = "Day complete. You showed up.";
    }

    elements.progressMessage.textContent =
        message;
}

/* =========================================================
   WEEKLY PROGRESS
   ========================================================= */

function getStartOfWeek(date = new Date()) {
    const result = new Date(date);

    const day = result.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() + difference
    );

    result.setHours(0, 0, 0, 0);

    return result;
}

function updateWeeklyProgress() {
    const weekStart = getStartOfWeek();

    const dayNames = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];

    document
        .querySelectorAll(".week-day")
        .forEach(dayElement => {

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

            const progressElement =
                dayElement.querySelector(
                    ".week-day-progress"
                );

            const fillElement =
                dayElement.querySelector(
                    ".week-day-fill"
                );

            if (progressElement) {
                progressElement.textContent =
                    `${percentage}%`;
            }

            if (fillElement) {
                fillElement.style.width =
                    `${percentage}%`;
            }

            dayElement.classList.remove("active");

            if (dateKey === getTodayKey()) {
                dayElement.classList.add("active");
            }
        });
}

/* =========================================================
   STREAK
   ========================================================= */

function isDayCompleted(dateKey) {
    const dayTasks =
        getTasksForDate(dateKey);

    if (dayTasks.length === 0) {
        return false;
    }

    return dayTasks.every(
        task => task.completed
    );
}

function calculateStreak() {
    let streak = 0;

    const today = new Date();

    /*
       We count consecutive completed days
       backwards from today.

       If today has no completed day yet,
       we check yesterday so that an existing
       streak is not immediately lost at the
       beginning of a new day.
    */

    let cursor = new Date(today);

    if (!isDayCompleted(getDateKey(cursor))) {
        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    while (
        isDayCompleted(
            getDateKey(cursor)
        )
    ) {
        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );

        if (streak > 10000) {
            break;
        }
    }

    return streak;
}

function updateStreak() {
    const streak =
        calculateStreak();

    if (elements.streakValue) {
        elements.streakValue.textContent =
            streak;
    }
}

/* =========================================================
   ASCEND SCORE
   ========================================================= */

function calculateAscendScore() {
    /*
       Initial scoring system:

       Every completed task = +10 points.

       Maximum displayed score = 1000.

       We can later replace this with
       a more advanced scoring system.
    */

    const completedCount =
        tasks.filter(
            task => task.completed
        ).length;

    return Math.min(
        completedCount * 10,
        1000
    );
}

function updateAscendScore() {
    const score =
        calculateAscendScore();

    if (elements.ascendScore) {
        elements.ascendScore.textContent =
            score;
    }
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {
    if (elements.sidebar) {
        elements.sidebar.classList.add("open");
    }

    if (elements.mobileOverlay) {
        elements.mobileOverlay.classList.add("active");
    }
}

function closeMobileMenu() {
    if (elements.sidebar) {
        elements.sidebar.classList.remove("open");
    }

    if (elements.mobileOverlay) {
        elements.mobileOverlay.classList.remove("active");
    }
}

function toggleMobileMenu() {
    if (!elements.sidebar) {
        return;
    }

    const isOpen =
        elements.sidebar.classList.contains("open");

    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    const links =
        document.querySelectorAll(".nav-link");

    links.forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            links.forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");

            const page =
                link.dataset.page;

            handleNavigation(page);

            closeMobileMenu();
        });
    });
}

function handleNavigation(page) {
    /*
       For now ASCEND is a single-page
       application.

       Future pages can be connected here.
    */

    if (page === "dashboard") {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;
    }

    if (page === "calendar") {
        showTemporaryMessage(
            "Calendar is coming next."
        );

        return;
    }

    if (page === "tasks") {
        const tasksSection =
            elements.tasksContainer
                ?.closest(".section");

        if (tasksSection) {
            tasksSection.scrollIntoView({
                behavior: "smooth"
            });
        }

        return;
    }

    if (page === "analytics") {
        showTemporaryMessage(
            "Analytics is coming next."
        );

        return;
    }

    if (page === "profile") {
        showTemporaryMessage(
            "Profile is coming next."
        );

        return;
    }

    if (page === "settings") {
        showTemporaryMessage(
            "Settings is coming next."
        );

        return;
    }
}

/* =========================================================
   TEMPORARY NOTIFICATION
   ========================================================= */

function showTemporaryMessage(message) {
    const existing =
        document.querySelector(
            ".ascend-toast"
        );

    if (existing) {
        existing.remove();
    }

    const toast =
        document.createElement("div");

    toast.className =
        "ascend-toast";

    toast.textContent =
        message;

    toast.style.position = "fixed";
    toast.style.right = "25px";
    toast.style.bottom = "25px";
    toast.style.zIndex = "9999";
    toast.style.padding = "13px 17px";
    toast.style.border = "1px solid #303030";
    toast.style.borderRadius = "10px";
    toast.style.background = "#151515";
    toast.style.color = "#ddd";
    toast.style.fontSize = "12px";
    toast.style.boxShadow =
        "0 15px 40px rgba(0,0,0,0.35)";

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

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function handleNotifications() {
    const todayTasks =
        getTodayTasks();

    if (todayTasks.length === 0) {
        showTemporaryMessage(
            "No tasks for today."
        );

        return;
    }

    const incomplete =
        todayTasks.filter(
            task => !task.completed
        ).length;

    if (incomplete === 0) {
        showTemporaryMessage(
            "All tasks completed. Great work."
        );

        return;
    }

    showTemporaryMessage(
        `${incomplete} task${
            incomplete === 1 ? "" : "s"
        } remaining today.`
    );
}

/* =========================================================
   ANALYTICS BUTTON
   ========================================================= */

function handleAnalyticsButton() {
    showTemporaryMessage(
        "Analytics is coming next."
    );
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    if (elements.addTaskButton) {
        elements.addTaskButton.addEventListener(
            "click",
            openTaskPanel
        );
    }

    if (elements.createTaskButton) {
        elements.createTaskButton.addEventListener(
            "click",
            openTaskPanel
        );
    }

    if (elements.closeTaskPanel) {
        elements.closeTaskPanel.addEventListener(
            "click",
            closeTaskPanel
        );
    }

    if (elements.cancelTaskButton) {
        elements.cancelTaskButton.addEventListener(
            "click",
            closeTaskPanel
        );
    }

    if (elements.taskForm) {
        elements.taskForm.addEventListener(
            "submit",
            handleTaskSubmit
        );
    }

    if (elements.mobileMenuButton) {
        elements.mobileMenuButton.addEventListener(
            "click",
            toggleMobileMenu
        );
    }

    if (elements.mobileOverlay) {
        elements.mobileOverlay.addEventListener(
            "click",
            closeMobileMenu
        );
    }

    if (elements.notificationButton) {
        elements.notificationButton.addEventListener(
            "click",
            handleNotifications
        );
    }

    if (elements.analyticsButton) {
        elements.analyticsButton.addEventListener(
            "click",
            handleAnalyticsButton
        );
    }
}

/* =========================================================
   ESCAPE KEY
   ========================================================= */

function setupKeyboardControls() {
    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeTaskPanel();
                closeMobileMenu();
            }
        }
    );
}

/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {
    renderTasks();

    updateDailyProgress();

    updateWeeklyProgress();

    updateStreak();

    updateAscendScore();

    updateDateUI();

    updateUserUI();
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

function init() {

    loadTasks();

    loadUser();

    updateDateUI();

    updateUserUI();

    setupEventListeners();

    setupNavigation();

    setupKeyboardControls();

    renderAll();

    console.log(
        "ASCEND initialized successfully."
    );
}

/* =========================================================
   START
   ========================================================= */

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
