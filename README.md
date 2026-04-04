# ContentAI Studio

A lightweight React + Vite app with a backend proxy to Google Generative Language API.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your API keys:

   ```bash
   cp .env.example .env
   ```

3. Update `.env`:

   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
   ```

## Run locally

```bash
npm run dev
```

Then open `http://localhost:4173`.

## Build for production

```bash
npm run build
npm start
```

## Admin account

- Email: `admin@contentai.com`
- Password: `Admin@123`

## Notes

- `.env` is ignored by `.gitignore`.
- The backend proxy keeps the Gemini API key off the client.
- This app uses localStorage for demo user data and credits.
