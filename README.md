# Bookbuster Backend

Backend API for the Bookbuster library management system built with Node.js, Express.js, Firebase Firestore, and JWT authentication.

## Features

- 🔐 JWT Authentication with role-based access control (Admin, Bibliotecario, Socio)
- 📚 Complete CRUD operations for Books, Copies, Users, and Penalties
- 🔥 Firebase Firestore for database
- 🛡️ Admin-only protected routes
- ✅ Input validation with express-validator
- 🚀 RESTful API design
- 📝 Comprehensive error handling

## Prerequisites

- Node.js (v18 or higher)
- Firebase project with Firestore enabled
- Firebase service account credentials

## Installation

### 1. Clone or download the project

\`\`\`bash
mkdir bookbuster-backend
cd bookbuster-backend
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

This will install:
- express
- firebase-admin
- jsonwebtoken
- bcryptjs
- dotenv
- cors
- express-validator
- nodemon (dev dependency)

### 3. Firebase Setup

#### Get your Firebase service account key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as `firebase-service-account.json` in the root directory of this project

#### Enable Firestore:

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in production mode** (we'll set up security rules later)
4. Select your preferred location

### 4. Environment Configuration

Create a `.env` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit the `.env` file with your configuration:

\`\`\`env
PORT=5000
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
\`\`\`

**Important:** Change the `JWT_SECRET` to a strong, random string in production!

### 5. Start the server

Development mode (with auto-reload):
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm start
\`\`\`

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |

### Users (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Books

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/books` | Get all books | No |
| GET | `/api/books/:id` | Get book by ID | No |
| POST | `/api/books` | Create new book | Admin |
| PUT | `/api/books/:id` | Update book | Admin |
| DELETE | `/api/books/:id` | Delete book | Admin |

### Copies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/copies` | Get all copies | No |
| GET | `/api/copies?libro_id=xxx` | Get copies by book | No |
| GET | `/api/copies/:id` | Get copy by ID | No |
| POST | `/api/copies` | Create new copy | Admin |
| PUT | `/api/copies/:id` | Update copy | Admin |
| DELETE | `/api/copies/:id` | Delete copy | Admin |

### Penalties (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/penalties` | Get all penalties | Admin |
| GET | `/api/penalties?socio_id=xxx` | Get penalties by socio | Admin |
| GET | `/api/penalties/:id` | Get penalty by ID | Admin |
| POST | `/api/penalties` | Create new penalty | Admin |
| PUT | `/api/penalties/:id` | Update penalty | Admin |
| DELETE | `/api/penalties/:id` | Delete penalty | Admin |

### Editorials

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/editorials` | Get all editorials | No |
| POST | `/api/editorials` | Create new editorial | Admin |

## Authentication

### Register/Login

**Register:**
\`\`\`bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nombre": "John Doe"
}
\`\`\`

**Login:**
\`\`\`bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "nombre": "John Doe",
    "rol": "SOCIO"
  }
}
\`\`\`

### Using the Token

Include the JWT token in the Authorization header for protected routes:

\`\`\`bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## Creating the First Admin User

Since only admins can create users, you need to create the first admin manually:

### Option 1: Using the register endpoint and manually updating Firestore

1. Register a user normally:
\`\`\`bash
POST /api/auth/register
{
  "email": "admin@bookbuster.com",
  "password": "admin123",
  "nombre": "Admin User"
}
\`\`\`

2. Go to Firebase Console → Firestore Database
3. Find the `usuarios` collection
4. Locate your user document
5. Edit the `rol` field and change it from `SOCIO` to `ADMIN`

### Option 2: Using Firebase Console directly

1. Go to Firebase Console → Firestore Database
2. Create a new document in the `usuarios` collection
3. Add fields:
   - `email`: "admin@bookbuster.com"
   - `password`: (use bcrypt to hash "admin123" - you can use an online tool)
   - `nombre`: "Admin User"
   - `rol`: "ADMIN"
   - `activo`: true
   - `creado_en`: (current timestamp)

## Example Requests

### Create a Book (Admin only)

\`\`\`bash
POST /api/books
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "titulo": "The Great Gatsby",
  "descripcion": "A classic American novel",
  "idioma": "English",
  "portada_url": "https://example.com/cover.jpg",
  "fecha_publicacion": "1925-04-10",
  "autores": [
    { "nombre": "F. Scott Fitzgerald" }
  ],
  "generos": [
    { "nombre": "Fiction" },
    { "nombre": "Classic" }
  ]
}
\`\`\`

### Create a Copy (Admin only)

First, create an editorial:
\`\`\`bash
POST /api/editorials
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "nombre": "Scribner"
}
\`\`\`

Then create a copy:
\`\`\`bash
POST /api/copies
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "libro_id": "book_id_from_previous_step",
  "editorial_id": "editorial_id_from_previous_step",
  "isbn": "978-0-7432-7356-5",
  "edicion": "1st Edition",
  "formato": "PDF",
  "url_archivo": "https://example.com/book.pdf"
}
\`\`\`

## Project Structure

\`\`\`
bookbuster-backend/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase initialization
│   │   └── constants.js         # Enums and constants
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User CRUD
│   │   ├── bookController.js    # Book CRUD
│   │   ├── copyController.js    # Copy CRUD
│   │   ├── penaltyController.js # Penalty CRUD
│   │   └── editorialController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validation.js        # Input validation
│   │   └── errorHandler.js      # Error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── copyRoutes.js
│   │   ├── penaltyRoutes.js
│   │   └── editorialRoutes.js
│   └── server.js                # Express app setup
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── firebase-service-account.json # Firebase credentials (DO NOT COMMIT)
├── package.json
└── README.md
\`\`\`

## Security Notes

- **Never commit** `firebase-service-account.json` or `.env` to version control
- Add them to `.gitignore`:
  \`\`\`
  .env
  firebase-service-account.json
  node_modules/
  \`\`\`
- Use strong JWT secrets in production
- Implement rate limiting for production (consider using `express-rate-limit`)
- Set up proper CORS origins for production

## Firestore Collections Structure

The API uses the following Firestore collections:

- `usuarios` - User accounts
- `socios` - Member profiles (linked to usuarios)
- `libros` - Books catalog
  - Subcollections: `autores`, `generos`
- `editoriales` - Publishers
- `copias` - Book copies (digital files)
- `prestamos` - Loans
- `multas` - Penalties
- `solicitudes_registro` - Registration requests
- `notificaciones` - Notifications

## Troubleshooting

### Firebase connection issues
- Verify your `firebase-service-account.json` path is correct
- Ensure Firestore is enabled in your Firebase project
- Check that your service account has proper permissions

### JWT token errors
- Verify the JWT_SECRET is set in `.env`
- Check token expiration time
- Ensure the Authorization header format is correct: `Bearer <token>`

### CORS errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the server after changing environment variables

## License

ISC
