// Popup control
const popup = document.getElementById('customPopup');
const popupClose = document.querySelector('.popup-close');

function showPopup(title, message) {
  document.getElementById('popupTitle').textContent = title;
  document.getElementById('popupMessage').textContent = message;
  popup.classList.remove('hidden');
}

function hidePopup() {
  popup.classList.add('hidden');
}

popupClose.addEventListener('click', hidePopup);
window.addEventListener('click', (e) => {
  if (e.target === popup) hidePopup();
});

document.querySelector('.auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();

    if (result.success) {
      
      localStorage.setItem("userId", result.user_id); 
      localStorage.setItem("username",result.user_name);
      localStorage.setItem("token", result.token);
      showPopup('Success!', 'Login successful. Redirecting...');
      
      setTimeout(() => {
        window.location.replace('./dashboard.html');
      }, 1500);
    
      
    } else {
      showPopup('Error', result.message || 'Invalid email or password');
    }
  } catch (error) {
    showPopup('Server Error', 'Please try again later.');
  }
});

// Replace 127.0.0.1 with localhost
document.querySelector('.google-btn').addEventListener('click', () => {
  window.location.href = 'http://localhost:5000/api/auth/google';
});

document.querySelector('.github-btn').addEventListener('click', () => {
  window.location.href = 'http://localhost:5000/api/auth/github';
});

