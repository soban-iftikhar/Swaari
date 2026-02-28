# Swaari Backend

Node.js/Express REST API server with MongoDB for the Swaari application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose v9
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Password Security**: bcrypt
- **Validation**: express-validator
- **Environment**: dotenv

## Project Structure

```
Backend/
├── app.js              # Main application entry point
├── package.json        # Dependencies and scripts
├── configs/
│   └── db.js          # Database connection configuration
├── controllers/
│   └── userController.js  # User request handlers
├── models/
│   └── User.js        # User model schema
├── routes/
│   └── userRoutes.js  # User API routes
└── services/
    └── userService.js # User business logic
```

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the Backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swaari
ACCESS_TOKEN_SECRET=your_secure_access_token_secret_here
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret_here
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will run on `http://localhost:5000` (or the PORT specified in .env)

## API Endpoints

### User Routes
Base URL: `/api/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | Login user | No |
| GET | `/profile` | Get user profile | Yes |
| [Add more routes as implemented] | | | |

## User Model Schema

```javascript
{
  fullname: {
    firstname: String,  // min 3 chars, required
    lastname: String    // min 3 chars, required
  },
  email: String,        // unique, lowercase, min 5 chars
  password: String,     // hashed, min 8 chars
  socketId: String,     // for real-time features
  refreshToken: String  // for token refresh mechanism
}
```

## Authentication

This API uses JWT-based authentication with two token types:

### Access Token
- Short-lived (1 hour)
- Used for authenticating API requests
- Sent in Authorization header: `Bearer <token>`

### Refresh Token
- Long-lived (7 days)
- Stored in database
- Used to obtain new access tokens

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Never stored in plain text
- Password field not returned in queries by default (`select: false`)

## API Request/Response Examples

### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Login User
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "user": {
    "_id": "...",
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john@example.com"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

## Database Connection

The database connection is established using Mongoose and configured in `configs/db.js`. The connection is initialized before the Express server starts.

## Error Handling

- Validation errors return 400 status
- Authentication errors return 401 status
- Not found errors return 404 status
- Server errors return 500 status

[Add more details as error handling is implemented]

## Validation Rules

### User Registration
- firstname: minimum 3 characters
- lastname: minimum 3 characters
- email: valid email format, minimum 5 characters, unique
- password: minimum 8 characters

## Development Notes

- Uses ES6 modules (`"type": "module"` in package.json)
- Follows MVC architecture pattern
- Service layer handles business logic
- Controllers handle HTTP requests/responses
- Routes define API endpoints

## Testing

[Add testing information as tests are implemented]

## Deployment

[Add deployment instructions here]

---

**Last Updated**: February 28, 2026
