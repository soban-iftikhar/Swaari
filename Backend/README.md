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
│   └── userController.js
├── middlewares/
│   └── AuthMiddleware.js
├── models/
│   └── User.js
│   └── BlackListToken.js
├── routes/
│   └── userRoutes.js
└── services/
    └── userService.js
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

Base path: `/api/users`

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/profile` | Current user profile | Yes |
| GET | `/logout` | Logout current user | Yes |

## Request Bodies (Postman)

### Register

`POST /api/users/register`

```json
{
  "fullName": {
    "firstName": "Soban",
    "lastName": "Iftikhar"
  },
  "email": "soban@example.com",
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
  "refreshToken": "...",
  "user": {
    "_id": "...",
    "fullname": {
      "firstname": "Soban",
      "lastname": "Iftikhar"
    },
    "email": "soban@example.com"
  }
}
```

`password`, `refreshToken`, and `__v` are removed from returned `user`.

## Validation Rules

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
