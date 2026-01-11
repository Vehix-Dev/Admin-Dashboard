# Vehix Admin CRM

A comprehensive admin dashboard and CRM system for managing roadside assistance services, built with Next.js 16, React 19, and TypeScript.

![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

### Core Management
- **User Management**: Comprehensive user administration with role-based permissions
- **Rider Management**: Track and manage riders with detailed profiles and activity history
- **Roadie Management**: Manage service providers (roadies) with service tracking and performance metrics
- **Service Requests**: Real-time tracking of service requests with status management
- **Live Map**: Interactive map showing real-time locations of roadies and service requests

### Advanced Features
- **Reports & Analytics**: Detailed analytics dashboard with revenue tracking, service distribution, and trend analysis
- **Wallet Management**: Financial tracking for roadies with transaction history
- **Media Moderation**: Review and moderate user-uploaded images
- **Referral System**: Track and manage user referrals
- **Notifications**: System-wide notification management
- **Support Inbox**: Customer inquiry management system

### Landing Page CMS
- **Dynamic Content Sections**: Create and manage page sections (Hero, Features, Text+Image, Banners)
- **Video Support**: Background videos and in-page video playback
- **Custom Role Cards**: Configurable Rider/Roadie selection cards with custom images and links
- **Theme Customization**: Full color scheme customization
- **SMTP Configuration**: Email settings management

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: SQLite with better-sqlite3
- **File Storage**: Local file system (public/uploads)
- **Real-time**: Socket.io client support

### Development
- **Language**: TypeScript 5
- **Linting**: ESLint
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vehix-admin-crm.git
cd vehix-admin-crm
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Add your environment variables here
```

4. Initialize the database:
```bash
# The database will be automatically initialized on first run
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 📁 Project Structure

```
vehix-admin-crm/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin dashboard pages
│   │   ├── live-map/       # Real-time map view
│   │   ├── moderation/     # Media moderation
│   │   ├── referrals/      # Referral management
│   │   ├── reports/        # Analytics & reports
│   │   ├── requests/       # Service requests
│   │   ├── riders/         # Rider management
│   │   ├── roadies/        # Roadie management
│   │   ├── settings/       # System settings
│   │   ├── support/        # Support inbox
│   │   ├── users/          # User management
│   │   └── wallet/         # Wallet management
│   ├── api/                # API routes
│   │   ├── contact/        # Contact form handler
│   │   ├── inquiries/      # Inquiry management
│   │   ├── settings/       # Settings API
│   │   └── upload/         # File upload handler
│   ├── login/              # Authentication
│   └── page.tsx            # Public landing page
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── admin-sidebar.tsx  # Admin navigation
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── api.ts            # API client functions
│   ├── db.ts             # Database initialization
│   └── utils.ts          # Helper functions
├── public/               # Static assets
│   └── uploads/         # User-uploaded files
└── styles/              # Global styles
```

## 🔐 Security

For security concerns, please review our [SECURITY.md](SECURITY.md) file.

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- `user_permissions`: User access control
- `settings`: System-wide configuration
- `landing_sections`: CMS content sections
- `inquiries`: Customer support messages

## 🎨 Customization

### Theme Colors
Navigate to **Admin → Settings → Landing Page → Design & Theme** to customize:
- Primary color
- Secondary color
- Background color
- Hero images and videos

### Landing Page Content
Use the CMS at **Admin → Settings → Landing Page** to:
- Add/edit content sections
- Configure role selection cards
- Upload media files
- Manage SMTP settings

## 📊 Key Features Breakdown

### Reports Center
- Real revenue tracking from service fees
- Daily request trends
- Service type distribution
- Status breakdown analytics
- CSV export functionality

### Live Map
- Real-time roadie locations
- Service request markers
- Interactive clustering
- Dark/light mode support

### Media Moderation
- Grouped by user
- Bulk approval/rejection
- Filter by status
- Image preview

### Roadie Management
- Performance metrics
- Service history
- Wallet integration
- Online status tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons by [Lucide](https://lucide.dev/)
- Maps powered by [Leaflet](https://leafletjs.com/)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for Vehix
