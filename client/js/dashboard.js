document.addEventListener("DOMContentLoaded", function() {

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const userId = params.get("user_id");
  const userName = params.get("user_name");

  if (token && userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("username", userName);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  history.pushState(null, null, window.location.href);
  window.onpopstate = function() { history.go(1); };
  window.history.replaceState(null, null, window.location.href);

  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sidebar = document.getElementById("sidebar");
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener("click", function(e) {
      sidebar.classList.toggle("sidebar-open");
      e.stopPropagation();
    });
    document.addEventListener("click", function(e) {
      if (sidebar.classList.contains("sidebar-open") && !sidebar.contains(e.target) && e.target !== hamburgerBtn) {
        sidebar.classList.remove("sidebar-open");
      }
    });
  }

  const calendarBtn = document.querySelector(".my-calendar-btn");
  if (calendarBtn) {
    calendarBtn.addEventListener("click", function() {
      const calendarSection = document.getElementById("calendar");
      if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "calendar.html";
      }
    });
  }

  async function fetchDashboardStats() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/statistics/dashboard", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const stats = data.stats;
        const totalTasks = stats.total_tasks;
        const completed = stats.completed;
        let inProgress = stats.in_progress;
        if (inProgress === 0 && totalTasks > 0) {
          inProgress = totalTasks - completed - stats.pending;
        }
        const pending = stats.pending;
        const efficiency = stats.efficiency;
        const efficiencyElem = document.querySelector(".team-efficiency .percentage");
        if (efficiencyElem) {
          efficiencyElem.textContent = efficiency + "%";
        }
        if (window.pieChartInstance) {
          window.pieChartInstance.data.datasets[0].data = [completed, inProgress, pending];
          window.pieChartInstance.update();
        }
      } else {
        console.error("Error fetching dashboard stats:", data.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }

  async function fetchBarStats() {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/statistics/bar", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const stats = data.stats;
        const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const barData = labels.map(label => stats[label] || 0);
        if (window.barChartInstance) {
          window.barChartInstance.data.datasets[0].data = barData;
          window.barChartInstance.update();
        }
      } else {
        console.error("Error fetching bar stats:", data.message);
      }
    } catch (error) {
      console.error("Error fetching bar stats:", error);
    }
  }

  async function updateDashboardData() {
    try {
      const updateResponse = await fetch("http://127.0.0.1:5000/api/statistics/update_dashboard", { 
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const updateData = await updateResponse.json();
      if (updateData.success) {
        await fetchDashboardStats();
        await fetchBarStats();
      } else {
        console.error("Error updating dashboard:", updateData.message);
      }
    } catch (error) {
      console.error("Error updating dashboard data:", error);
    }
  }

  updateDashboardData();
  setInterval(updateDashboardData, 60000);

  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  if (pieCtx) {
    window.pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'In Progress', 'Pending'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#ff7a00', '#ffbb33', '#a58cff']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const barCtx = document.getElementById('barChart')?.getContext('2d');
  if (barCtx) {
    window.barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
        datasets: [{
          label: 'Efficiency',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#ff7a00'
        }]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }
});
