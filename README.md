# Tomato — Full-Stack Food Delivery Application

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8_SSL-4479A1?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Tomato is a full-stack food ordering and delivery web application built with a React frontend and a Node.js/Express REST backend connected to a MySQL database. It features responsive design, live food search, real-time cart persistence, dark mode support, order history tracking, and user profile management.

---

## Key Features

### Frontend & User Experience
- **Modern UI/UX**: Built with custom CSS variables, glassmorphic card layouts, hover transitions, and typography using the Outfit Google font.
- **Dark Mode & Light Mode**: Theme toggle with local storage persistence and high-contrast form fields.
- **Live Search**: Real-time navbar search filtering across dish titles and culinary descriptions.
- **12 Food Categories & 48+ Dishes**: Includes items across Pizzas, Burgers, Biryani, Sushi, Pasta, Rolls, Desserts, and Veg options.
- **Currency Pricing**: Formatted in Indian Rupees (INR) with realistic pricing and delivery charge calculations.

### Backend & Database Architecture
- **JWT Authentication & Password Hashing**: User registration and login using bcryptjs password hashing and JSON Web Tokens.
- **Auto-Initializing MySQL Database**: Connection pool using mysql2/promise that automatically creates the database and required tables (users, food_items, cart_items, orders, order_items).
- **Cloud Database SSL Support**: SSL connection support for cloud MySQL providers like TiDB Cloud, AWS RDS, and Azure.
- **Real-Time Cart Synchronization**: Backend-synced cart persisting items across user sessions.
- **Order History & Summary**: Dedicated orders page displaying tracking status (Food Processing, Out for Delivery, Delivered) and filters for today's orders vs history.
- **User Profile Management**: User profile section allowing users to update their name, phone, address, profession, bio, and dietary preferences (Pure Veg, Non-Veg, Vegan, Eggetarian).

---

## Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, React Router DOM v6, Context API, CSS Variables, Vite 5 |
| **Backend** | Node.js, Express.js, CORS, Dotenv, Multer |
| **Authentication** | JSON Web Tokens (jsonwebtoken), bcryptjs |
| **Database** | MySQL 8 (mysql2/promise connection pool with SSL) |

---

## Project Structure

```
Food del/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL Connection Pool & Table Initialization
│   ├── controllers/
│   │   ├── cartController.js  # Cart management
│   │   ├── foodController.js  # Food listing, seeding & Multer upload handling
│   │   ├── orderController.js # Order placement & user order history
│   │   └── userController.js  # User authentication & profile management
│   ├── middleware/
│   │   ├── auth.js            # JWT Token verification middleware
│   │   └── errorHandler.js    # Centralized Express error handler
│   ├── routes/
│   │   ├── cartRoute.js       # Cart REST routes
│   │   ├── foodRoute.js       # Food management REST routes
│   │   ├── orderRoute.js      # Order management REST routes
│   │   └── userRoute.js       # User auth & profile REST routes
│   ├── uploads/               # Static image uploads directory
│   ├── .env                   # Environment variables
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express application entry point
│
└── frontend/
    ├── src/
    │   ├── assets/            # Food photography and icons
    │   ├── components/
    │   │   ├── AppDownload/   # Mobile app download section
    │   │   ├── ExploreMenu/   # Category selector carousel
    │   │   ├── FoodDisplay/   # Dish grid and search empty states
    │   │   ├── FoodItem/      # Food item card with quantity controls
    │   │   ├── Footer/        # Footer component with links and brand info
    │   │   ├── Header/        # Hero header banner
    │   │   ├── LoginPopup/    # Authentication modal
    │   │   ├── Logo/          # Vector SVG brand logo component
    │   │   └── Navbar/        # Navigation bar with search and theme toggle
    │   ├── context/
    │   │   └── StoreContext.jsx # Global context state (Cart, Token, Food List, Search)
    │   ├── pages/
    │   │   ├── Cart/          # Order summary and checkout page
    │   │   ├── Home/          # Main landing page
    │   │   ├── MyOrders/      # Order tracking and history page
    │   │   ├── PlaceOrder/    # Delivery address form
    │   │   └── Profile/       # User profile details and edit form
    │   ├── App.jsx            # Main app routes and layout
    │   ├── main.jsx           # React DOM entry point
    │   └── index.css          # Global CSS variables and styles
    ├── package.json           # Frontend dependencies
    └── vite.config.js         # Vite bundler configuration
```

---

## API Endpoint Reference

### User Auth & Profile Routes (`/api/user`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/user/register` | Register a new user | No |
| `POST` | `/api/user/login` | Authenticate user and return JWT token | No |
| `GET` | `/api/user/me` | Fetch logged-in user profile details | Yes (`token` header) |
| `POST` | `/api/user/update` | Update user profile information | Yes (`token` header) |

### Food Management Routes (`/api/food`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/food/list` | List all available dishes (auto-seeds if empty) | No |
| `POST` | `/api/food/add` | Add a new dish with image upload | No |
| `POST` | `/api/food/remove` | Delete a food item by ID | No |

### Cart Routes (`/api/cart`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/cart/get` | Fetch active user cart | Yes (`token` header) |
| `POST` | `/api/cart/add` | Add or increment item quantity in cart | Yes (`token` header) |
| `POST` | `/api/cart/remove` | Decrement item quantity in cart | Yes (`token` header) |

### Order Routes (`/api/order`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/order/place` | Place an order and record line items | Yes (`token` header) |
| `GET` | `/api/order/userorders` | Retrieve user order history and tracking status | Yes (`token` header) |

---

## Quick Start & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server (Local or Cloud provider such as TiDB Cloud or AWS RDS)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

Create a `.env` file inside the `backend/` directory:
```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fooddel
DB_PORT=3306
DB_SSL=false
JWT_SECRET=super_secret_food_del_jwt_key_2026
```

Start the backend server:
```bash
npm start
```
The server starts at `http://localhost:4000` and initializes the database tables automatically.

---

### 2. Frontend Setup
```bash
# Navigate to frontend directory in a separate terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

