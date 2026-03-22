// /js/savings.js
document.addEventListener("DOMContentLoaded", async () => {
  const setTargetBtn = document.getElementById("setTargetBtn");
  const targetModal = document.getElementById("targetModal");
  const confirmTargetBtn = document.getElementById("confirmTarget");
  const cancelTargetModal = document.getElementById("cancelTargetModal");
  const targetInput = document.getElementById("targetInput");

  const addGoalBtn = document.getElementById("addGoalBtn");
  const goalModal = document.getElementById("savingsGoalModal");
  const confirmGoalBtn = document.getElementById("confirmGoal");
  const cancelGoalBtn = document.getElementById("cancelModal");

  const goalsGrid = document.getElementById("goalList");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const userId = localStorage.getItem("userId");

  let totalTarget = 0;
  let totalBankBalance = 0;
  let goals = [];

  async function fetchUserData() {
    try {
      const balanceRes = await fetch("/api/get_total_balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const balanceJson = await balanceRes.json();
      totalBankBalance = parseFloat(balanceJson.totalBalance) || 0;

      const targetRes = await fetch("/api/get_target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const targetJson = await targetRes.json();
      totalTarget = parseFloat(targetJson.totalTarget) || 0;

      const goalsRes = await fetch("/api/get_goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const rawGoals = await goalsRes.json();

      goals = Array.isArray(rawGoals)
        ? rawGoals.map((goal) => ({
            ...goal,
            target_amount: parseFloat(goal.target_amount),
            current_amount: parseFloat(goal.current_amount),
            priority: parseInt(goal.priority),
          }))
        : [];

      await distributeBalanceToGoals();
      renderAllGoals();
      updateProgressBar();
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  function renderAllGoals() {
    goalsGrid.innerHTML = "";
    goals.forEach(addGoalToUI);
  }

  async function distributeBalanceToGoals() {
    if (!goals.length || totalBankBalance <= 0) return;
    const totalPriority = goals.reduce((sum, g) => sum + g.priority, 0);
    if (!totalPriority) return;

    goals = goals.map((g) => ({ ...g, current_amount: 0 }));
    goals.sort((a, b) => b.priority - a.priority);

    for (let goal of goals) {
      const alloc = (goal.priority / totalPriority) * totalBankBalance;
      goal.current_amount = Math.min(goal.target_amount, alloc);
    }

    await updateGoalsInBackend();
  }

  async function updateGoalsInBackend() {
    try {
      await fetch("/api/update_goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, userId }),
      });
    } catch (err) {
      console.error("Update backend failed:", err);
    }
  }

  function updateProgressBar() {
    const saved = goals.reduce((s, g) => s + g.current_amount, 0);
    const pct = totalTarget ? ((saved / totalTarget) * 100).toFixed(1) : 0;
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `$${saved.toFixed(2)} / $${totalTarget.toFixed(
      2
    )} saved (${pct}%)`;
  }

  function addGoalToUI(goal) {
    const div = document.createElement("div");
    div.className = "finai-goal-card";
    const pct = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);
    div.innerHTML = `
      <h4>${goal.goal_name}</h4>
      <p>🎯 $${goal.target_amount}</p>
      <p>⭐ ${goal.priority}</p>
      <div class="progress-bar-container">
        <div class="savings-progress-fill" style="width:${pct}%"></div>
      </div>
      <p>$${goal.current_amount.toFixed(2)} / $${goal.target_amount.toFixed(
      2
    )}</p>
    `;
    goalsGrid.appendChild(div);
  }

  // Modals
  setTargetBtn.onclick = () => targetModal.classList.remove("hidden");
  cancelTargetModal.onclick = () => targetModal.classList.add("hidden");
  addGoalBtn.onclick = () => goalModal.classList.remove("hidden");
  cancelGoalBtn.onclick = () => goalModal.classList.add("hidden");

  confirmTargetBtn.onclick = async () => {
    const val = parseFloat(targetInput.value);
    if (isNaN(val) || val <= 0) return alert("Invalid target");
    totalTarget = val;
    try {
      await fetch("/api/set_target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalTarget, userId }),
      });
      await distributeBalanceToGoals();
      renderAllGoals();
      updateProgressBar();
      targetModal.classList.add("hidden");
      targetInput.value = "";
    } catch (err) {
      console.error("Target error:", err);
    }
  };

  confirmGoalBtn.onclick = async () => {
    const name = document.getElementById("goalSelect").value;
    const priority = parseInt(document.getElementById("goalPriority").value);
    const amount = parseFloat(document.getElementById("goalAmount").value);
    if (!name || isNaN(priority) || isNaN(amount) || amount <= 0) {
      return alert("Fill all fields correctly.");
    }

    const goal = {
      goal_name: name.replace(/[^a-zA-Z0-9 _-]/g, "").trim(),
      priority,
      target_amount: amount,
      current_amount: 0,
    };

    try {
      const res = await fetch("/api/add_goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, userId }),
      });

      if (!res.ok) throw new Error("Failed to add goal");
      const data = await res.json();
      if (!data.id) throw new Error("Missing goal ID");
      goal.id = data.id;

      goals.push(goal);
      await distributeBalanceToGoals();
      renderAllGoals();
      updateProgressBar();
      goalModal.classList.add("hidden");
      document.getElementById("goalAmount").value = "";
    } catch (err) {
      console.error("Add goal failed:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    window.location.href = '/login.html';
  });
  
  await fetchUserData();
});
