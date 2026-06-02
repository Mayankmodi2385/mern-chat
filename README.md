# MERN Chat Application 💬

A real-time chat application built using the MERN Stack (MongoDB, Express.js, React.js, Node.js) with secure authentication and instant messaging features.

## 🚀 Features

- User Authentication (Register/Login)
- JWT-based Authentication
- Real-Time Messaging
- One-to-One Chat
- Responsive UI
- User Profile Management
- Secure Password Hashing using bcrypt
- REST API Integration
- MongoDB Database
- Modern React Frontend

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Axios
- React Router DOM
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js

### Real-Time Communication
- Socket.IO

## 📂 Project Structure

```
mern-chat/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── sockets/
│   └── server.js
│
└── README.md
```

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/mern-chat.git
cd mern-chat
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Start Backend Server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start Frontend:

```bash
npm run dev
```

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|----------|------------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login User |
| GET | /api/auth/profile | Get User Profile |

### Chat

| Method | Endpoint | Description |
|----------|----------|------------|
| GET | /api/chat/users | Get All Users |
| GET | /api/chat/:id | Get Messages |
| POST | /api/chat/send/:id | Send Message |


## 🔒 Security Features

- Password Hashing with bcrypt
- JWT Authentication
- Protected Routes
- Environment Variable Protection
- Input Validation

## 🌟 Future Enhancements

- Group Chats
- Voice Messages
- Video Calling
- Message Reactions
- File Sharing
- Dark Mode
- Read Receipts

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Mayank Modi

LinkedIn: https://www.linkedin.com/in/modimayank63/

GitHub: https://github.com/Mayankmodi2385

---

⭐ If you like this project, don't forget to star the repository.
