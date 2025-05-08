// Helper function to convert date format from dd-mm-yyyy to yyyy-mm-dd
function convertDateFormat(dateStr) {
  const ddmmyyyyPattern = /^\d{2}-\d{2}-\d{4}$/;
  if (ddmmyyyyPattern.test(dateStr)) {
    const parts = dateStr.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// New List Modal Functionality
const newListModal = document.getElementById("newListModal");
const closeNewListModal = document.getElementById("closeNewListModal");
const newListForm = document.getElementById("newListForm");
function openNewListModal() { newListModal.classList.remove("hidden"); }
function closeNewListModalFunc() { newListModal.classList.add("hidden"); }
if (closeNewListModal) closeNewListModal.addEventListener("click", closeNewListModalFunc);
window.addEventListener("click", e => { if (e.target === newListModal) closeNewListModalFunc(); });

function attachSidebarListeners(listElement) {
  listElement.querySelectorAll(".list-item").forEach(item => {
    item.addEventListener("click", async () => {
      if (item.classList.contains("create-new")) return openNewListModal();
      listElement.querySelectorAll(".list-item").forEach(li => li.classList.remove("active"));
      item.classList.add("active");
      const selectedListName = item.textContent.replace("✖", "").trim();
      if (selectedListName === "Home") {
        currentFilter = "Home";
        await fetchTasks(); renderTasks(); return;
      }
      if (selectedListName === "Completed") {
        currentFilter = "Completed";
        await fetchTasks(); renderTasks(); return;
      }
      currentFilter = selectedListName;
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/tasks?list_name=${encodeURIComponent(selectedListName)}`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) { tasks = data.tasks; renderTasks(); }
      } catch (error) { console.error("Error fetching tasks for list:", error); }
      if (window.innerWidth < 768) sidebar.classList.remove("active");
    });
  });
}

function limitSidebarItems(listElement, maxItems = 10) {
  const allItems = Array.from(listElement.querySelectorAll(".list-item:not(.create-new)"));
  if (allItems.length <= maxItems) return;
  for (let i = maxItems; i < allItems.length; i++) allItems[i].classList.add("hidden-list-item");
  const seeMoreItem = document.createElement("li");
  seeMoreItem.className = "list-item see-more";
  seeMoreItem.textContent = "See More";
  listElement.insertBefore(seeMoreItem, listElement.querySelector(".list-item.create-new"));
  seeMoreItem.addEventListener("click", () => { allItems.slice(maxItems).forEach(i => i.classList.remove("hidden-list-item")); seeMoreItem.remove(); });
}

function showConfirm(message, onConfirm) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 });
  const modal = document.createElement("div");
  Object.assign(modal.style, { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", textAlign: "center", maxWidth: "300px", width: "80%" });
  const messageEl = document.createElement("p"); messageEl.textContent = message; modal.appendChild(messageEl);
  const btnContainer = document.createElement("div");
  Object.assign(btnContainer.style, { marginTop: "20px", display: "flex", justifyContent: "space-around" });
  const yesBtn = document.createElement("button");
  Object.assign(yesBtn.style, { padding: "8px 16px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" });
  yesBtn.textContent = "Yes"; yesBtn.addEventListener("click", () => { document.body.removeChild(overlay); onConfirm(); });
  const noBtn = document.createElement("button");
  Object.assign(noBtn.style, { padding: "8px 16px", backgroundColor: "#ccc", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer" });
  noBtn.textContent = "No"; noBtn.addEventListener("click", () => document.body.removeChild(overlay));
  btnContainer.append(yesBtn, noBtn);
  modal.appendChild(btnContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showHtmlNotification(title, content) {
  const notificationTitle = document.getElementById("notificationTitle");
  const notificationContent = document.getElementById("notificationContent");
  const htmlNotification = document.getElementById("htmlNotification");
  if (notificationTitle && notificationContent && htmlNotification) {
    notificationTitle.textContent = title;
    notificationContent.innerHTML = content;
    htmlNotification.style.display = "block";
    setTimeout(() => { htmlNotification.style.display = "none"; }, 2000);
  } else console.error("Notification elements not found in the DOM.");
}

let tasks = [];
let editTaskId = null;
let currentFilter = "";
const currentUserId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

async function fetchLists() {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/lists/?user_id=${currentUserId}`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    if (data.success) {
      const privateList = document.getElementById("privateList");
      const taskListSelect = document.getElementById("taskList");
      privateList.querySelectorAll(".list-item.dynamic").forEach(item => item.remove());
      [...taskListSelect.options].forEach(opt => { if (opt.value) taskListSelect.removeChild(opt); });
      data.lists.forEach(list => {
        const li = document.createElement("li");
        li.className = "list-item dynamic";
        li.textContent = list.name;
        li.dataset.listId = list.id;
        const deleteSpan = document.createElement("span");
        deleteSpan.textContent = "✖";
        deleteSpan.className = "delete-list";
        deleteSpan.style.marginLeft = "8px";
        deleteSpan.style.cursor = "pointer";
        deleteSpan.addEventListener("click", e => { e.stopPropagation(); showConfirm(`Delete list "${list.name}"?`, () => deleteList(list.id)); });
        li.appendChild(deleteSpan);
        privateList.insertBefore(li, privateList.querySelector(".list-item.create-new"));
        const option = document.createElement("option");
        option.value = list.name;
        option.textContent = list.name;
        taskListSelect.appendChild(option);
      });
      attachSidebarListeners(privateList);
      limitSidebarItems(privateList);
    }
  } catch (error) {
    console.error("Error fetching lists:", error);
  }
}

async function deleteList(listId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/lists/${listId}`, { method: "DELETE", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    const data = await response.json();
    if (data.success) {
      showHtmlNotification("Success", data.message);
      const listItem = document.querySelector(`[data-list-id="${listId}"]`);
      if (listItem) listItem.remove();
      const taskListSelect = document.getElementById("taskList");
      const optToRemove = Array.from(taskListSelect.options).find(opt => opt.value === listItem.textContent.replace("✖",""));
      if (optToRemove) optToRemove.remove();
    } else showHtmlNotification("Error", data.message);
  } catch (error) {
    console.error("Error deleting list:", error);
    showHtmlNotification("Error", "Failed to delete list");
  }
}

async function fetchTasks() {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/tasks/", { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    const data = await response.json();
    if (data.success) { tasks = data.tasks; renderTasks(); }
    else showHtmlNotification("Error", data.message);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showHtmlNotification("Error", "Server error. Please try again.");
  }
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById("taskName").value = task.name;
  document.getElementById("taskList").value = task.list_name;
  document.getElementById("taskNotes").value = task.notes;
  document.getElementById("taskPriority").checked = task.priority;
  document.getElementById("taskDate").value = task.date;
  document.getElementById("taskTime").value = task.time || "";
  if (document.getElementById("repeatFrequency")) document.getElementById("repeatFrequency").value = task.repeat_frequency || "none";
  if (document.getElementById("repeatInterval")) document.getElementById("repeatInterval").value = task.repeat_interval || 1;
  if (document.getElementById("endRepeat")) document.getElementById("endRepeat").value = task.end_repeat || "";
  modalTitle.textContent = "Edit Task";
  editTaskId = id;
  taskModal.style.display = "block";
}

async function deleteTask(id) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/tasks/delete/${id}`, { method: "DELETE", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    const data = await response.json();
    if (data.success) {
      showHtmlNotification("Success", data.message);
      setTimeout(async () => { await fetchTasks(); }, 1000);
    } else showHtmlNotification("Error", data.message);
  } catch (error) {
    console.error("Error deleting task:", error);
    showHtmlNotification("Error", "Server error. Please try again.");
  }
}

function renderTasks(filteredTasksParam = null) {
  tasksList.innerHTML = "";
  let tasksToRender = filteredTasksParam !== null ? filteredTasksParam : (currentFilter === "Home" ? tasks.filter(t => !t.completed) : currentFilter === "Completed" ? tasks.filter(t => t.completed) : currentFilter ? tasks.filter(t => t.list_name && t.list_name.trim().toLowerCase() === currentFilter.trim().toLowerCase()) : tasks);
  if (!tasksToRender.length) { showHtmlNotification("No Tasks Found", "No tasks available for the selected section."); return; }
  tasksToRender.forEach(task => {
    const li = document.createElement("li"); li.className = "task-item";
    const leftDiv = document.createElement("div"); leftDiv.className = "task-left";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = task.completed;
    checkbox.addEventListener("change", async () => {
      const newStatus = !task.completed;
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/tasks/update/${task.id}`, { method: "PUT", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name: task.name, list_name: task.list_name, notes: task.notes, priority: task.priority, date: task.date, time: task.time, completed: newStatus }) });
        const result = await res.json();
        if (result.success) { task.completed = newStatus; renderTasks(); } else { showHtmlNotification("Error", result.message); checkbox.checked = task.completed; }
      } catch (error) { console.error("Error updating task:", error); showHtmlNotification("Error", "Failed to update task status"); checkbox.checked = task.completed; }
    });
    const taskNameSpan = document.createElement("span"); taskNameSpan.className = `task-name${task.completed ? ' completed' : ''}`; taskNameSpan.textContent = task.name;
    leftDiv.append(checkbox, taskNameSpan);
    const rightDiv = document.createElement("div"); rightDiv.className = "task-right";
    const editBtn = document.createElement("button"); editBtn.className = "task-btn"; editBtn.textContent = "Edit"; editBtn.addEventListener("click", () => editTask(task.id));
    const deleteBtn = document.createElement("button"); deleteBtn.className = "task-btn"; deleteBtn.textContent = "Delete"; deleteBtn.addEventListener("click", () => deleteTask(task.id));
    rightDiv.append(editBtn, deleteBtn);
    li.append(leftDiv, rightDiv);
    tasksList.append(li);
  });
}

window.updateCalendarEvents = () => fetchTasks();

document.addEventListener("DOMContentLoaded", () => {
  function updateHeader() {
    const now = new Date();
    let greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 18 ? "Good Evening" : "Good Night";
    const emoji = now.getHours() < 12 ? "☀️" : now.getHours() < 18 ? "🌇" : "🌙";
    const headerH1 = document.querySelector(".header-left h1");
    if (headerH1) headerH1.innerHTML = `${greeting}, ${username}! <span class="emoji">${emoji}</span>`;
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const headerP = document.querySelector(".header-left p");
    if (headerP) headerP.textContent = `Today, ${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  updateHeader();

  const dateDropdown = document.getElementById("dateDropdown");
  const dropdownMenu = document.getElementById("dateDropdownMenu");
  if (dateDropdown && dropdownMenu) {
    const items = dropdownMenu.querySelectorAll(".dropdown-item");
    dateDropdown.addEventListener("click", e => { e.stopPropagation(); dropdownMenu.classList.toggle("hidden"); });
    items.forEach(item => item.addEventListener("click", () => { dateDropdown.innerHTML = `${item.textContent} <span class="arrow-down">▼</span>`; dropdownMenu.classList.add("hidden"); filterTasksByDate(item.textContent); }));
    document.addEventListener("click", () => dropdownMenu.classList.add("hidden"));
  }

  function filterTasksByDate(opt) {
    const today = new Date();
    let targetDate;
    if (opt === "ALL") return renderTasks();
    if (opt === "Today") targetDate = today.toISOString().split("T")[0];
    else if (opt === "Yesterday") { const y = new Date(today); y.setDate(y.getDate()-1); targetDate = y.toISOString().split("T")[0]; }
    else if (opt === "Tomorrow") { const t = new Date(today); t.setDate(t.getDate()+1); targetDate = t.toISOString().split("T")[0]; }
    else if (opt === "Pick a Date") return openCalendarModal();
    if (targetDate) {
      const filtered = tasks.filter(t => t.date === targetDate).sort((a,b) => (a.time||"").localeCompare(b.time||""));
      renderTasks(filtered);
    } else renderTasks();
  }

  function playNotifSound() { const sound = document.getElementById("notifSound"); if (sound) { sound.currentTime=0; sound.play(); }}
  function showHtmlNotification(title, content) { const notificationTitle = document.getElementById("notificationTitle"); const notificationContent = document.getElementById("notificationContent"); const htmlNotification = document.getElementById("htmlNotification"); if (notificationTitle && notificationContent && htmlNotification) { notificationTitle.textContent = title; notificationContent.innerHTML = content; htmlNotification.style.display = "block"; playNotifSound(); setTimeout(() => htmlNotification.style.display="none",1000); }}

  const createTaskBtn = document.getElementById("createTaskBtn");
  const taskModal = document.getElementById("taskModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const taskForm = document.getElementById("taskForm");
  const tasksList = document.getElementById("tasksList");
  const modalTitle = document.getElementById("modalTitle");
  const advancedModal = document.getElementById("advancedSchedulingModal");
  const closeAdvancedModal = document.getElementById("closeAdvancedModal");
  const advancedScheduleBtn = document.getElementById("advancedScheduleBtn");
  const sidebar = document.getElementById("sidebar");
  const privateList = document.getElementById("privateList");

  advancedScheduleBtn.addEventListener("click", () => advancedModal.style.display="block");
  closeAdvancedModal.addEventListener("click", () => advancedModal.style.display="none");
  if (hamburgerBtn && sidebar) hamburgerBtn.addEventListener("click", e => { sidebar.classList.toggle("active"); e.stopPropagation(); });
  document.addEventListener("click", e => { if (sidebar.classList.contains("active") && !sidebar.contains(e.target) && e.target!==hamburgerBtn) sidebar.classList.remove("active"); });

  attachSidebarListeners(privateList);
  limitSidebarItems(privateList);

  newListForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("newListName").value.trim();
    if (!name) return;
    fetch("http://127.0.0.1:5000/api/lists/", {
      method:"POST",
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ user_id: currentUserId, name })
    })
    .then(res=>res.json())
    .then(data=> data.success ? (showHtmlNotification("Success","List created successfully"), fetchLists()) : showHtmlNotification("Error",data.message))
    .catch(()=> showHtmlNotification("Error","Failed to create list"));
    newListForm.reset(); closeNewListModalFunc();
  });

  createTaskBtn.addEventListener("click", () => { taskForm.reset(); modalTitle.textContent="Create New Task"; editTaskId=null; taskModal.style.display="block"; });
  closeModalBtn.addEventListener("click", () => taskModal.style.display="none");
  window.addEventListener("click", e => { if (e.target===taskModal) taskModal.style.display="none"; if (e.target===advancedModal) advancedModal.style.display="none"; });

  taskForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("taskName").value.trim();
    const listVal = document.getElementById("taskList").value;
    const notes = document.getElementById("taskNotes").value;
    const priority = document.getElementById("taskPriority").checked;
    const rawDate = document.getElementById("taskDate").value.trim();
    const date = convertDateFormat(rawDate);
    const time = document.getElementById("taskTime").value||null;
    const freq = document.getElementById("taskRepeatFrequency").value||"none";
    const interval = parseInt(document.getElementById("taskRepeatInterval").value,10)||1;
    const rawEnd = document.getElementById("taskEndRepeat").value.trim();
    const endRepeat = rawEnd ? convertDateFormat(rawEnd) : null;
    const scheduleTime = document.getElementById("scheduleTime").value||null;
    if (!name || !date) return showHtmlNotification("Error","Task name and date are required!");
    const payload = { users:username, name, list_name:listVal, notes, priority, date, time, completed:false, repeat_frequency:freq, repeat_interval:interval, end_repeat:endRepeat, schedule_time:scheduleTime };
    try {
      const url = editTaskId!==null ? `http://127.0.0.1:5000/api/tasks/update/${editTaskId}` : "http://127.0.0.1:5000/api/tasks/create";
      const method = editTaskId!==null ? "PUT" : "POST";
      const res = await fetch(url, { method, headers:{ 'Content-Type':'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(payload) });
      const result = await res.json();
      result.success ? (showHtmlNotification("Success",result.message), await fetchTasks(), editTaskId=null) : showHtmlNotification("Error",result.message);
    } catch (err) {
      console.error("Error:",err);
      showHtmlNotification("Error","Server error. Please try again.");
    }
    taskModal.style.display="none";
  });

  const advancedSchedulingForm = document.getElementById("advancedSchedulingForm");
  if (advancedSchedulingForm) advancedSchedulingForm.addEventListener("submit", e => {
    e.preventDefault();
    document.getElementById("taskRepeatFrequency").value = document.getElementById("repeatFrequency").value;
    document.getElementById("taskRepeatInterval").value = document.getElementById("repeatInterval").value;
    document.getElementById("taskEndRepeat").value = (document.getElementById("endRepeat").value.trim()) ? convertDateFormat(document.getElementById("endRepeat").value.trim()) : "";
    document.getElementById("taskTime").value = document.getElementById("scheduleTime").value;
    advancedModal.style.display="none";
  });

  const calendarModal = document.getElementById("calendarModal");
  const closeCalendarBtn = document.getElementById("closeCalendarBtn");
  const datesGrid = document.getElementById("datesGrid");
  const currentMonthLabel = document.getElementById("currentMonthLabel");
  const selectedMonthYear = document.getElementById("selectedMonthYear");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const saveCalendarBtn = document.getElementById("saveCalendarBtn");
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedDate = null;

  function openCalendarModal() {
    const now = new Date();
    currentMonth = now.getMonth(); currentYear = now.getFullYear(); selectedDate = null;
    calendarModal.classList.remove("hidden"); renderCalendar(currentYear, currentMonth);
  }
  function closeCalendarModal() { calendarModal.classList.add("hidden"); }
  function renderCalendar(year, month) {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    currentMonthLabel.textContent = monthNames[month];
    selectedMonthYear.textContent = `${monthNames[month]} ${year}`;
    datesGrid.innerHTML = "";
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    for (let i = 0; i < firstDay; i++) datesGrid.appendChild(Object.assign(document.createElement("div"), { className: "date-cell disabled" }));
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("div"); cell.className = "date-cell"; cell.textContent = d;
      if (selectedDate) {
        const [sy, sm, sd] = selectedDate.split("-").map(Number);
        if (year===sy && month===sm-1 && d===sd) cell.classList.add("selected");
      }
      cell.addEventListener("click", () => {
        datesGrid.querySelectorAll(".date-cell.selected").forEach(el => el.classList.remove("selected"));
        cell.classList.add("selected");
        const dayStr = String(d).padStart(2,"0");
        const monthStr = String(month+1).padStart(2,"0");
        selectedDate = `${year}-${monthStr}-${dayStr}`;
      });
      datesGrid.appendChild(cell);
    }
  }
  prevMonthBtn.addEventListener("click", () => { currentMonth--; if (currentMonth < 0) { currentMonth=11; currentYear--; } renderCalendar(currentYear, currentMonth); });
  nextMonthBtn.addEventListener("click", () => { currentMonth++; if (currentMonth>11) { currentMonth=0; currentYear++; } renderCalendar(currentYear, currentMonth); });
  closeCalendarBtn.addEventListener("click", closeCalendarModal);
  saveCalendarBtn.addEventListener("click", () => {
    if (!selectedDate) return alert("Please select a date first.");
    selectDateAndTime(selectedDate); closeCalendarModal();
  });
  function selectDateAndTime(dateStr) {
    const filtered = tasks.filter(task => task.date===dateStr).sort((a,b) => (a.time||"").localeCompare(b.time||""));
    if (!filtered.length) showHtmlNotification("No Tasks Found","No tasks available for the selected date.");
    renderTasks(filtered);
  }

  resetTaskForm = () => taskForm.reset();

  fetchTasks();
  fetchLists();
});