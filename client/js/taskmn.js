// Helper function to convert date format from dd-mm-yyyy to yyyy-mm-dd
function convertDateFormat(dateStr) {
    // Check if the date matches dd-mm-yyyy pattern
    const ddmmyyyyPattern = /^\d{2}-\d{2}-\d{4}$/;
    if (ddmmyyyyPattern.test(dateStr)) {
      const parts = dateStr.split("-");
      // parts[0]=dd, parts[1]=mm, parts[2]=yyyy
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr; // Return as-is if not in dd-mm-yyyy
  }
  
  
   // New List Modal Functionality
   const newListModal = document.getElementById("newListModal");
   const closeNewListModal = document.getElementById("closeNewListModal");
   const newListForm = document.getElementById("newListForm");
   function openNewListModal() {
     newListModal.classList.remove("hidden");
   }
   function closeNewListModalFunc() {
     newListModal.classList.add("hidden");
   }
   if (closeNewListModal) {
     closeNewListModal.addEventListener("click", closeNewListModalFunc);
   }
   window.addEventListener("click", (e) => {
     if (e.target === newListModal) {
       closeNewListModalFunc();
     }
   });
  
  // Sidebar List & Create New List Modal
  function attachSidebarListeners(listElement) {
    listElement.querySelectorAll(".list-item").forEach(item => {
      item.addEventListener("click", async (e) => {
        if (item.classList.contains("create-new")) {
          openNewListModal();
          return;
        }
      
        listElement.querySelectorAll(".list-item").forEach(li => li.classList.remove("active"));
        item.classList.add("active");
      
        const selectedListName = item.textContent.replace("✖", "").trim();
      
        if (selectedListName === "Home") {
          currentFilter = "Home";
          await fetchTasks();  // fetch all tasks for the user
          renderTasks();       // show only those that are not completed
          return;
        }
      
        if (selectedListName === "Completed") {
          currentFilter = "Completed";
          await fetchTasks();  // fetch all tasks
          renderTasks();       // show only completed ones
          return;
        }
      
        // Handle custom list (created lists)
        currentFilter = selectedListName;
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/tasks?list_name=${encodeURIComponent(selectedListName)}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
      
          const data = await response.json();
          if (data.success) {
            tasks = data.tasks;
            renderTasks(); // will use the global tasks list
          }
        } catch (error) {
          console.error("Error fetching tasks for list:", error);
        }
      
        if (window.innerWidth < 768) {
          sidebar.classList.remove("active");
        }
      });    
    });
  }
  
  
  function limitSidebarItems(listElement, maxItems = 10) {
    const allItems = Array.from(listElement.querySelectorAll(".list-item:not(.create-new)"));
    if (allItems.length <= maxItems) return;
    for (let i = maxItems; i < allItems.length; i++) {
      allItems[i].classList.add("hidden-list-item");
    }
    const createNewItem = listElement.querySelector(".list-item.create-new");
    const seeMoreItem = document.createElement("li");
    seeMoreItem.classList.add("list-item", "see-more");
    seeMoreItem.textContent = "See More";
    listElement.insertBefore(seeMoreItem, createNewItem);
    seeMoreItem.addEventListener("click", () => {
      for (let i = maxItems; i < allItems.length; i++) {
        allItems[i].classList.remove("hidden-list-item");
      }
      seeMoreItem.remove();
    });
  }
  
  
  function showConfirm(message, onConfirm) {
    // Create overlay for confirmation
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";
  
    // Create confirmation modal container
    const modal = document.createElement("div");
    modal.style.backgroundColor = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "8px";
    modal.style.textAlign = "center";
    modal.style.maxWidth = "300px";
    modal.style.width = "80%";
  
    // Create message element
    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    modal.appendChild(messageEl);
  
    // Create container for buttons
    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "20px";
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "space-around";
  
    // Yes Button
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "Yes";
    yesBtn.style.padding = "8px 16px";
    yesBtn.style.backgroundColor = "#007bff";
    yesBtn.style.color = "#fff";
    yesBtn.style.border = "none";
    yesBtn.style.borderRadius = "4px";
    yesBtn.style.cursor = "pointer";
    yesBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
      onConfirm();
    });
    btnContainer.appendChild(yesBtn);
  
    // No Button
    const noBtn = document.createElement("button");
    noBtn.textContent = "No";
    noBtn.style.padding = "8px 16px";
    noBtn.style.backgroundColor = "#ccc";
    noBtn.style.color = "#333";
    noBtn.style.border = "none";
    noBtn.style.borderRadius = "4px";
    noBtn.style.cursor = "pointer";
    noBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });
    btnContainer.appendChild(noBtn);
  
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  
  // Define the notification function if not already defined
  function showHtmlNotification(title, content) {
    const notificationTitle = document.getElementById("notificationTitle");
    const notificationContent = document.getElementById("notificationContent");
    const htmlNotification = document.getElementById("htmlNotification");
  
    if (notificationTitle && notificationContent && htmlNotification) {
      notificationTitle.textContent = title;
      notificationContent.innerHTML = content;
      htmlNotification.style.display = "block";
      // Automatically hide the notification after 2 seconds
      setTimeout(() => {
        htmlNotification.style.display = "none";
      }, 2000);
    } else {
      console.error("Notification elements not found in the DOM.");
    }
  }
  
  
  // Global variables
  let tasks = [];
  let editTaskId = null; // Tracks the task being edited
  let currentFilter = ""; // Default filter
  const currentUserId = localStorage.getItem("userId");
  const username = localStorage.getItem("username")
  
  async function fetchLists() {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/lists/?user_id=${currentUserId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      const data = await response.json();
  
      if (data.success) {
        const privateList = document.getElementById("privateList");
        const taskListSelect = document.getElementById("taskList");
  
        //  Remove previously added list items (but keep "create new")
        privateList.querySelectorAll(".list-item.dynamic").forEach(item => item.remove());
  
        // Clear dropdown list options except the default (value = "")
        [...taskListSelect.options].forEach(option => {
          if (option.value !== "") taskListSelect.removeChild(option);
        });
  
        //  Add new list items from the backend
        data.lists.forEach(list => {
          // 📄 Create sidebar item
          const li = document.createElement("li");
          li.className = "list-item dynamic";
          li.textContent = list.name;
          li.dataset.listId = list.id;
  
          //  Add delete button
          const deleteSpan = document.createElement("span");
          deleteSpan.textContent = "✖";
          deleteSpan.className = "delete-list";
          deleteSpan.style.marginLeft = "8px";
          deleteSpan.style.cursor = "pointer";
  
          //  Handle delete with confirmation
          deleteSpan.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering list item click
            const listId = li.dataset.listId;
            showConfirm(`Delete list "${list.name}"?`, () => deleteList(listId));
          });
  
          li.appendChild(deleteSpan);
  
          //  Insert before the "create new" item
          const createNewItem = privateList.querySelector(".list-item.create-new");
          privateList.insertBefore(li, createNewItem);
  
          // Add to dropdown
          const option = document.createElement("option");
          option.value = list.name;
          option.textContent = list.name;
          taskListSelect.appendChild(option);
        });
  
        //Reattach listeners and limit UI items
        attachSidebarListeners(privateList);
        limitSidebarItems(privateList);
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  }
  
  
  
  
  // Function to delete a list using the backend API
  // Updated deleteList function in task-manager.js
  async function deleteList(listId) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/lists/${listId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        showHtmlNotification("Success", data.message);
        
        // Remove the list item from the UI immediately
        const listItem = document.querySelector(`[data-list-id="${listId}"]`);
        if (listItem) listItem.remove(); // <--- KEY CHANGE
        
        // Also remove from the task creation dropdown
        const taskListSelect = document.getElementById("taskList");
        const optionToRemove = Array.from(taskListSelect.options).find(
          opt => opt.value === listItem.textContent.replace("✖", "").trim()
        );
        if (optionToRemove) optionToRemove.remove();
        
      } else {
        showHtmlNotification("Error", data.message);
      }
    } catch (error) {
      console.error("Error deleting list:", error);
      showHtmlNotification("Error", "Failed to delete list");
    }
  }
  
  // Function to fetch tasks from the backend API
  async function fetchTasks() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/tasks/", { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
      const data = await response.json();
      if (data.success) {
        tasks = data.tasks;
        renderTasks();
      } else {
        showHtmlNotification("Error", data.message);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showHtmlNotification("Error", "Server error. Please try again.");
    }
  }
  
  // Edit Task: Populate the form with task data
  function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById("taskName").value = task.name;
    document.getElementById("taskList").value = task.list_name;
    document.getElementById("taskNotes").value = task.notes;
    document.getElementById("taskPriority").checked = task.priority;
    document.getElementById("taskDate").value = task.date;
    document.getElementById("taskTime").value = task.time || "";
    
    if (document.getElementById("repeatFrequency"))
      document.getElementById("repeatFrequency").value = task.repeat_frequency || "none";
    if (document.getElementById("repeatInterval"))
      document.getElementById("repeatInterval").value = task.repeat_interval || 1;
    if (document.getElementById("endRepeat"))
      document.getElementById("endRepeat").value = task.end_repeat || "";
    
    modalTitle.textContent = "Edit Task";
    editTaskId = id;
    taskModal.style.display = "block";
  }
  
  // Delete Task: Call backend API then refresh list
  async function deleteTask(id) {
    console.log("Deleting task with id:", id);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/delete/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log("Delete response:", data);
      if (data.success) {
        showHtmlNotification("Success", data.message);
        // Wait a bit so the notification stays visible before re-rendering tasks
        setTimeout(async () => {
          await fetchTasks();
        }, 1000);
      } else {
        showHtmlNotification("Error", data.message);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      showHtmlNotification("Error", "Server error. Please try again.");
    }
  }
  
  
  // Render tasks to the UI
  function renderTasks(filteredTasksParam = null) {
    tasksList.innerHTML = "";
    let tasksToRender;
    if (filteredTasksParam !== null) {
      tasksToRender = filteredTasksParam;
    } else {
      if (currentFilter === "Home") {
        tasksToRender = tasks.filter(task => !task.completed);
      } else if (currentFilter === "Completed") {
        tasksToRender = tasks.filter(task => task.completed);
      } else if (currentFilter) {
         tasksToRender = tasks.filter(task =>
        task.list_name &&
        task.list_name.trim().toLowerCase() === currentFilter.trim().toLowerCase()
       );
      } else {
        tasksToRender = tasks;
      }
    }
    if (tasksToRender.length === 0) {
      showHtmlNotification("No Tasks Found", "No tasks available for the selected section.");
      return;
    }
    tasksToRender.forEach(task => {
      const li = document.createElement("li");
      li.classList.add("task-item");
  
      const leftDiv = document.createElement("div");
      leftDiv.classList.add("task-left");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", async () => {
        const newStatus = !task.completed;
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/tasks/update/${task.id}`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: task.name,
              list_name: task.list_name,
              notes: task.notes,
              priority: task.priority,
              date: task.date,
              time: task.time,
              completed: newStatus
            })
          });
          const result = await response.json();
          if (result.success) {
            task.completed = newStatus;
            renderTasks();
          } else {
            showHtmlNotification("Error", result.message);
            checkbox.checked = task.completed; // revert UI
          }
        } catch (error) {
          console.error("Error updating task:", error);
          showHtmlNotification("Error", "Failed to update task status");
          checkbox.checked = task.completed;
        }
      });
      const taskNameSpan = document.createElement("span");
      taskNameSpan.classList.add("task-name");
      if (task.completed) {
        taskNameSpan.classList.add("completed");
      }
      taskNameSpan.textContent = task.name;
      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(taskNameSpan);
  
      const rightDiv = document.createElement("div");
      rightDiv.classList.add("task-right");
      const editBtn = document.createElement("button");
      editBtn.classList.add("task-btn");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => editTask(task.id));
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("task-btn");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));
      rightDiv.appendChild(editBtn);
      rightDiv.appendChild(deleteBtn);
  
      li.appendChild(leftDiv);
      li.appendChild(rightDiv);
      tasksList.appendChild(li);
    });
  }
  
  // Global refresh function for calendar integration
  window.updateCalendarEvents = function() {
    fetchTasks();
  };
  
  // Main DOMContentLoaded event listener
  document.addEventListener("DOMContentLoaded", () => {
    // Header: Update Greeting & Date
    function updateHeader() {
      const now = new Date();
      let hours = now.getHours();
      let greeting, emoji;
      if (hours < 12) {
        greeting = "Good Morning";
        emoji = "☀️";
      } else if (hours < 18) {
        greeting = "Good Evening";
        emoji = "🌇";
      } else {
        greeting = "Good Night";
        emoji = "🌙";
      }
      const headerH1 = document.querySelector(".header-left h1");
      if (headerH1) {
        headerH1.innerHTML = `${greeting}, ${username}! <span class="emoji">${emoji}</span>`;
      }
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const headerP = document.querySelector(".header-left p");
      if (headerP) {
        headerP.textContent = `Today, ${day} ${date} ${month} ${year}`;
      }
    }
    updateHeader();
  
    // TODAY DROPDOWN FUNCTIONALITY
    const dateDropdown = document.getElementById("dateDropdown");
    const dropdownMenu = document.getElementById("dateDropdownMenu");
    if (dateDropdown && dropdownMenu) {
      const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
      dateDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("hidden");
      });
      dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
          const selectedOption = item.textContent;
          dateDropdown.innerHTML = `${selectedOption} <span class="arrow-down">&#9662;</span>`;
          dropdownMenu.classList.add("hidden");
          filterTasksByDate(selectedOption);
        });
      });
      document.addEventListener("click", () => {
        dropdownMenu.classList.add("hidden");
      });
    }
  
    function filterTasksByDate(selectedOption) {
      let targetDate;
      const today = new Date();
      if (selectedOption === "ALL") {
        renderTasks();
        return;
      } else if (selectedOption === "Today") {
        targetDate = today.toISOString().split("T")[0];
      } else if (selectedOption === "Yesterday") {
        let yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        targetDate = yesterday.toISOString().split("T")[0];
      } else if (selectedOption === "Tomorrow") {
        let tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        targetDate = tomorrow.toISOString().split("T")[0];
      } else if (selectedOption === "Pick a Date") {
        openCalendarModal();
        return;
      }
      if (targetDate) {
        let filteredTasks = tasks.filter(task => task.date === targetDate);
        filteredTasks.sort((a, b) => {
          if (!a.time || !b.time) return 0;
          return a.time.localeCompare(b.time);
        });
        renderTasks(filteredTasks);
      } else {
        renderTasks();
      }
    }
  
    // Notification Popup Functionality
    function playNotifSound() {
      const sound = document.getElementById("notifSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play();
      }
    }
    function showHtmlNotification(title, content) {
      const notificationTitle = document.getElementById("notificationTitle");
      const notificationContent = document.getElementById("notificationContent");
      const htmlNotification = document.getElementById("htmlNotification");
      if (notificationTitle && notificationContent && htmlNotification) {
        notificationTitle.textContent = title;
        notificationContent.innerHTML = content;
        htmlNotification.style.display = "block";
        playNotifSound();
        setTimeout(() => {
          htmlNotification.style.display = "none";
        }, 1000);
      }
    }
  
  
  
    // Modal & Form Elements
    const createTaskBtn = document.getElementById("createTaskBtn");
    const taskModal = document.getElementById("taskModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const taskForm = document.getElementById("taskForm");
    const tasksList = document.getElementById("tasksList");
    const modalTitle = document.getElementById("modalTitle");
  
    // Advanced Scheduling Elements
    const advancedModal = document.getElementById("advancedSchedulingModal");
    const closeAdvancedModal = document.getElementById("closeAdvancedModal");
    const advancedScheduleBtn = document.getElementById("advancedScheduleBtn");
  
    // Sidebar and Hamburger Elements
    const sidebar = document.getElementById("sidebar");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const privateList = document.getElementById("privateList");
  
    // Advanced Scheduling Modal Events
    advancedScheduleBtn.addEventListener("click", () => {
      advancedModal.style.display = "block";
    });
    closeAdvancedModal.addEventListener("click", () => {
      advancedModal.style.display = "none";
    });
  
    // Hamburger & Sidebar Toggle
    if (hamburgerBtn && sidebar) {
      hamburgerBtn.addEventListener("click", (e) => {
        sidebar.classList.toggle("active");
        e.stopPropagation();
      });
    }
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        e.target !== hamburgerBtn
      ) {
        sidebar.classList.remove("active");
      }
    });
  
  
    attachSidebarListeners(privateList);
    limitSidebarItems(privateList);
  
   
    newListForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const newListName = document.getElementById("newListName").value.trim();
      if (!newListName) return;
      fetch("http://127.0.0.1:5000/api/lists/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: `${currentUserId}`, name: newListName })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showHtmlNotification("Success", "List created successfully");
          // Refresh lists in UI by re-calling fetchLists
          fetchLists();
        } else {
          showHtmlNotification("Error", data.message);
        }
      })
      .catch(error => {
        console.error("Error creating list:", error);
        showHtmlNotification("Error", "Failed to create list");
      });
      newListForm.reset();
      closeNewListModalFunc();
    });
  
    // Open/Close Task Modal
    createTaskBtn.addEventListener("click", () => {
      resetTaskForm();
      modalTitle.textContent = "Create New Task";
      editTaskId = null;
      taskModal.style.display = "block";
    });
    closeModalBtn.addEventListener("click", () => {
      taskModal.style.display = "none";
    });
    window.addEventListener("click", (e) => {
      if (e.target === taskModal) {
        taskModal.style.display = "none";
      }
      if (e.target === advancedModal) {
        advancedModal.style.display = "none";
      }
    });
  
    // Task Form Submission (Create/Edit) with Advanced Scheduling Integration
    taskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const taskName = document.getElementById("taskName").value.trim();
      const taskListValue = document.getElementById("taskList").value;
      const taskNotes = document.getElementById("taskNotes").value;
      const taskPriority = document.getElementById("taskPriority").checked;
      
      // Convert the task date format if necessary (from dd-mm-yyyy to yyyy-mm-dd)
      const rawTaskDate = document.getElementById("taskDate").value.trim();
      const taskDate = convertDateFormat(rawTaskDate);
      
      const taskTime = document.getElementById("taskTime").value || null;
      
      // Read advanced scheduling data from hidden inputs
      const repeatFrequency = document.getElementById("taskRepeatFrequency").value || "none";
      const repeatInterval = parseInt(document.getElementById("taskRepeatInterval").value, 10) || 1;
      const rawEndRepeat = document.getElementById("taskEndRepeat").value.trim();
      const endRepeat = rawEndRepeat ? convertDateFormat(rawEndRepeat) : null;
      const endtime = document.getElementById("scheduleTime").value || null;
    
      if (!taskName || !taskDate) {
        showHtmlNotification("Error", "Task name and date are required!");
        return;
      }
  
      const payload = {
        users: username,
        name: taskName,
        list_name: taskListValue,
        notes: taskNotes,
        priority: taskPriority,
        date: taskDate,
        time: taskTime,
        completed: false,
        repeat_frequency: repeatFrequency,
        repeat_interval: repeatInterval,
        end_repeat: endRepeat,
        schedule_time: endtime
      };
  
      try {
        let url = "http://127.0.0.1:5000/api/tasks/create";
        let method = "POST";
        if (editTaskId !== null) {
          url = `http://127.0.0.1:5000/api/tasks/update/${editTaskId}`;
          method = "PUT";
        }
  
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
          showHtmlNotification("Success", result.message);
          await fetchTasks();
          editTaskId = null;
        } else {
          showHtmlNotification("Error", result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        showHtmlNotification("Error", "Server error. Please try again.");
      }
      taskModal.style.display = "none";
      taskForm.reset();
    });
  
    // Advanced Scheduling Form Submission
    const advancedSchedulingForm = document.getElementById("advancedSchedulingForm");
    if (advancedSchedulingForm) {
      advancedSchedulingForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const frequency = document.getElementById("repeatFrequency").value;
        const interval = document.getElementById("repeatInterval").value;
        const rawEndRepeat = document.getElementById("endRepeat").value.trim();
        const endRepeat = rawEndRepeat ? convertDateFormat(rawEndRepeat) : "";
        const scheduleTime = document.getElementById("scheduleTime").value;
      
        // Update the main task form's hidden fields and time
        document.getElementById("taskRepeatFrequency").value = frequency;
        document.getElementById("taskRepeatInterval").value = interval;
        document.getElementById("taskEndRepeat").value = endRepeat;
        document.getElementById("taskTime").value = scheduleTime;
      
        advancedModal.style.display = "none";
      });
    }
  
    // Calendar Modal Functionality
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
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      selectedDate = null;
      calendarModal.classList.remove("hidden");
      renderCalendar(currentYear, currentMonth);
    }
    function closeCalendarModal() {
      calendarModal.classList.add("hidden");
    }
    function renderCalendar(year, month) {
      const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
      ];
      currentMonthLabel.textContent = monthNames[month];
      selectedMonthYear.textContent = `${monthNames[month]} ${year}`;
      datesGrid.innerHTML = "";
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) {
        const blankCell = document.createElement("div");
        blankCell.classList.add("date-cell", "disabled");
        datesGrid.appendChild(blankCell);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.classList.add("date-cell");
        cell.textContent = day;
        if (selectedDate) {
          const [selYear, selMonth, selDay] = selectedDate.split("-").map(Number);
          if (year === selYear && month === (selMonth - 1) && day === selDay) {
            cell.classList.add("selected");
          }
        }
        cell.addEventListener("click", () => {
          datesGrid.querySelectorAll(".date-cell.selected").forEach(el => el.classList.remove("selected"));
          cell.classList.add("selected");
          const dayStr = String(day).padStart(2, "0");
          const monthStr = String(month + 1).padStart(2, "0");
          selectedDate = `${year}-${monthStr}-${dayStr}`;
        });
        datesGrid.appendChild(cell);
      }
    }
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });
    nextMonthBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });
    closeCalendarBtn.addEventListener("click", closeCalendarModal);
    saveCalendarBtn.addEventListener("click", () => {
      if (!selectedDate) {
        alert("Please select a date first.");
        return;
      }
      console.log("Selected date:", selectedDate);
      selectDateAndTime(selectedDate);
      closeCalendarModal();
    });
    function selectDateAndTime(dateStr) {
      console.log("Filtering tasks for date:", dateStr);
      const filteredTasks = tasks.filter(task => task.date === dateStr);
      filteredTasks.sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return a.time.localeCompare(b.time);
      });
      if (filteredTasks.length === 0) {
        showHtmlNotification("No Tasks Found", "No tasks available for the selected date.");
      }
      renderTasks(filteredTasks);
    }
    function resetTaskForm() {
      taskForm.reset();
    }
  
    // Initial fetch of tasks from backend
    fetchTasks();
    fetchLists(); 
  });
  