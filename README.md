# Frontend Code

React dashboard UI for the AI-Based Employee Performance Analytics system.

## Tech Stack

- React
- Vite
- Axios
- Lucide React icons
- CSS responsive dashboard layout

## Folder Structure

```text
frontend/
  index.html
  package.json
  vite.config.js
  .env.example
  src/
    main.jsx
    App.jsx
    styles.css
    services/
      api.js
```

## Setup

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install and run only the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## UI Pages and Components

The React app includes:

- Login and signup screen
- Employee registration form
- Employee list page
- Search and filter section
- Performance analytics cards
- Employee ranking panel
- AI recommendation display page
- Edit and delete employee actions
- Responsive professional dashboard UI

## API Integration

All frontend API requests are handled in:

```text
src/services/api.js
```

The auth token is stored in browser local storage and attached to protected API requests as:

```text
Authorization: Bearer <token>
```
