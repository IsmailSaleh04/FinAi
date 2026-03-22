async function fillInternalTransferForm() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`/api/auth/get_accounts?userId=${userId}`);
  const accounts = await res.json();

  const from = document.getElementById("internalFrom");
  const to = document.getElementById("internalTo");
  from.innerHTML = "";
  to.innerHTML = "";

  accounts.forEach(acc => {
    const option = `<option value="${acc.iban}">${acc.bank_name} – ${acc.iban}</option>`;
    from.innerHTML += option;
    to.innerHTML += option;
  });
}

async function fillExternalTransferForm() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`/api/auth/get_accounts?userId=${userId}`);
  const accounts = await res.json();

  const from = document.getElementById("externalFrom");
  from.innerHTML = "";
  accounts.forEach(acc => {
    from.innerHTML += `<option value="${acc.iban}">${acc.bank_name} – ${acc.iban}</option>`;
  });
}


function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.getElementById("transfer-my-accounts").addEventListener("click", () => {
  fillInternalTransferForm();
  openModal("internalTransferModal");
});

document.getElementById("transfer-other-person").addEventListener("click", () => {
  fillExternalTransferForm();
  openModal("externalTransferModal");
});


document.getElementById("confirmInternalTransfer").addEventListener("click", async () => {
  const from = document.getElementById("internalFrom").value;
  const to = document.getElementById("internalTo").value;
  const amount = parseFloat(document.getElementById("internalAmount").value);
  const userId = localStorage.getItem("userId");

  if (from === to) return alert("Cannot transfer to the same account");

  const res = await fetch("/api/transactions/transfer/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, fromIban: from, toIban: to, amount }),
  });

  if (res.ok) {
    alert("Transfer successful!");
    closeModal("internalTransferModal");
    fetchAndDisplayAccounts();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
});

document.getElementById("confirmExternalTransfer").addEventListener("click", async () => {
  const from = document.getElementById("externalFrom").value;
  const to = document.getElementById("externalTo").value.trim();
  const amount = parseFloat(document.getElementById("externalAmount").value);
  const userId = localStorage.getItem("userId");

  if (!to) return alert("Please enter destination IBAN");

  const res = await fetch("/api/transactions/transfer/external", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, fromIban: from, toIban: to, amount }),
  });

  if (res.ok) {
    alert("Transfer successful!");
    closeModal("externalTransferModal");
    fetchAndDisplayAccounts();
  } else {
    const data = await res.json();
    alert("Error: " + data.error);
  }
});