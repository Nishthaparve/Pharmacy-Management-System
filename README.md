# 💊 PharmaCare - Pharmacy Management System

A full-stack Pharmacy Management System developed to simplify pharmacy operations through digital inventory management, secure authentication, and efficient order processing.

---

## 📌 Overview

PharmaCare is a web-based application that enables pharmacists to efficiently manage medicines, inventory, and customer orders while providing patients with a simple and secure platform to access pharmacy services.

The system minimizes manual work, improves inventory tracking, and enhances the overall healthcare experience.

---

## 🚀 Problem Statement

Traditional pharmacy management often relies on manual processes, resulting in:

* Inventory management errors
* Difficulty in tracking medicine stock
* Delays in order processing
* Time-consuming record management
* Lack of instant customer assistance

These challenges reduce efficiency and affect customer satisfaction.

---

## 💡 Proposed Solution

PharmaCare provides a centralized digital platform where:

* Pharmacists can manage medicine inventory.
* Patients can register and securely log in.
* Users can browse medicines and place orders.
* Orders can be tracked efficiently.
* Pharmacy operations become faster, secure, and more organized.

---

## ✨ Features

* 🔐 Secure User Authentication (JWT)
* 💊 Medicine Inventory Management
* 🛒 Order Management
* 👨‍⚕️ Patient Dashboard
* 👩‍⚕️ Pharmacist Dashboard
* 📦 Real-Time Inventory Updates
* 🔍 Smart Medicine Search
* 🌐 REST API Integration
* 📱 Responsive User Interface
* 🤖 AI Chatbot for Healthcare Assistance *(Planned Feature)*

---

## 🛠 Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JSON Web Token (JWT)

### Tools

* Git
* GitHub
* VS Code
* Postman

---

## 📂 Project Structure

```text
Pharmacy-Management-System
│
├── backend
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Nishthaparve/Pharmacy-Management-System.git
```

### Navigate to Backend

```bash
cd Pharmacy-Management-System/backend
```

### Install Dependencies

```bash
npm install
```

### Create Environment Variables

Create a `.env` file inside the `backend` folder.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Start MongoDB

```bash
mongod --dbpath "C:\Users\<YourUsername>\mongodb-data"
```

### Run Backend

```bash
npm run dev
```

### Open Frontend

Open:

```text
frontend/index.html
```

using Live Server or any local web server.

---

## 🔮 Future Enhancements

* 🤖 AI-powered Healthcare Chatbot
* 💳 Online Payment Gateway
* 📄 Prescription Upload & Verification
* 💊 Medicine Recommendation System
* 📧 Email Notifications
* 📱 Mobile Application
* 📊 Analytics Dashboard
* 🔔 Medicine Reminder System

---

## 🤝 Contributing

Contributions, suggestions, and improvements are always welcome.

Feel free to fork the repository and submit a pull request.

---

## 📄 License

This project is developed for educational and learning purposes.

---

### ⭐ If you found this project helpful, don't forget to Star the repository!
