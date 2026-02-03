# Overview

This is a comprehensive IT Management System (Sistema de Gestão de T.I.) built with React (TypeScript) frontend and Node.js/Express backend. The system manages IT assets, helpdesk tickets, projects, software licenses, and knowledge base with features including user permissions, real-time notifications via WebSocket, reporting/export capabilities (PDF/Excel/CSV), QR code generation for assets, and audit logging.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (February 2026)

- Project imported from GitHub and configured for Replit environment
- PostgreSQL database created via Replit's built-in database tool (using environment variables: DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
- All dependencies installed (frontend and backend)
- Workflow configured to run frontend (port 5000) and backend (port 3000) simultaneously using concurrently
- Vite configured with allowedHosts: true for Replit proxy compatibility
- Deployment configured for autoscale with build step
- **Automatic project progress calculation**: Progress now calculated automatically based on task completion (completed tasks / total tasks * 100). Status updates automatically: 0% = "planejamento", 1-99% = "em_andamento", 100% = "concluído"
- **Knowledge Base view modal**: Clicking on article cards now opens a view modal showing full content, metadata (views, likes, author), and tags. Edit button available in the modal
- **Delete options verified**: All modules (Ativos, Conhecimento, Projetos, Licencas, Usuarios, Tickets, Inventario, Rede, Setores) have full edit and delete capabilities for admin users
- **Estoque/Localizações delete buttons**: Added delete (trash) icons to Estoque/Componentes cards and Localizações table rows
- **Knowledge Base file attachments**: Articles now support PDF, PNG, and JPEG attachments (max 10MB each). Files are stored in uploads/conhecimento/ directory
- **Permission-based edit/delete visibility**: In Knowledge Base, edit/delete buttons only appear for admin users or the article author
- **Máquinas na Rede module**: New module for manually managing network machines. Users can create, edit, and delete machines with: name, IP address, sector, responsible user, operating system, and attached components (processor, RAM, HD/SSD, etc.)

# Default Login Credentials

- **Email:** admin@itmanager.com
- **Password:** admin123

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool

**UI/Styling**: 
- TailwindCSS for styling with custom theme configuration supporting light/dark modes
- Custom design system with predefined color schemes (primary, secondary, success, warning, danger)
- Responsive design with mobile-first approach
- Component-based architecture with reusable UI components (Modal, Input, Alert, KPICard, etc.)

**State Management**:
- Context API for global state (AuthContext for authentication, ThemeContext for dark/light mode)
- Local component state using React hooks
- No external state management library (Redux/MobX) - chose simplicity over complexity

**Routing**: 
- React Router v6 with lazy loading for code splitting
- Protected routes using PrivateRoute wrapper component
- Suspense boundaries for loading states

**Key Design Patterns**:
- Higher-Order Components for route protection
- Custom hooks for reusable logic (usePermissions for role-based access)
- Component composition for flexibility
- Lazy loading to optimize initial bundle size

## Backend Architecture

**Framework**: Express.js 5.x with ES modules

**API Design**:
- RESTful API architecture
- Modular route structure organized by feature (auth, usuarios, ativos, tickets, etc.)
- Middleware pattern for authentication and error handling
- File upload support via Multer

**Database Layer**:
- PostgreSQL as the primary database
- Direct SQL queries using pg library (no ORM)
- Connection pooling for performance
- Database initialization scripts with proper schema creation order

**Real-time Features**:
- Socket.io for WebSocket communication
- Real-time notifications system
- User-specific notification channels via room-based communication

**Security**:
- JWT-based authentication with bcrypt password hashing
- Token verification middleware
- Role-based access control (admin, tecnico, usuario levels)
- Granular module-level permissions (create, read, update, delete per module)

**Key Architectural Decisions**:
- Chose direct SQL over ORM for better control and performance
- ES modules for modern JavaScript features
- Separated concerns with dedicated route files per feature
- Single database pool shared across the application

## Data Storage

**Primary Database**: PostgreSQL 12+

**Schema Structure**:
- Users table with role-based permissions
- Assets management (categorias_ativos, ativos, fornecedores, localizacoes)
- Ticket system (tickets, tickets_historico)
- Project management (projetos, tarefas_projeto)
- License tracking (licencas)
- Knowledge base (base_conhecimento)
- Audit logging (logs_auditoria)
- Notifications (notificacoes)
- User permissions (permissoes_usuarios)
- SLA configurations (configuracoes_sla)
- QR codes for assets (qrcodes_ativos)

**Data Seeding**:
- Automated seeding scripts for initial setup (admin user, categories, departments)
- Sample data generation for development/testing
- Migration system for database schema updates

**File Storage**: 
- Local filesystem for uploaded files (via Multer)
- Files organized by ticket ID in uploads directory

## External Dependencies

**Database**:
- PostgreSQL 12+ (required for production)
- Connection via environment variable DATABASE_URL

**NPM Packages**:
- **Backend**: bcrypt (password hashing), jsonwebtoken (JWT auth), socket.io (WebSocket), pg (PostgreSQL client), multer (file uploads), cors, express, dotenv
- **Frontend**: react-router-dom (routing), socket.io-client (WebSocket), lucide-react (icons), recharts (charts), date-fns (date formatting), exceljs & jspdf (exports), qrcode.react (QR codes)

**Development Tools**:
- Vite for frontend development and building
- Concurrently for running frontend/backend simultaneously
- TypeScript for type safety
- TailwindCSS for styling

**Third-Party Services**: 
- None currently - system is self-contained
- Designed to run on-premise or any hosting platform
- No cloud service dependencies (AWS, Azure, etc.)

**Environment Configuration**:
Required environment variables:
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret key for JWT token generation
- PORT: Backend server port (default 3000)
- NODE_ENV: Environment (development/production)
- FRONTEND_URL: Frontend URL for CORS
- BACKEND_URL: Backend URL for API calls

**Deployment Considerations**:
- Frontend builds to static files (can be served via any static host)
- Backend requires Node.js 18+ runtime
- PostgreSQL database required (can be hosted separately)
- WebSocket support needed for real-time features
- File system access required for uploads directory