# 🏪 GoodVibe Store Assistant

A modern, full-featured **Point of Sale (POS) and Repair Management System** built with Python FastAPI and vanilla JavaScript. Designed for mobile repair shops, electronics stores, and similar retail businesses.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)

## ✨ Features

### 🛒 Point of Sale
- Fast product search with instant results
- Customer management with phone lookup
- Multiple payment modes (Cash, UPI, Card)
- Discount support
- Invoice printing with thermal printer support
- Recent sales history with search

### 🔧 Repairs Management
- Full job lifecycle tracking (Received → Diagnosing → In Progress → Ready → Delivered)
- **Drag & Drop Kanban board** for easy status updates
- Technician assignment
- Customer notifications via WhatsApp
- Repair billing integration with POS
- Job notes and cost tracking

### 📦 Inventory
- Product catalog with categories
- Stock quantity tracking
- Low stock alerts on dashboard
- Service items (no stock tracking)
- Quick edit and delete

### 📊 Dashboard
- Animated statistics cards with count-up effects
- Sales revenue by period (Today, 7 Days, 30 Days, etc.)
- Open jobs counter
- Low stock alerts
- Recent jobs and purchases
- Ready for billing widget

### 🛍️ Purchases
- Supplier management
- Purchase order entry
- Cost tracking
- Purchase history

### 🤖 AI Assistant (Optional)
- Natural language queries about inventory, sales, and repairs
- Low stock summarization
- Powered by local Ollama or cloud AI

### 🔐 Authentication
- User login with session management
- Admin and Technician roles
- Password hashing with bcrypt

### 🌙 UI/UX
- **Dark/Light mode** toggle
- Modern glassmorphism design
- Smooth animations
- Responsive layout
- Custom icon pack

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/Sharuk-code/store-assistant.git
cd store-assistant

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install fastapi uvicorn jinja2 python-multipart bcrypt

# Run the application
uvicorn main:app --reload --port 8000
```

### Access
Open your browser and go to: **http://localhost:8000**

**Default Login:**
- Username: `admin`
- Password: `admin123`

## 📁 Project Structure

```
store_assistant/
├── main.py              # FastAPI application & API routes
├── models.py            # Pydantic models
├── database.py          # SQLite database setup
├── ai_service.py        # AI assistant integration
├── static/
│   ├── css/style.css    # All styles (dark mode, animations)
│   ├── js/
│   │   ├── app.js       # Main router
│   │   └── modules/     # Feature modules (pos, repairs, etc.)
│   └── icons/           # SVG icons and logo
└── templates/
    ├── index.html       # Main SPA template
    ├── login.html       # Login page
    └── invoice.html     # Print invoice template
```

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, SQLite
- **Frontend:** Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Styling:** Custom CSS with CSS Variables, Glassmorphism
- **Icons:** Custom SVG icon pack
- **AI:** Ollama (optional)

## 📱 Screenshots

| Dashboard | POS | Repairs |
|-----------|-----|---------|
| Modern animated cards | Quick product search | Drag & drop Kanban |

## 🔧 Configuration

### Environment Variables (Optional)
Create a `.env` file for AI integration:
```env
OLLAMA_BASE_URL=http://localhost:11434
```

### Database
SQLite database is created automatically on first run at `store.db`.

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

Made with ❤️ by [Sharuk-code](https://github.com/Sharuk-code)
