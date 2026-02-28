# Swaari

A modern full-stack application built with Node.js, Express, MongoDB, and React.

## Project Overview

Swaari is a web application featuring real-time functionality and secure user authentication. The project is structured as a monorepo with separate backend and frontend directories.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access & Refresh Tokens)
- **Security**: bcrypt for password hashing
- **Real-time**: Socket.io support (socketId in User model)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)

## Project Structure

```
Swaari/
├── Backend/          # Node.js/Express API server
│   ├── app.js
│   ├── configs/      # Configuration files
│   ├── controllers/  # Request handlers
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── services/     # Business logic
├── Frontend/         # React application
│   ├── src/
│   ├── public/
│   └── index.html
└── README.md         # This file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB installed and running
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Swaari
```

2. Set up Backend
```bash
cd Backend
npm install
```

3. Set up Frontend
```bash
cd Frontend
npm install
```

### Environment Variables

Create a `.env` file in the `Backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

### Running the Application

#### Development Mode

**Backend:**
```bash
cd Backend
npm run dev
```
Server runs on `http://localhost:5000`

**Frontend:**
```bash
cd Frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

#### Production Mode

**Backend:**
```bash
cd Backend
npm start
```

**Frontend:**
```bash
cd Frontend
npm run build
npm run preview
```

## Features

### Current Features
- ✅ User authentication (register/login)
- ✅ JWT-based authorization (Access & Refresh tokens)
- ✅ Secure password hashing
- ✅ MongoDB database integration
- ✅ RESTful API architecture
- ✅ Real-time capability (socketId support)

### Planned Features
- 🔄 [Add planned features here as development progresses]

## API Documentation

See [Backend README](./Backend/README.md) for detailed API documentation.

## Development Guidelines

- Follow RESTful conventions for API endpoints
- Use ES6+ JavaScript features
- Maintain separation of concerns (MVC pattern)
- Write clean, documented code
- Test thoroughly before committing

## Contributing

[Add contribution guidelines here]

## License

[Add license information here]

## Contact

[Add contact information here]

---

**Last Updated**: February 28, 2026
