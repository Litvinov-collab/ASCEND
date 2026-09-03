/* =========================================================
   ASCEND — APPLICATION LOGIC
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "ascend_data";


const defaultData = {
    username: "Alex",
    handle: "alex",

    tasks: [],

    completedDates: {},

    settings: {
        notifications: true
    }
};


function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,
            settings: {
                ...defaultData.settings,
                ...(parsed.settings || {})
            }
        };

    } catch (error) {
        console.error("ASCEND: Failed to load data.", error);

        return structuredClone(defaultData);
    }
}


function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch (error) {
        console.error("ASCEND: Failed to save data.", error);
    }
}


let data = loadData();


/* =========================================================
   DATE
   ========================================================= */

function getDateKey(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getTodayKey() {
    return getDateKey(new Date());
}


function formatCurrentDate() {
    const now = new Date();

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    ).format(now);
}


function formatShortDate() {
    const now = new Date();

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    ).format(now);
}


/* =========================================================
   TASKS
   ========================================================= */

function getTodayTasks() {
    const today = getTodayKey();

    return data.tasks.filter(task => {
        if (task.archived) {
            return false;
        }

        if (!task.createdAt) {
            return true;
        }

        return task.createdAt <= today;
    });
}


function getCompletedToday() {
    const tasks = getTodayTasks();

    return tasks.filter(task => {
        return task.completed === true;
    });
}


function calculateDailyProgress() {
    const tasks = getTodayTasks();

    if (tasks.length === 0) {
        return 0;
    }

    const completed = tasks.filter(
        task => task.completed
    ).length;

    return Math.round(
        (completed / tasks.length) * 100
    );
}


function calculateScore() {
    let score = 0;

    /*
        Every completed task gives points.
        Later we will create a much more advanced
        ASCEND Score system.
    */

    data.tasks.forEach(task => {
        if (task.completed) {
            score += 10;
        }
    });

    return score;
}


/* =========================================================
   STREAK
   ========================================================= */

function calculateStreak() {
    const today = new Date();

    let streak = 0;

    /*
        Check today first.
        Then move backwards one day at a time.
    */

    while (true) {

        const dateKey = getDateKey(today);

        const progress = data.completedDates[dateKey];

        if (progress && progress > 0) {
            streak++;

            today.setDate(
                today.getDate() - 1
            );

        } else {
            break;
        }

        /*
            Safety limit.
        */

        if (streak > 10000) {
            break;
        }
    }

    return streak;
}


function updateCompletedDate() {
    const today = getTodayKey();

    const progress = calculateDailyProgress();

    data.completedDates[today] = progress;

    saveData();
}


/* =========================================================
   PROGRESS CIRCLE
   ========================================================= */

function updateProgressCircle(progress) {

    const circle = document.getElementById(
        "dailyProgressCircle"
    );

    if (!circle) {
        return;
    }

    const circumference = 314;

    const offset =
        circumference -
        (progress / 100) * circumference;

    circle.style.strokeDashoffset = offset;
}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    const tasks = getTodayTasks();

    const completed = getCompletedToday();

    const progress = calculateDailyProgress();

    const streak = calculateStreak();

    const score = calculateScore();


    /* Daily progress */

    const dailyProgress =
        document.getElementById(
            "dailyProgress"
        );

    if (dailyProgress) {
        dailyProgress.textContent =
            `${progress}%`;
    }


    /* Sidebar progress */

    const sidebarProgress =
        document.getElementById(
            "sidebarProgress"
        );

    if (sidebarProgress) {
        sidebarProgress.textContent =
            `${progress}%`;
    }


    const sidebarProgressFill =
        document.getElementById(
            "sidebarProgressFill"
        );

    if (sidebarProgressFill) {
        sidebarProgressFill.style.width =
            `${progress}%`;
    }


    /* Tasks */

    const completedTasks =
        document.getElementById(
            "completedTasks"
        );

    if (completedTasks) {
        completedTasks.textContent =
            completed.length;
    }


    const totalTasks =
        document.getElementById(
            "totalTasks"
        );

    if (totalTasks) {
        totalTasks.textContent =
            tasks.length;
    }


    /* Streak */

    const streakValue =
        document.getElementById(
            "streakValue"
        );

    if (streakValue) {
        streakValue.textContent =
            streak;
    }


    /* ASCEND Score */

    const ascendScore =
        document.getElementById(
            "ascendScore"
        );

    if (ascendScore) {
        ascendScore.textContent =
            score;
    }


    /* Weekly today */

    const weekTodayProgress =
        document.getElementById(
            "weekTodayProgress"
        );

    if (weekTodayProgress) {
        weekTodayProgress.textContent =
            `${progress}%`;
    }


    updateProgressCircle(progress);

    updateDateUI();

    renderTasks();
}


