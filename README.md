# Carzino Autos - Next.js + Builder.io

A modern vehicle inventory website built with Next.js, Builder.io, and integrated with WooCommerce for live vehicle data.

## 🚀 Features

- **Builder.io Integration**: Content management and visual editing
- **Live Vehicle Data**: Direct integration with WooCommerce custom API
- **Advanced Filtering**: Filter by make, model, condition, price, and more
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Performance Optimized**: Next.js with API routes and React Query
- **Vercel Deployment**: Production-ready deployment configuration

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **CMS**: Builder.io for content management
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Query for API state
- **API Integration**: WooCommerce custom endpoints
- **Deployment**: Vercel

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Builder.io account and API key
- WooCommerce site with custom API endpoints

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carzino-autos-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```bash
   # Builder.io Configuration
   BUILDER_PUBLIC_KEY=your_builder_io_public_key
   NEXT_PUBLIC_BUILDER_API_KEY=your_builder_io_public_key

   # WordPress/WooCommerce API
   VITE_WP_URL=https://env-uploadbackup62225-czdev.kinsta.cloud
   NEXT_PUBLIC_WP_URL=https://env-uploadbackup62225-czdev.kinsta.cloud
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── vehicles/      # Vehicle data endpoints
│   │   └── filters/       # Filter options endpoints
│   ├── vehicles/          # Vehicle listing page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page with Builder.io
├── components/            # React components
│   ├── builder/           # Builder.io specific components
│   ├── vehicles/          # Vehicle-related components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── api/               # API service layer
│   ├── builder.ts         # Builder.io configuration
│   └── env.ts             # Environment configuration
└── vercel.json            # Vercel deployment config
```

## 🔌 API Integration

### WooCommerce Endpoints

The app connects to these WooCommerce API endpoints:

- **Vehicles**: `/wp-json/custom/v1/vehicles`
  - Pagination, filtering, and sorting
  - Live vehicle inventory data

- **Filters**: `/wp-json/custom/v1/filters`
  - Dynamic filter options based on available inventory
  - Conditional filtering support

### API Routes

- `GET /api/vehicles` - Fetch vehicles with filters and pagination
- `GET /api/filters` - Fetch available filter options

## 🎨 Builder.io Integration

### Custom Components

The following components are registered with Builder.io:

- `VehicleCard` - Individual vehicle display
- `FilterSection` - Filter controls
- `VehiclesGrid` - Vehicle listing grid
- `VehicleSearch` - Search functionality

### Content Management

1. **Create Builder.io account** at [builder.io](https://builder.io)
2. **Add your domain** to Builder.io settings
3. **Create page content** using the visual editor
4. **Deploy changes** are automatically reflected

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `BUILDER_PUBLIC_KEY`
   - `NEXT_PUBLIC_BUILDER_API_KEY`
   - `VITE_WP_URL`
   - `NEXT_PUBLIC_WP_URL`

### Environment Variables

#### Required
- `BUILDER_PUBLIC_KEY` - Builder.io public API key
- `VITE_WP_URL` - WordPress/WooCommerce site URL

#### Optional
- `WC_CONSUMER_KEY` - WooCommerce consumer key (if using WC REST API)
- `WC_CONSUMER_SECRET` - WooCommerce consumer secret (if using WC REST API)

## 📱 Usage

### For Content Editors

1. **Edit Content**: Use Builder.io visual editor
2. **Preview Changes**: See live preview before publishing
3. **Publish**: Deploy changes instantly

### For Developers

1. **Add Components**: Register new components in `components/builder/`
2. **API Integration**: Extend API routes in `app/api/`
3. **Styling**: Use Tailwind CSS classes

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Key Features

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety
- **API Caching**: React Query for efficient data fetching
- **Responsive**: Mobile-first design
- **SEO Optimized**: Next.js built-in optimizations

## 🐛 Troubleshooting

### Common Issues

1. **Builder.io not loading**
   - Check `BUILDER_PUBLIC_KEY` environment variable
   - Verify domain is added to Builder.io

2. **Vehicle data not loading**
   - Check `VITE_WP_URL` environment variable
   - Verify WooCommerce API endpoints are accessible

3. **Build errors**
   - Run `npm run type-check` to check TypeScript errors
   - Check all environment variables are set

### API Testing

Test the API endpoints directly:

```bash
# Test vehicles endpoint
curl https://your-vercel-app.vercel.app/api/vehicles

# Test filters endpoint  
curl https://your-vercel-app.vercel.app/api/filters
```

## 📄 License

This project is proprietary software for Carzino Autos.

## 🤝 Support

For technical support or questions:
- Check the troubleshooting section above
- Review the API integration documentation
- Contact the development team

---

**Built with ❤️ for Carzino Autos**
