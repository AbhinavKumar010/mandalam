# Chalchitra

Chalchitra is a photo-sharing app with registration, a post feed, likes, comments, saved posts, Explore search, profiles, and real-time direct messages.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB running locally, or a MongoDB connection URI

Cloudinary is optional for local development. Without Cloudinary credentials, uploaded images are stored in `backend/uploads/`.

## Run Locally

1. Install backend dependencies with `cd backend && npm install`.
2. Optionally copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`. The default is `mongodb://127.0.0.1:27017/chalchitra`.
3. Start the API with `npm run dev` from `backend/`.
4. In another terminal, install frontend dependencies with `cd UI && npm install`.
5. Optionally copy `UI/.env.example` to `UI/.env` and set `VITE_API_URL` if the API is not at `http://localhost:5000/api`.
6. Start the web app with `npm run dev` from `UI/` and open the URL Vite prints.

For production, configure a strong `JWT_SECRET`, `MONGO_URI`, and the Cloudinary credentials in `backend/.env`. Set `VITE_API_URL` to the deployed API's `/api` URL before building the frontend.
"# mandalam" 
