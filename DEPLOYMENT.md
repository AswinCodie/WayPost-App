# Deploy Waypost: Vercel + Render

This deployment uses Vercel for the React app and Render for the temporary JSON Server API.

## 1. Push the project to GitHub

Commit `package.json`, `package-lock.json`, `db.json`, `render.yaml`, and `vercel.json`. Do not commit `.env`.

## 2. Deploy the API on Render

1. In Render, choose **New → Blueprint** and select the GitHub repository.
2. Render reads `render.yaml` and creates `waypost-json-api`.
3. Deploy it, then copy its public URL, for example `https://waypost-json-api.onrender.com`.
4. Confirm that `https://YOUR-RENDER-URL/accounts` returns `[]` before any accounts are created.

The attached disk stores `/var/data/db.json`, so API writes survive restarts and redeploys. Do not delete that disk if you want to retain test accounts and data.

## 3. Deploy the frontend on Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Framework preset: **Vite**.
3. Build command: `npm run build`; output directory: `dist`.
4. Add an environment variable for Production, Preview, and Development:

   ```
   VITE_API_URL=https://YOUR-RENDER-URL.onrender.com
   ```

5. Deploy. The included `vercel.json` ensures direct visits to routes such as `/profile` work.

## 4. Test

1. Create an account on the Vercel URL.
2. Sign out and sign in again from another phone or browser using the same credentials.
3. Confirm the account exists at the Render API and that the browser has no dependency on the development-machine IP address.

## Important limitation

JSON Server is a temporary prototype backend. Its API has no production-grade authentication or authorization. Do not store sensitive or real-user data in it. Before a public launch, replace it with Supabase Auth/database or a server-side API with proper authentication.
