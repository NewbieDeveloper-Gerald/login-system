// Configuration
// CHANGE THIS TO YOUR RENDER URL BEFORE DEPLOYMENT
// Example: const API_URL = "https://login-system-api.onrender.com";
const API_URL = "https://login-system-api-xxxx.onrender.com";

// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const showRegisterBtn = document.getElementById("showRegister");
const showLoginBtn = document.getElementById("showLogin");
const messageEl = document.getElementById("message");
const registerMessageEl = document.getElementById("registerMessage");
const togglePasswordBtns = document.querySelectorAll(".toggle-password");

// Toggle between Login and Register forms
if (showRegisterBtn) {
  showRegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
    clearMessages();
  });
}

if (showLoginBtn) {
  showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    registerSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
    clearMessages();
  });
}

// Toggle password visibility
togglePasswordBtns.forEach(btn => {
  btn.addEventListener("click", function() {
    const wrapper = this.closest('.password-wrapper');
    const input = wrapper.querySelector('input');
    const icon = this.querySelector('i');
    
    if (input.type === "password") {
      input.type = "text";
      icon.setAttribute("data-lucide", "eye-off");
    } else {
      input.type = "password";
      icon.setAttribute("data-lucide", "eye");
    }
    // Re-render the icon
    lucide.createIcons({
      attrs: {
        class: 'eye-icon'
      },
      nameAttr: 'data-lucide'
    });
  });
});

function clearMessages() {
  if(messageEl) { messageEl.textContent = ""; messageEl.className = "status-message"; }
  if(registerMessageEl) { registerMessageEl.textContent = ""; registerMessageEl.className = "status-message"; }
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
}

function setLoading(button, isLoading) {
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');
  
  if (isLoading) {
    button.disabled = true;
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
  } else {
    button.disabled = false;
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

// Handle Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");
    
    setLoading(btn, true);
    clearMessages();
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(messageEl, "Login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } else {
        showMessage(messageEl, data.message || "Login failed", true);
      }
    } catch (error) {
      console.error("Login Error:", error);
      showMessage(messageEl, "Network error. Is the server running?", true);
    } finally {
      if(messageEl.className !== "status-message status-success") {
        setLoading(btn, false);
      }
    }
  });
}

// Handle Register
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("name").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const btn = document.getElementById("registerBtn");
    
    setLoading(btn, true);
    clearMessages();
    
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(registerMessageEl, "Registration successful! Please login.");
        registerForm.reset();
        
        // Auto switch to login after 1.5s
        setTimeout(() => {
          registerSection.classList.add("hidden");
          loginSection.classList.remove("hidden");
          document.getElementById("email").value = email; // Prefill email
          clearMessages();
          setLoading(btn, false);
        }, 1500);
      } else {
        showMessage(registerMessageEl, data.message || "Registration failed", true);
        setLoading(btn, false);
      }
    } catch (error) {
      console.error("Register Error:", error);
      showMessage(registerMessageEl, "Network error. Is the server running?", true);
      setLoading(btn, false);
    }
  });
}

// Dashboard Logic
function initDashboard() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const dashboardMessageEl = document.getElementById("dashboardMessage");
  const logoutBtn = document.getElementById("logout");
  
  if(logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
  
  fetch(`${API_URL}/api/profile`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Invalid token");
    return data;
  })
  .then(data => {
    if(userNameEl) userNameEl.textContent = data.user.name;
    if(userEmailEl) userEmailEl.textContent = data.user.email;
    
    // We removed initials and just use the user icon in the dashboard avatar now
  })
  .catch(error => {
    console.error("Auth Error:", error);
    if(dashboardMessageEl) showMessage(dashboardMessageEl, "Session expired. Redirecting to login...", true);
    setTimeout(() => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    }, 1500);
  });
}
