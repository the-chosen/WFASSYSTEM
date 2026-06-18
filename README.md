# Wichi Farms And Agro Solutions — WICHI System

Business management system for Wichi Farms And Agro Solutions (Malawi): quotation/document builder with multi-type conversion, inventory catalogue, sales leads CRM, and full multi-user auth with approval workflows.

## 🌐 Cloud Database & Multi-Device Access

This system now supports cloud databases for data persistence and multi-device access. Your data is stored in the cloud and accessible from any device with internet access.

### Supported Cloud Database Providers

- **Supabase** - Free PostgreSQL with built-in auth and storage
- **Neon** - Serverless PostgreSQL with auto-scaling
- **Railway** - Full-stack deployment with managed databases
- **Render** - Simple deployment with managed PostgreSQL
- **PlanetScale** - MySQL-compatible (requires schema adjustments)
- **AWS RDS** - Enterprise PostgreSQL
- **Google Cloud SQL** - Managed PostgreSQL
- **Azure Database** - Managed PostgreSQL

## 🚀 Quick Start

### Option 1: Local Development with SQLite (No setup required)

```bash
# Install dependencies
pnpm install

# Run API server (uses SQLite by default)
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/wichi-quotation run dev
```

### Option 2: Docker with PostgreSQL

```bash
# Start PostgreSQL and API server
docker-compose up -d

# Access the application
# Frontend: http://localhost:8080
# API: http://localhost:5000
```

### Option 3: Cloud Database Setup

1. **Choose a cloud provider** and create a PostgreSQL database
2. **Get your connection string** (DATABASE_URL)
3. **Create a `.env` file**:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key
PORT=5000
```

4. **Run database migrations**:

```bash
pnpm --filter @workspace/db run push
```

5. **Start the application**:

```bash
pnpm --filter @workspace/api-server run dev
```

## 📦 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set `DATABASE_URL` and `SESSION_SECRET` in Vercel environment variables.

### Deploy to Render

1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` configuration
3. Set environment variables in Render dashboard

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy to Any Platform

1. Build the project: `pnpm run build`
2. Set `DATABASE_URL` environment variable
3. Run: `pnpm --filter @workspace/api-server run start`

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | Uses SQLite if not set |
| `SESSION_SECRET` | No | Session encryption secret | `wichi-farms-secret-change-in-prod` |
| `PORT` | No | API server port | `5000` |

### Database Schema

The system uses Drizzle ORM with PostgreSQL. Schema files are in `lib/db/src/schema/`:

- `users.ts` - User accounts and authentication
- `quotations.ts` - Documents (quotations, invoices, receipts, etc.)
- `inventory.ts` - Product catalogue
- `leads.ts` - Sales leads CRM

## 🛠️ Development

```bash
# Typecheck
pnpm run typecheck

# Build all packages
pnpm run build

# Push database schema changes
pnpm --filter @workspace/db run push

# Regenerate API from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

## 📁 Project Structure

```
├── lib/
│   ├── db/              # Database layer (Drizzle ORM)
│   ├── api-spec/        # OpenAPI specification
│   ├── api-zod/         # Generated Zod schemas
│   └── api-client-react/ # Generated React hooks
├── artifacts/
│   ├── api-server/      # Express API server
│   ├── wichi-quotation/ # React frontend
│   └── mockup-sandbox/  # Design sandbox
├── scripts/             # Utility scripts
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
├── vercel.json          # Vercel deployment
├── render.yaml          # Render deployment
└── railway.json         # Railway deployment
```

## 🔐 Default Credentials

- Username: `admin`
- Password: `admin123`
- Role: `super_admin`

**Important**: Change the default password after first login via the Profile page.

## 🌍 Multi-Device Access

Once deployed with a cloud database:

1. **Access from anywhere**: Your data is stored in the cloud
2. **Multiple users**: Each user has their own account and permissions
3. **Real-time sync**: All devices see the same data
4. **Mobile-friendly**: Responsive design works on all devices

## 📊 Features

- **Document Builder** - Create quotations, invoices, receipts, delivery notes, sale orders
- **Approval Workflow** - Submit documents for admin approval
- **PDF Export** - Download approved documents as PDF
- **Inventory Management** - Product catalogue with pricing
- **Leads CRM** - Track sales leads and follow-ups
- **User Management** - Multi-user authentication with role-based access
- **Admin Panel** - Approve/reject documents, manage users

## 🛡️ Security

- Passwords hashed with bcrypt
- Session-based authentication
- Role-based access control (RBAC)
- SQL injection prevention (Drizzle ORM)
- CORS protection
- Session data stored in database

## 📝 License

MIT

## 🤝 Support

For issues or questions, please refer to the project documentation or contact the development team.
