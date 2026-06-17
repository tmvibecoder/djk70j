This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment

Auto-Deploy via GitHub Actions (`.github/workflows/deploy.yml`): Push auf `main` -> SSH (Key-basiert) zum Server **web01** -> `git pull` + `npm install` + `npm run build` + `pm2 restart djk-ottenhofen-event`.

- Next.js-App, laeuft unter pm2 als `djk-ottenhofen-event` auf **Port 3010** (nginx proxyt dorthin). Server-Pfad `/var/www/djk-ottenhofen-event/app`.
- Genutzte Secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY` (gemeinsamer Deploy-Key auf web01). Obsolete Secrets `SSH_HOST`/`SSH_USER`/`SSH_PASSWORD` wurden geloescht.
- Der alte systemd-Dienst `djk-fest.service` (Port 3000) ist verwaist und wurde gestoppt + disabled (frueheres `sshpass`/`systemctl`-Deploy schlug seit April fehl).
- Stolperfalle: `nginx sites-available/djk-ottenhofen-event` ist eine veraltete Kopie mit Port 3000; aktiv (sites-enabled) ist Port 3010.
- Doku-Commits, die NICHT deployen sollen, mit `[skip ci]` versehen.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
