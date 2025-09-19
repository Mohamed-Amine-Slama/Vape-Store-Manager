# Vape Store Manager

A modern web application for managing vape store financial operations with PIN-based authentication, shift tracking, sales management, and comprehensive admin dashboard.

## 🚀 Features

### For Workers
- **PIN Login**: Secure 4-6 digit PIN authentication
- **Shift Management**: Start/end shifts with automatic time tracking
- **Sales Entry**: Product catalog integration with custom product support
- **Real-time Tracking**: Live sales totals and shift duration
- **Payment Types**: Support for cash and card transactions

### For Admins
- **Dashboard Analytics**: Daily, weekly, monthly sales overview
- **Interactive Charts**: Sales trends, worker performance, payment breakdowns
- **Worker Management**: Add, edit, delete workers with role management
- **Product Catalog**: Manage inventory with pricing
- **Data Export**: Excel export for daily reports, monthly summaries, and detailed breakdowns
- **Real-time Monitoring**: Active shift tracking and worker performance

### Additional Features
- **Push Notifications**: Daily sales summary to owner when shifts end
- **Responsive Design**: Works on phones, tablets, and desktops
- **Offline-ready**: Progressive Web App capabilities
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS + Custom Components
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vape-store-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Run the SQL schema from `database/schema.sql` in Supabase SQL editor

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   ⚠️ **Security Note**: Never commit your `.env` file to version control. It contains sensitive credentials.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗃️ Database Schema

### Tables
- **users**: Worker and admin accounts with PIN authentication
- **shifts**: Shift tracking with start/end times
- **sales**: Individual sales records with product and payment info
- **products**: Product catalog with names and prices

### Sample Data
The schema includes sample users and products for testing:
- Admin PIN: `1234`
- Worker PINs: `5678`, `9012`

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. Create tables using `database/schema.sql`
2. Enable Row Level Security (included in schema)
3. Configure authentication policies as needed

## 📱 Usage

### Worker Flow
1. Enter PIN on login screen
2. Start shift when beginning work
3. Add sales using product catalog or custom entries
4. View real-time sales totals and shift duration
5. End shift when done (triggers notification to admin)

### Admin Flow
1. Login with admin PIN
2. View dashboard with sales analytics
3. Manage workers (add/edit/delete)
4. Manage product catalog
5. Export reports for accounting
6. Monitor active workers and shifts

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

### Manual Deployment
```bash
npm run build
# Upload dist folder to your hosting service
```

## 🔔 Push Notifications

The app includes optional push notification functionality that sends daily sales summaries to admins when workers end their shifts. To implement:

1. **Email Integration**: Use services like EmailJS or Supabase Edge Functions
2. **Browser Notifications**: Implement Web Push API
3. **SMS Integration**: Use services like Twilio

Example notification trigger is in `src/pages/Worker.jsx` in the `sendShiftEndNotification` function.

## 📊 Analytics Features

### Summary Cards
- Today's total sales
- Weekly sales totals
- Monthly sales totals
- Top performing worker

### Charts
- **Line Chart**: Daily sales trends
- **Bar Chart**: Worker performance comparison
- **Pie Chart**: Payment method breakdown

### Data Export
- Sales reports with worker, product, and timing data
- Shift reports with duration and performance metrics
- CSV format for easy import into accounting software

## 🛡️ Security

- PIN-based authentication for simplicity
- Row Level Security (RLS) enabled on all tables
- Input validation and sanitization
- Secure environment variable handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🔄 Future Enhancements

- [ ] Inventory management
- [ ] Customer management
- [ ] Receipt printing
- [ ] Multi-store support
- [ ] Advanced reporting
- [ ] Mobile app versions
- [ ] Barcode scanning
- [ ] Tax calculations

---

Built with ❤️ for vape store owners who want better business insights.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
