// Endpoint real de tu MockAPI
const API_URL = "https://6925ae0b82b59600d724b859.mockapi.io/task/task";

const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const errorBox = document.getElementById('error-box');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const progressPercentEl = document.getElementById('progress-percent');

let tasks = [];
let currentFilter = 'all';

console.log('JS cargado, form:', taskForm);

// 1. Cargar tareas al iniciar la pagina
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// 2. Crear nueva tarea
taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    try {
        const newTask = await createTask(text);
        tasks.push(newTask);
        renderTasks();
        taskInput.value = '';
    } catch (error) {
        console.error('Error creando tarea:', error);
        showError('No se pudo crear la tarea. Revisa el endpoint de MockAPI.');
    }
});

// =======================
//   Llamadas a MockAPI
// =======================

async function loadTasks() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            throw new Error('Respuesta inesperada: no es una lista');
        }
        tasks = data;
        renderTasks();
    } catch (error) {
        console.error('Error cargando tareas:', error);
        showError('No se pudieron cargar las tareas.');
    }
}

async function createTask(taskText) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            task: taskText,
            status: 'hold',
            createdAt: new Date().toISOString()
        })
    });

    if (!res.ok) {
        console.error('Respuesta POST no OK:', res.status, res.statusText);
        throw new Error('No se pudo crear la tarea');
    }

    return res.json();
}

async function updateTaskStatus(taskId, taskText, newStatus, createdAt) {
    const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            task: taskText,
            status: newStatus,
            createdAt: createdAt || new Date().toISOString()
        })
    });

    if (!res.ok) {
        throw new Error('No se pudo actualizar la tarea');
    }

    return res.json();
}

async function deleteTask(taskId) {
    const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('No se pudo eliminar la tarea');
    }
}

function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.add('visible');
    setTimeout(() => {
        errorBox.textContent = '';
        errorBox.classList.remove('visible');
    }, 4000);
}

// =======================
//   Manejo del DOM
// =======================

function renderTasks() {
    taskList.innerHTML = '';

    const filtered = tasks.filter((task) => {
        if (currentFilter === 'completed') return task.status === 'ready';
        if (currentFilter === 'active') return task.status !== 'ready';
        return true;
    });

    filtered.forEach((task) => {
        const li = buildTaskItem(task);
        taskList.appendChild(li);
    });

    if (emptyState) {
        emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
    }

    updateStats();
    updateClearButtonState();
}

function buildTaskItem(taskObj) {
    const li = document.createElement('li');
    li.classList.add('task-item');
    li.dataset.id = taskObj.id;

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = taskObj.task;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = taskObj.status === 'ready';

    const checkText = document.createElement('span');
    checkText.classList.add('task-status');
    setStatusAppearance(checkText, taskObj.status);

    const checkLabel = document.createElement('label');
    checkLabel.classList.add('task-check-label');
    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(checkText);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn-delete');
    deleteButton.textContent = 'Eliminar';

    if (taskObj.status === 'ready') {
        li.classList.add('completed');
    }

    checkbox.addEventListener('change', async () => {
        const nextStatus = checkbox.checked ? 'ready' : 'hold';

        try {
            const updated = await updateTaskStatus(
                taskObj.id,
                taskObj.task,
                nextStatus,
                taskObj.createdAt
            );

            tasks = tasks.map((t) => (t.id === taskObj.id ? updated : t));
            setStatusAppearance(checkText, updated.status);
            renderTasks();
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            checkbox.checked = taskObj.status === 'ready';
        }
    });

    deleteButton.addEventListener('click', async () => {
        if (!confirm('Seguro que quieres eliminar este deber?')) return;

        try {
            await deleteTask(taskObj.id);
            tasks = tasks.filter((t) => t.id !== taskObj.id);
            renderTasks();
        } catch (error) {
            console.error('Error eliminando tarea:', error);
        }
    });

    li.appendChild(taskText);
    li.appendChild(checkLabel);
    li.appendChild(deleteButton);
    return li;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'ready').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (totalTasksEl) totalTasksEl.textContent = total;
    if (completedTasksEl) completedTasksEl.textContent = completed;
    if (progressPercentEl) progressPercentEl.textContent = `${progress}%`;
}

function updateClearButtonState() {
    const hasCompleted = tasks.some((t) => t.status === 'ready');
    if (clearCompletedBtn) {
        clearCompletedBtn.disabled = !hasCompleted;
    }
}

function setStatusAppearance(statusElement, status) {
    const isReady = status === 'ready';
    statusElement.textContent = isReady ? 'Listo' : 'Hold';
    statusElement.classList.toggle('status-ready', isReady);
    statusElement.classList.toggle('status-hold', !isReady);
}

// =======================
//   Filtros y acciones
// =======================

filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter || 'all';
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks();
    });
});

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', async () => {
        const completedIds = tasks.filter((t) => t.status === 'ready').map((t) => t.id);
        if (completedIds.length === 0) return;

        try {
            await Promise.all(completedIds.map((id) => deleteTask(id)));
            tasks = tasks.filter((t) => t.status !== 'ready');
            renderTasks();
        } catch (error) {
            console.error('Error limpiando tareas completadas:', error);
        }
    });
}

// =======================
//   RENDERIZADO EXTERNO
// =======================

function addTaskToDOM(taskObj) {
    tasks.push(taskObj);
    renderTasks();
}

