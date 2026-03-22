// public/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".finai-login-form");
  const signupForm = document.querySelector(".finai-signup-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("name", data.name); // Store user's name for dashboard
        window.location.href = "/dashboard.html"; // Redirect after login
      } else {
        alert(data.message || "Login failed");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirm-password").value,
        nationalId: document.getElementById("national-id").value,
      };

      if (user.password !== user.confirmPassword) {
        return alert("Passwords do not match");
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();
      alert(data.message);
    });
  }
});
