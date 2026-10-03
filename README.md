# Cricket Arena

Cricket Arena is a modern cricket ground discovery and booking platform for players who want to find venues, compare availability, and book slots online.

## Initial architecture

### Frontend
- Next.js app router
- React + TypeScript
- Tailwind CSS

### Backend
- Next.js API routes
- MongoDB Atlas with Mongoose
- Secure auth and role-based access

### Core product domains
- Authentication
- Venue discovery
- Booking lifecycle
- Owner management
- Admin moderation
- AI assistant

## Proposed folder structure

```text
app/
components/
lib/
models/
services/
types/
utils/
public/
.env.example
.gitignore
```

## Development phases

1. Scaffold project and baseline UI
2. Database models and environment config
3. Authentication and protected routes
4. Venue discovery and filtering
5. Slot management and booking flow
6. Owner dashboard and venue management
7. Admin moderation and approvals
8. AI assistant integration
9. Production validation and deployment prep

## Local development

```bash
npm install
npm run dev
```

## Development password recovery

There is no email-based password reset configured. To reset the password for the existing `ablai.110027@gmail.com` account locally, make sure `.env.local` points to the intended development database, then run this in PowerShell:

```powershell
$env:NODE_ENV = 'development'
npm.cmd run reset:password
```

The script refuses to run outside development mode, requires you to confirm the exact account email, prompts for the new password without displaying it, and updates only that account's password hash. It uses bcrypt cost 12 and verifies the persisted hash using the same bcrypt comparison as login. The account and its role/data are not recreated or changed. Sign in normally at `/login` afterward. Do not use your email account password.
