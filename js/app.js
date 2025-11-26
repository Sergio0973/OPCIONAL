// 🔗 Endpoint real de tu MockAPI
const API_URL = "https://6925ae0b82b59600d724b859.mockapi.io/task/task";

const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const errorBox = document.getElementById('error-box');

console.log('JS cargado, form:', taskForm);

// 1. Cargar tareas al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// 2. Crear nueva tarea
taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Submit del formulario');

    const text = taskInput.value.trim();
    if (!text) return;

    try {
        const newTask = await createTask(text);
        console.log('Tarea creada en API:', newTask);
        addTaskToDOM(newTask);
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
        const tasks = await res.json();
        if (!Array.isArray(tasks)) {
            throw new Error('Respuesta inesperada: no es una lista');
        }
        taskList.innerHTML = '';
        tasks.forEach(addTaskToDOM);
    } catch (error) {
        console.error('Error cargando tareas:', error);
        showError('No se pudieron cargar las tareas.');
    }
}


// =======================
//  METODO POST
// =======================

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
        throw new Error('No se pudo crear la tarea realizada');
    }

    return res.json();
}

// =======================
//  METODO PUT
// =======================

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

function addTaskToDOM(taskObj) {
    const li = document.createElement('li');
    li.classList.add('task-item');
    li.dataset.id = taskObj.id;

    const mainDiv = document.createElement('div');
    mainDiv.classList.add('task-main');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('task-title');
    titleSpan.textContent = taskObj.task;

    const statusBadge = document.createElement('span');
    statusBadge.classList.add('task-status-badge');

    if (taskObj.status === 'ready') {
        titleSpan.classList.add('ready');
        statusBadge.textContent = 'Ready';
        statusBadge.classList.add('task-status-ready');
    } else {
        statusBadge.textContent = 'Hold';
        statusBadge.classList.add('task-status-hold');
    }

    mainDiv.appendChild(titleSpan);
    mainDiv.appendChild(statusBadge);

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');

    const checkLabel = document.createElement('label');
    checkLabel.classList.add('task-check-label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    const checkText = document.createElement('span');
    checkText.textContent = taskObj.status === 'ready' ? 'Ready' : 'Listo';

    if (taskObj.status === 'ready') {
        checkbox.checked = true;
    }

    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(checkText);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn-delete');
    deleteButton.textContent = 'Eliminar';

    checkbox.addEventListener('change', async () => {
        const nextStatus = checkbox.checked ? 'ready' : 'hold';

        try {
            const updated = await updateTaskStatus(
                taskObj.id,
                taskObj.task,
                nextStatus,
                taskObj.createdAt
            );
            taskObj.status = updated.status;

            if (nextStatus === 'ready') {
                titleSpan.classList.add('ready');
                statusBadge.textContent = 'Ready';
                statusBadge.classList.remove('task-status-hold');
                statusBadge.classList.add('task-status-ready');
                checkText.textContent = 'Ready';
            } else {
                titleSpan.classList.remove('ready');
                statusBadge.textContent = 'Hold';
                statusBadge.classList.remove('task-status-ready');
                statusBadge.classList.add('task-status-hold');
                checkText.textContent = 'Hold';
            }
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            checkbox.checked = taskObj.status === 'ready';
        }
    });

    deleteButton.addEventListener('click', async () => {
        if (!confirm('¿Seguro que quieres eliminar este deber?')) return;

        try {
            await deleteTask(taskObj.id);
            li.remove();
        } catch (error) {
            console.error('Error eliminando tarea:', error);
        }
    });

    actionsDiv.appendChild(checkLabel);
    actionsDiv.appendChild(deleteButton);

    li.appendChild(mainDiv);
    li.appendChild(actionsDiv);
    taskList.appendChild(li);
}
