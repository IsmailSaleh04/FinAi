const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/auth/signup", require("./api/auth/signup"));
app.use("/api/auth/login", require("./api/auth/login"));
app.use('/api/auth/upload_profile_photo', require('./api/auth/upload_profile_photo'));
app.use('/api/auth/user_profile', require('./api/auth/user_profile'));
app.use("/api/auth/bank_options", require("./api/auth/bank_options"));
app.use("/api/auth/add_account_to_db", require("./api/auth/add_account_to_db"));
app.use('/api/auth/create_agreement', require('./api/auth/create_agreement'));
app.use('/api/auth/create_requisition', require('./api/auth/create_requisition'));
app.use("/api/auth/add_account_to_dashboard", require("./api/auth/add_account_to_dashboard"));
app.use("/api/auth/get_accounts", require("./api/auth/get_accounts"));
app.use("/api/chatbot", require("./api/chatbot"));

app.use("/api/get_total_balance", require("./api/savings/get_total_balance"));
app.use("/api/get_goals", require("./api/savings/get_goals"));
app.use("/api/set_target", require("./api/savings/set_target"));
app.use("/api/get_target", require("./api/savings/get_target"));
app.use("/api/add_goal", require("./api/savings/add_goal"));
app.use("/api/update_goals", require("./api/savings/update_goals"));

app.use("/api/transactions/transfer", require("./api/transactions/transfer"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});