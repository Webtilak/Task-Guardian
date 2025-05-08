document.addEventListener("DOMContentLoaded", function() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // -------------------------------
  // Tab Switching Functionality
  // -------------------------------
  const settingsItems = document.querySelectorAll(".settings-item");
  const settingsPanels = document.querySelectorAll(".settings-panel");

  settingsItems.forEach(item => {
    item.addEventListener("click", function() {
      // Remove active class from all items and panels
      settingsItems.forEach(i => i.classList.remove("active"));
      settingsPanels.forEach(p => p.classList.remove("active-panel"));

      // Add active class to the clicked tab and its corresponding panel
      this.classList.add("active");
      const targetId = this.getAttribute("data-target");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active-panel");
      }
    });
  });

  // -------------------------------
  // Popup functions for user feedback
  // -------------------------------
  function showPopup(message) {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popup-message");
    popupMessage.innerText = message;
    popup.classList.remove("hidden");
  }
  function hidePopup() {
    document.getElementById("popup").classList.add("hidden");
  }
  document.getElementById("popup-close").addEventListener("click", hidePopup);
  document.getElementById("popup").addEventListener("click", function(e) {
    if (e.target === this) hidePopup();
  });

  // -------------------------------
  // 1. Load Current User Settings
  // -------------------------------
  async function loadUserSettings() {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/settings/?user_id=${userId}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const settings = data.settings;
        // Update the UI fields with the retrieved settings
        document.getElementById("username").value = settings.name || "";
        document.getElementById("emailProfile").value = settings.email || "";
        // For appearance settings, update dark mode toggle and accent color input:
        if (document.getElementById("darkModeToggle")) {
          document.getElementById("darkModeToggle").checked = settings.dark_mode;
        }
        if (document.getElementById("accentColor")) {
          document.getElementById("accentColor").value = settings.accent_color;
        }
        // For notification settings:
        if (document.getElementById("emailNotifications")) {
          document.getElementById("emailNotifications").checked = settings.email_notifications;
        }
        if (document.getElementById("smsNotifications")) {
          document.getElementById("smsNotifications").checked = settings.sms_notifications;
        }
        if (document.getElementById("pushNotifications")) {
          document.getElementById("pushNotifications").checked = settings.push_notifications;
        }
        // Update profile picture preview if available (append timestamp to force refresh)
        if (settings.profile_picture) {
          document.getElementById("profilePicture").src =
            `http://127.0.0.1:5000/api/settings/uploads/${settings.profile_picture}?t=${new Date().getTime()}`;
        }
      } else {
        showPopup("Failed to load settings: " + data.message);
      }
    } catch (error) {
      showPopup("Error loading settings.");
      console.error(error);
    }
  }
  loadUserSettings();

  // -------------------------------
  // 2. Save Updated Settings
  // -------------------------------
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      // Collect updated values (phone field removed)
      const name = document.getElementById("username").value.trim();
      const email = document.getElementById("emailProfile").value.trim();
      const darkMode = document.getElementById("darkModeToggle") ? document.getElementById("darkModeToggle").checked : null;
      const accentColor = document.getElementById("accentColor") ? document.getElementById("accentColor").value : null;
      const emailNotifications = document.getElementById("emailNotifications") ? document.getElementById("emailNotifications").checked : null;
      const smsNotifications = document.getElementById("smsNotifications") ? document.getElementById("smsNotifications").checked : null;
      const pushNotifications = document.getElementById("pushNotifications") ? document.getElementById("pushNotifications").checked : null;

      const payload = {
        email,
        name,
        dark_mode: darkMode,
        accent_color: accentColor,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        push_notifications: pushNotifications
      };

      try {
        const response = await fetch("http://127.0.0.1:5000/api/settings/", {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        showPopup(data.message);
        if (data.success) {
          // Reload settings if needed
          loadUserSettings();
        }
      } catch (error) {
        showPopup("Error updating settings.");
        console.error(error);
      }
    });
  });

  // -------------------------------
  // 3. Upload Profile Picture
  // -------------------------------
  const uploadBtn = document.querySelector(".upload-btn");
  const fileInput = document.getElementById("profilePictureInput");
  uploadBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/settings/upload-profile-picture", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      showPopup(data.message);
      if (data.success) {
        // Update the profile picture preview (force refresh)
        document.getElementById("profilePicture").src =
          `http://127.0.0.1:5000/api/settings/uploads/${data.profile_picture}?t=${new Date().getTime()}`;
      }
    } catch (error) {
      showPopup("Error uploading profile picture.");
      console.error(error);
    }
  });

  // -------------------------------
  // 4. Change Password
  // -------------------------------
  document.getElementById("changePasswordBtn")?.addEventListener("click", async () => {
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    if (newPassword !== confirmPassword) {
      showPopup("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch("http://127.0.0.1:5000/api/settings/update-password", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await response.json();
      showPopup(data.message);
    } catch (error) {
      showPopup("Error updating password.");
      console.error(error);
    }
  });

  // -------------------------------
  // 5. Logout
  // -------------------------------
  document.getElementById("settingsLogoutBtn")?.addEventListener("click", async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/settings/logout", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        showPopup("Logging out...");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "login.html";
        }, 1500);
      } else {
        showPopup(data.message);
      }
    } catch (error) {
      showPopup("Error during logout.");
      console.error(error);
    }
  });
});
