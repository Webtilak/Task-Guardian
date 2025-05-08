document.addEventListener('DOMContentLoaded', function() {
  // ========== SIDEBAR TOGGLE ==========
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  function toggleSidebar() {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener("click", function(e) {
      toggleSidebar();
      e.stopPropagation();
    });

    overlay.addEventListener("click", closeSidebar);
    
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && e.target !== hamburgerBtn) {
        closeSidebar();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeSidebar();
    });
  }

  // ========== CALENDAR INITIALIZATION ==========
  // Fetch events from the backend API
  fetch('http://127.0.0.1:5000/api/calendar/events', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch events");
    return response.json();
  })
  .then(events => {
    // initialize and render the calendar using events for the logged-in user
    const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: events,
      editable: true,
      navLinks: true,
      dayMaxEvents: true,
      contentHeight: 'auto',
      eventClick: function(info) {
        showNotification(
          info.event.title,
          info.event.extendedProps.description || 'No description'
        );
      },
      windowResize: function(view) {
        calendar.updateSize();
      }
    });
    calendar.render();
  })
  .catch(err => {
    showNotification("Error", "Failed to load calendar events. Please try again.");
    console.error(err);
  });
  

  // ========== NOTIFICATION SYSTEM ==========
// ========== MODAL SYSTEM ==========
const modalPopup = document.getElementById("modalPopup");
const closeModal = document.getElementById("closeModal");

function showNotification(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = content;
  modalPopup.classList.remove("hidden");
  document.getElementById("notifSound").play();
  
  // setTimeout(() => {
  //   modalPopup.classList.add("hidden");
  // }, 5000);
}

if (closeModal) {
  closeModal.addEventListener("click", () => {
    modalPopup.classList.add("hidden");
  });
}

// Close modal when clicking outside
modalPopup.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    modalPopup.classList.add("hidden");
  }
});

  // ========== GLOBAL REFRESH FUNCTION ==========
  window.updateCalendarEvents = function() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    calendar.removeAllEvents();
    calendar.addEventSource(getCalendarEvents());
    calendar.refetchEvents();
  };

  // Handle initial mobile view
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
});