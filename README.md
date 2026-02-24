# Audience Checker

A full-stack application for checking SQL query alignment with business rules using a modern web interface. Built with Next.js (frontend) and Express.js + TypeScript (backend).

## Project Overview

- **Frontend**: Next.js web application with MUI and Ant Design components
- **Backend**: Express.js API with TypeScript and Drizzle ORM
- **Database**: MySQL

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **MySQL** (v5.7 or higher)
- **Git**

## Project Structure

```
audience-checker/
├── frontend/           # Next.js web application
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── public/        # Static assets
│   └── package.json
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── server.ts  # Main server file
│   │   └── ...
│   ├── scripts/       # Database scripts
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd audience-checker
```

### 2. Setup Backend

#### 2.1 Install Dependencies

```bash
cd backend
npm install
```

#### 2.2 Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=audience_checker

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### 2.3 Setup Database

Make sure MySQL is running, then run migrations:

```bash
npm run db:push
```

Or if you need to generate migrations:

```bash
npm run db:generate
npm run db:migrate
```

#### 2.4 Seed Database (Optional)

To populate the database with initial data:

```bash
npm run seed
```

### 3. Setup Frontend

#### 3.1 Install Dependencies

```bash
cd ../frontend
npm install
```

#### 3.2 Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running the Application

### Start Backend Server

From the `backend` directory:

```bash
npm run dev
```

The backend API will be running on `http://localhost:5000`

### Start Frontend Development Server

From the `frontend` directory (in a new terminal):

```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

### Building for Production

#### Build Backend

```bash
cd backend
npm run build
npm start
```

#### Build Frontend

```bash
cd frontend
npm run build
npm start
```

## Available Scripts

### Backend Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot reload |
| `npm run build`       | Build TypeScript to JavaScript           |
| `npm start`           | Start production server                  |
| `npm run lint`        | Run ESLint                               |
| `npm run type-check`  | Check TypeScript types                   |
| `npm run seed`        | Seed database with initial data          |
| `npm run db:generate` | Generate database migrations             |
| `npm run db:migrate`  | Run database migrations                  |
| `npm run db:push`     | Push schema to database                  |
| `npm run db:studio`   | Open Drizzle Studio                      |

### Frontend Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |

## Technology Stack

### Frontend

- **Framework**: Next.js
- **UI Libraries**: Material-UI (MUI), Ant Design
- **Styling**: Tailwind CSS, Emotion
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Database Driver**: mysql2

## API Endpoints

The backend API provides endpoints for:

- Audience management
- Query validation
- Business rule checking
- Campaign configuration

For detailed API documentation, check the backend source code or API documentation files.

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

```bash
# Frontend (change port)
npm run dev -- -p 3001

# Backend (update PORT in .env)
PORT=5001 npm run dev
```

### Database Connection Error

1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure the database exists:
   ```bash
   mysql -u root -p
   CREATE DATABASE audience_checker;
   ```

### Dependencies Installation Issues

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. Create a new branch for your feature
2. Make changes in frontend/backend directories
3. Test locally with `npm run dev`
4. Build and verify with `npm run build`
5. Commit changes with clear messages
6. Push to repository and create a pull request

## Environment Variables Reference

### Backend (.env)

| Variable      | Description           | Example                 |
| ------------- | --------------------- | ----------------------- |
| `PORT`        | API server port       | `5000`                  |
| `NODE_ENV`    | Environment mode      | `development`           |
| `DB_HOST`     | Database host         | `localhost`             |
| `DB_PORT`     | Database port         | `3306`                  |
| `DB_USER`     | Database user         | `root`                  |
| `DB_PASSWORD` | Database password     | `password`              |
| `DB_NAME`     | Database name         | `audience_checker`      |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend (.env.local)

| Variable              | Description     | Example                 |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |

## Performance Tips

- Use `npm ci` instead of `npm install` in production for deterministic builds
- Enable caching in CI/CD pipelines
- Use database indexes for frequently queried columns
- Consider implementing pagination for large result sets

## Support

For issues and questions:

1. Check the project documentation
2. Review existing GitHub issues
3. Create a new issue with detailed information

## License

ISC