/* =========================================================
   DATE UI
   ========================================================= */

function updateDateUI() {

    const currentDate =
        document.getElementById(
            "currentDate"
        );

    if (currentDate) {
        currentDate.textContent =
            formatCurrentDate();
    }


    const todayDate =
        document.getElementById(
            "todayDate"
        );

    if (todayDate) {
        todayDate.textContent =
            formatShortDate();
    }
}


/* =========================================================
   USER UI
   ========================================================= */

function updateUserUI() {

    const username =
        data.username || "Alex";

    const handle =
        data.handle || "alex";


    const sidebarName =
        document.getElementById(
            "sidebarUserName"
        );

    if (sidebarName) {
        sidebarName.textContent =
            username;
    }


    const topbarUsername =
        document.getElementById(
            "topbarUsername"
        );

    if (topbarUsername) {
        topbarUsername.textContent =
            username;
    }


    const sidebarHandle =
        document.querySelector(
            ".sidebar-user-handle"
        );

    if (sidebarHandle) {
        sidebarHandle.textContent =
            `@${handle}`;
    }


    const avatars =
        document.querySelectorAll(
            ".avatar"
        );

    avatars.forEach(avatar => {

        avatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

    });
}


/* =========================================================
   TASK RENDERING
   ========================================================= */

function renderTasks() {

    const container =
        document.getElementById(
            "tasksContainer"
        );

    if (!container) {
        return;
    }


    const tasks = getTodayTasks();


    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    +
                </div>

                <h3>
                    No tasks yet
                </h3>

                <p>
                    Create your first task and
                    start your journey.
                </p>

                <a
                    href="pages/tasks.html"
                    class="primary-button"
                >
                    Create task
                </a>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    tasks.slice(0, 6).forEach(task => {

        const element =
            createTaskElement(task);

        container.appendChild(element);

    });
}


function createTaskElement(task) {

    const item =
        document.createElement("div");

    item.className =
        "task-item";


    if (task.completed) {
        item.classList.add("completed");
    }


    item.innerHTML = `

        <button
            class="task-checkbox"
            type="button"
            aria-label="Complete task"
            data-task-id="${task.id}"
        >
            ${task.completed ? "✓" : ""}
        </button>

        <div class="task-content">

            <span class="task-title">
                ${escapeHTML(task.title)}
            </span>

            ${
                task.category
                    ? `
                    <span class="task-category">
                        ${escapeHTML(task.category)}
                    </span>
                    `
                    : ""
            }

        </div>

        <span class="task-status">
            ${
                task.completed
                    ? "DONE"
                    : "TODO"
            }
        </span>

    `;


    const checkbox =
        item.querySelector(
            ".task-checkbox"
        );


    checkbox.addEventListener(
        "click",
        () => {

            toggleTask(task.id);

        }
    );


    return item;
}


/* =========================================================
   TOGGLE TASK
   ========================================================= */

function toggleTask(taskId) {

    const task =
        data.tasks.find(
            item => item.id === taskId
        );


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    /*
        Save today's progress.
    */

    updateCompletedDate();


    /*
        Update interface.
    */

    updateDashboard();
}


