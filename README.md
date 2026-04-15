# OpTrack AI Server

Backend service for OpTrack AI - Personalized Opportunity Intelligence Engine.

## Prerequisites

- Node.js v18+
- MongoDB (running on localhost:27017)
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Configure MongoDB connection in `.env`:

```
MONGODB_URI=mongodb://localhost:27017/optrack-ai
PORT=5000
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Production

Run the compiled server:

```bash
npm start
```

## API Endpoints

### Users

- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Opportunities

- `GET /api/opportunities` - Get all opportunities
- `GET /api/opportunities/:id` - Get opportunity by ID
- `GET /api/opportunities/feed/:userId` - Get personalized feed for user
- `POST /api/opportunities` - Create new opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity

### Health Check

- `GET /health` - API health status

## Project Structure

```
backend/
├── src/
│   ├── config/        # Database configuration
│   ├── controllers/   # Route handlers
│   ├── models/        # Database schemas
│   ├── routes/        # API routes
│   ├── services/      # Business logic (recommendation engine)
│   ├── app.ts        # Express app setup
│   └── server.ts     # Server entry point
├── dist/             # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env.example
```

## Sample API Usage

### Create a User

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["JavaScript", "React", "MongoDB"],
    "preferredTypes": ["internship", "hackathon"],
    "location": "Remote",
    "experienceLevel": "intermediate"
  }'
```

### Create an Opportunity

```bash
curl -X POST http://localhost:5000/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "React Intern",
    "company": "TechCorp",
    "skills": ["JavaScript", "React"],
    "location": "Remote",
    "type": "internship",
    "deadline": "2024-12-31",
    "source": "LinkedIn",
    "link": "https://example.com"
  }'
```

### Get Personalized Feed

```bash
curl http://localhost:5000/api/opportunities/feed/{userId}
```

## Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Scheduling**: node-cron (for scrapers)
- **Validation**: Mongoose schema validation

## License

ISC
