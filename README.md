# 🛡️ Task Reminder

Task Guardian is a full-stack task management web application that helps users organize their tasks, set reminders, and stay productive. It supports authentication, task grouping, and reminder notifications.

---

## 🚀 Features

* ✅ User Authentication (Email, Google, GitHub)
* 🗂️ Task creation, editing, and deletion
* 🗌️ Organize tasks into lists
* ⏰ Email-based task reminders
* 🔒 JWT and Session-based authentication
* 🌐 Fully responsive web interface

---

## 🧱 Tech Stack

### 👥 Frontend

* HTML, CSS, JavaScript

### 🔧 Backend

* Python Flask
* PostgreSQL
* Flask-Mail (for reminders)
* JWT & Flask-Login

---

## 🔐 Environment Variables

Create a `.env` file in the `server/` directory with the following:

```env
FLASK_APP=app.py
SECRET_KEY=your_flask_secret_key
DATABASE_URL=your_database_url

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

> ⚠️ Do NOT commit this file. Instead, include a `.env.example` for reference.

---

## 📦 Setup & Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Webtilak/Task-Guardian.git
cd Task-Guardian
```

### 2. Setup the backend

```bash
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

### 3. Open in browser

Visit: `http://localhost:5000`

---

## 🛠️ Common Issue: Flask Import Not Resolved in VS Code

If you see the error `Import "flask" could not be resolved (PylancereportMissingImports)` in VS Code, follow these steps:

1. **Install Flask**  
   Ensure Flask is installed in your environment:
   ```bash
   pip install flask
   ```

2. **Activate Virtual Environment**  
   Activate the virtual environment **before running or editing**:
   ```bash
   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Select Correct Python Interpreter in VS Code**  
   - Open Command Palette: `Ctrl+Shift+P`
   - Search: `Python: Select Interpreter`
   - Choose the one from the `venv/` directory

Then reload VS Code if needed.

---

## 🧪 Test Accounts

You can register using:

* Email/password
* Google or GitHub OAuth

---

## 📟 License

MIT License. Feel free to use, modify, and share!

---

## 🙌 Acknowledgments

* Flask Documentation  
* PostgreSQL  
* Google & GitHub OAuth  