/* =========================================================
   CREATE TASK
   ========================================================= */

function createTask(
    title,
    category = ""
) {

    if (!title || !title.trim()) {
        return null;
    }


    const task = {

        id:
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,

        title:
            title.trim(),

        category:
            category.trim(),

        createdAt:
            getTodayKey(),

        completed:
            false,

        archived:
            false

    };


    data.tasks.push(task);

    saveData();

    updateDashboard();


    return task;
}


/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(taskId) {

    data.tasks =
        data.tasks.filter(
            task => task.id !== taskId
        );


    saveData();

    updateDashboard();
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
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "mobileOverlay"
        );


    if (!button || !sidebar || !overlay) {
        return;
    }


    function openMenu() {

        sidebar.classList.add(
            "open"
        );

        overlay.style.display =
            "block";

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    function closeMenu() {

        sidebar.classList.remove(
            "open"
        );

        overlay.style.display =
            "none";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    button.addEventListener(
        "click",
        openMenu
    );


    overlay.addEventListener(
        "click",
        closeMenu
    );


    /*
        Close menu after clicking a link
        on mobile.
    */

    document
        .querySelectorAll(".nav-item")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 760
                    ) {
                        closeMenu();
                    }

                }
            );

        });


    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth > 760
            ) {
                closeMenu();
            }

        }
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const currentPage =
        getCurrentPage();


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            const page =
                item.dataset.page;


            if (page === currentPage) {

                document
                    .querySelectorAll(
                        ".nav-item"
                    )
                    .forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                item.classList.add(
                    "active"
                );
            }

        });
}


function getCurrentPage() {

    const path =
        window.location.pathname;


    if (
        path.endsWith("/") ||
        path.endsWith("index.html")
    ) {
        return "dashboard";
    }


    if (path.includes("calendar")) {
        return "calendar";
    }


    if (path.includes("tasks")) {
        return "tasks";
    }


    if (path.includes("analytics")) {
        return "analytics";
    }


    if (path.includes("profile")) {
        return "profile";
    }


    if (path.includes("settings")) {
        return "settings";
    }


    return "dashboard";
}


/* =========================================================
   DEMO DATA
   ========================================================= */

/*
    We start with an empty system.

    To make development easier, this function can
    create example tasks.

    It is NOT automatically executed.
*/

function createDemoTasks() {

    if (data.tasks.length > 0) {
        return;
    }


    data.tasks = [

        {
            id: "demo-1",
            title: "Morning workout",
            category: "Health",
            createdAt: getTodayKey(),
            completed: false,
            archived: false
        },

        {
            id: "demo-2",
            title: "Study for 60 minutes",
            category: "Growth",
            createdAt: getTodayKey(),
            completed: false,
            archived: false
        },

        {
            id: "demo-3",
            title: "Work on ASCEND",
            category: "Work",
            createdAt: getTodayKey(),
            completed: false,
            archived: false
        }

    ];


    saveData();

    updateDashboard();
}


/* =========================================================
   DEVELOPMENT API
   ========================================================= */

/*
    These functions are available from the browser console.

    Example:

        ASCEND.createTask("Read 20 pages");

        ASCEND.createTask(
            "Workout",
            "Health"
        );

        ASCEND.deleteTask("task-id");

        ASCEND.demo();

*/

window.ASCEND = {

    createTask,

    deleteTask,

    toggleTask,

    createDemoTasks,

    getData: () => data,

    reset: () => {

        localStorage.removeItem(
            STORAGE_KEY
        );

        location.reload();

    }

};


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initASCEND() {

    updateUserUI();

    updateDateUI();

    setupMobileMenu();

    setupNavigation();

    updateDashboard();

    console.log(
        "ASCEND initialized."
    );
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initASCEND
    );

} else {

    initASCEND();

}
