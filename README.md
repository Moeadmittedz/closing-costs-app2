# Exilex Closing Costs Calculator (Ready to Deploy)

This project is a Next.js app (dark mode) that estimates closing costs and emails a PDF summary to the user and CCs info@exilex.com.

## Quick steps to deploy (non-technical)

1. Unzip the project folder.
2. Create a GitHub repository and upload the unzipped files (use GitHub web UI).
3. Create a Vercel account and import the GitHub repository to deploy.
4. In Vercel, add an environment variable `SENDGRID_API_KEY` with your SendGrid API Key.
5. Deploy — Vercel will build and publish the site.

## Local testing (optional)
Requires Node.js installed.

```bash
npm install
# create a file named .env.local with SENDGRID_API_KEY=your_key
npm run dev
# open http://localhost:3000
```