# Swaari Backend

Node.js + Express REST API for Swaari with MongoDB and JWT auth.

## Tech Stack

- Node.js
- Express.js v5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Cookie parsing (`cookie-parser`)
- Request validation (`express-validator`)
- Env management (`dotenv`)

## Folder Structure

```
Backend/
├── app.js
├── package.json
├── configs/
│   └── db.js
├── controllers/
│   ├── userController.js
│   └── driverController.js
├── middlewares/
│   └── AuthMiddleware.js
├── models/
│   ├── User.js
│   ├── Driver.js
│   └── BlackListToken.js
├── routes/
│   ├── userRoutes.js
│   └── driverRoutes.js
├── services/
│   └── authService.js
└── utils/
    └── authPlugin.js
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env` in `Backend/`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=Swaari
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

Notes:
- You can also use `MONGODB_URI` instead of `MONGO_URI`.
- `DB_NAME` is important to avoid connecting to MongoDB default `test` DB.

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Base URL: `http://localhost:5000`

## API Routes

### User Routes
Base path: `/api/users`

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/profile` | Current user profile | Yes |
| GET | `/logout` | Logout current user | Yes |

### Driver Routes
BaseUser Register

`POST /api/users/register`

```json
{
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "email": "john@example.com",
  "password": "Password123"
}
```

### User Login

`POST /api/users/login`

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Driver Register

`POST /api/drivers/register`

```json
{
  "fullName": {
    "firstName": "Ahmed",
    "lastName": "Khan"
  },
  "email": "driver@example.com",
  "password": "Password123",
  "vehicle": {
    "color": "white",
    "licensePlate": "ABC-123",
    "make": "Suzuki",
    "year": 2023,
    "capacity": 4,
    "type": "mini"
  }
}
```

### Driver Login

`POST /api/drivers/login`

```json
{
  "email": "driver@example.com",
  "password": "Password123"
}
```

### Login

`POST /api/users/login`

```json
{
  "email": "soban@example.com",
  "password": "Password123"
}
```

## Auth Behavior

- Access token expiry: `1h`
- Refresh token expiry: `7d`
- `refreshToken` is saved in DB
- Login also sets `accessToken` as an HTTP-only cookie
- Protected routes expect:
  - `Authorization: Bearer <accessToken>` header
  - (or access token cookie if configured)

Logout behavior:
- Clears `accessToken` cookie
- Stores current access token in `BlackListToken` collection

## Typical Success Response (Register/Login)

```json
{
  "accessToken": "...",
  "refreshToUser: `POST /api/users/register`
2. Login User: `POST /api/users/login`
3. Copy `accessToken` from response
4. Call protected routes with header:

```text
Authorization: Bearer <accessToken>
```

5. Get Profile: `GET /api/users/profile`
6. Logout: `GET /api/users/logout`

Same flow works for `/api/drivers/*` endpoints.

## Architecture

### Services
- **authService**: Generic auth logic (register, login, logout) for any user type
- Reusable for User, Driver, Admin, etc.

### Utils
- **authPlugin**: Mongoose plugin adding JWT token generation and password hashing
- Applied to both User and Driver models
- Eliminates code duplication

### Key Features
- ✅ Reusable auth logic (User & Driver share same authService)
- ✅ Mongoose plugin pattern for models
- ✅ JWT tokens with secure HTTP-only cookies
- ✅ Token blacklisting on logout
- ✅ Protected routes with auth middleware
- ✅ Request validation with express-validator
- ✅ ES modules throughout

## Notes

- Uses ES modules (`"type": "module"`).
- DB connection configured in `configs/db.js` with explicit DB name.
- Auth middleware is in `middlewares/AuthMiddleware.js`.
- Vehicle types: bike, auto_rickshaw, mini, sedan, suv, van
Register:
- `fullName.firstName` required
- `fullName.lastName` required
- `email` must be valid
- `password` minimum 8 chars

Login:
- `email` must be valid
- `password` minimum 8 chars

## Error Responses

- `400` validation / bad request
- `401` invalid credentials / unauthorized
- `500` internal server error

## Postman Quick Test

1. Register with `POST /api/users/register`
2. Login with `POST /api/users/login`
3. Copy `accessToken` from response
4. Call protected routes with header:

```text
Authorization: Bearer <accessToken>
```

5. Test logout using `GET /api/users/logout`

## Notes

- Uses ES modules (`"type": "module"`).
- DB connection configured in `configs/db.js` with explicit DB name.
- Auth middleware is in `middlewares/AuthMiddleware.js`.

---

**Last Updated:** February 28, 2026
