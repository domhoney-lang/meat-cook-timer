# My Roast Pro – Meat Cook Timer

Local server launch commands
npm install
npm run dev

A responsive, precision roasting timer and planner built for UK/EU cooking standards. Calculate exact oven timings, coordinate meal preparation, and receive intelligent chef tips powered by Google Gemini.

## Features

- 🥩 **Comprehensive Meat Database:** Timings for Beef, Pork, Lamb, Chicken, Turkey, and Duck (with specific cuts like Topside, Rib, Shoulder, Crown, etc.).
- 🌡️ **UK FSA Guidelines:** Cooking times and target internal temperatures aligned with UK Food Standards Agency safety recommendations.
- 🕒 **Dynamic Planning Modes:**
  - **Start Now:** Immediate timings starting from the present moment.
  - **Plan Meal:** Input an "Eat At" time to calculate precisely when to remove meat from the fridge, turn the oven on, and start roasting.
- ⚡ **Oven & Weight Adjustments:** Togglable Fan/Conventional oven math (10% fan efficiency reduction) and support for both `kg` and `lbs`.
- 🧠 **AI Chef's Tip:** Context-aware roasting tips, seasoning ideas, and wine pairings powered by `gemini-2.5-flash`.
- 📱 **Mobile-First UX:** Touch-friendly inputs, sticky navigational headers, safe-area padding for notched devices, and dark mode aesthetics.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide React (Icons).
- **Backend (Serverless):** Node.js handler via Vercel Serverless Functions.
- **AI Integration:** `@google/generative-ai` (Gemini API).

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "Meat Cook Timer"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *Note: Because the AI feature relies on a serverless function (`api/generate-tip.js`), local testing of the AI Tip without Vercel CLI will either require deploying or using a local proxy setup.*

## Deployment (Vercel)

This project is optimized for deployment on Vercel.

1. Connect your repository to Vercel.
2. In your Vercel Project Settings, add the `REACT_APP_GEMINI_API_KEY` to your Environment Variables.
3. Deploy! Vercel will automatically detect Vite for the frontend and serve the `/api/generate-tip.js` file as a serverless backend route.

*A `vercel.json` file is included to ensure clean URLs and proper API routing.*

## License

This project is intended for personal/portfolio use. "Honey Precision Roasting &bull; UK FSA Guidelines"
