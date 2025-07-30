# 🛍️ SAPT Markets Admin Dashboard

A modern React-based admin dashboard for SAPT Markets e-commerce platform.

## 🚀 Live Demo

**Admin Dashboard**: [Deployed on Vercel](https://your-admin-app.vercel.app)

## 📋 Features

- **📊 Dashboard Analytics** - Sales, orders, and revenue insights
- **🛍️ Product Management** - Add, edit, and manage products
- **📂 Category Management** - Organize products by categories
- **📦 Order Management** - Process and track customer orders
- **👥 Customer Management** - View and manage customer data
- **💰 Sales Reports** - Comprehensive sales analytics
- **⚙️ Settings** - Configure store settings and preferences
- **🌐 Multi-language** - English and Arabic support
- **📱 Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Charts**: Chart.js + React Chart.js 2
- **Icons**: React Icons
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Internationalization**: i18next

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/saptmarkets/e-commerce_admin.git

# Navigate to project directory
cd e-commerce_admin

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_APP_API_BASE_URL=https://e-commerce-backend-l0s0.onrender.com/api
VITE_APP_API_SOCKET_URL=https://e-commerce-backend-l0s0.onrender.com

# App Configuration
VITE_APP_NAME=SAPT Markets Admin
VITE_APP_VERSION=1.0.0

# Cloudinary Configuration (Optional)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
```

## 📦 Build for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**: Import this repository to Vercel
2. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Set Environment Variables**:
   - `VITE_APP_API_BASE_URL`: `https://e-commerce-backend-l0s0.onrender.com/api`
   - `VITE_APP_API_SOCKET_URL`: `https://e-commerce-backend-l0s0.onrender.com`
4. **Deploy**: Click deploy and wait for build completion

### Other Platforms

- **Netlify**: Similar to Vercel setup
- **GitHub Pages**: Requires additional configuration
- **AWS S3 + CloudFront**: For advanced users

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components
│   ├── dashboard/      # Dashboard components
│   ├── product/        # Product management
│   └── ...
├── pages/              # Page components
├── services/           # API services
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── utils/              # Utility functions
├── assets/             # Static assets
└── styles/             # Global styles
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for styling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Regular License.

## 🆘 Support

For support, email support@saptmarkets.com or create an issue in this repository.

## 🔗 Related Links

- **Backend API**: [https://e-commerce-backend-l0s0.onrender.com](https://e-commerce-backend-l0s0.onrender.com)
- **Customer Store**: [https://your-customer-app.vercel.app](https://your-customer-app.vercel.app)
- **Documentation**: [Link to documentation]

---

**Built with ❤️ by SAPT Markets Team**