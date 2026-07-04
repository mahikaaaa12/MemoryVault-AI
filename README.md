# 🧠 MemoryVault AI

> **Your AI-Powered Second Brain for Capturing, Organizing, and Retrieving Knowledge**

MemoryVault AI is a full-stack Django application that helps users capture, organize, search, and interact with their personal knowledge using artificial intelligence. It combines intelligent memory management, productivity tools, semantic search, and an AI assistant into a modern, responsive web application.

---

## ✨ Features

### 📚 Memory Management

* Create, edit, and delete memories
* Pin and favorite important memories
* Archive and restore memories
* Organize memories using categories and tags
* Rich text support for notes
* File attachment support

### 🤖 AI Assistant

* Natural language conversations with your knowledge base
* AI-powered memory retrieval
* Context-aware responses
* Persistent chat history
* Intelligent semantic search

### 📅 Productivity

* Task management
* Calendar integration
* Progress tracking
* Activity dashboard
* Productivity insights

### 🔍 Smart Search

* Global search across memories
* Category filtering
* Tag-based filtering
* Full-text search
* Fast database-backed queries

### 👤 User Management

* Secure authentication
* User profiles
* Personalized dashboard
* User-specific data isolation

### ⚙️ Settings

* Profile management
* Account settings
* AI preferences
* Application preferences

---

# 🚀 Tech Stack

### Backend

* Django
* Django ORM
* SQLite (Development)
* PostgreSQL (Production Ready)

### Frontend

* HTML5
* CSS3
* JavaScript
* Django Templates

### AI

* Anthropic Claude API (Configurable)
* TF-IDF Based Semantic Retrieval

### Deployment

* Render
* Gunicorn
* WhiteNoise

---

# 📂 Project Structure

```text
MemoryVault_AI/
│
├── memoryvault_project/
│   ├── settings.py
│   ├── urls.py
│   └── ...
│
├── vault/
│   ├── models.py
│   ├── views/
│   ├── templates/
│   ├── static/
│   ├── forms.py
│   ├── ai_service.py
│   └── migrations/
│
├── media/
├── staticfiles/
├── requirements.txt
├── build.sh
├── Procfile
├── render.yaml
└── manage.py
```

---

# ⚡ Installation

Clone the repository:

```bash
git clone https://github.com/<your-username>/MemoryVault-AI.git
```

Navigate to the project:

```bash
cd MemoryVault-AI
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` as a reference.

Run migrations:

```bash
python manage.py migrate
```

Create a superuser:

```bash
python manage.py createsuperuser
```

Start the development server:

```bash
python manage.py runserver
```

Open your browser and visit:

```text
http://127.0.0.1:8000/
```

---

# 🔑 Environment Variables

Create a `.env` file and configure the following variables:

```env
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=
ANTHROPIC_API_KEY=your_api_key
```

---

# Future Enhancements

* Voice-based memory capture
* OCR for image memories
* Real-time collaboration
* Mobile application
* AI-generated summaries
* Memory recommendation engine
* Multi-language support
* Advanced analytics dashboard

---

# Learning Outcomes

This project demonstrates practical experience with:

* Django Framework
* Django ORM
* Authentication & Authorization
* Database Design
* RESTful Architecture
* AI Integration
* Search Algorithms
* Responsive UI Development
* Production Deployment
* Secure Configuration Management

---

# License

This project is licensed under the MIT License.

---

# Author

**Mahika Mangaonkar**

* GitHub: https://github.com/mahikaaaa12
* LinkedIn: https://www.linkedin.com/in/Mahika-Manga](https://www.linkedin.com/in/mahika-mangaonkar-323036334/

---

⭐ If you found this project interesting, consider giving it a star!
