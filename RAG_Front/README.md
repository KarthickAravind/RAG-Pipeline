# SAP iFlow RAG Lab

A modern, compact React-based UI for testing and evaluating SAP iFlow RAG retrieval systems. This application provides a comprehensive testing interface with advanced analytics, re-ranking visualization, and experiment management.

## 🚀 Features

- **Vector Search**: Run similarity search queries with configurable parameters
- **Hybrid Search**: Combine lexical and semantic approaches with adjustable alpha
- **Re-ranking Analysis**: Visualize before/after ranking with cross-encoder and metadata boosts
- **Compact Design**: Optimized for dense information display with consistent small controls
- **Real-time Testing**: Live search with debounced queries and performance metrics
- **Experiment Management**: Save and load parameter presets for reproducible testing
- **Advanced Analytics**: Score breakdowns, component type distributions, and query logs
- **Responsive Layout**: Works seamlessly across desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom compact design system
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Build Tool**: Vite with hot module replacement

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with ES2020 support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `web` directory:

```env
# API Configuration
VITE_UI_API_BASE=/api

# Feature Flags (optional)
VITE_ENABLE_HYBRID=true
VITE_ENABLE_RERANKING=true
VITE_ENABLE_CHART_CONTROLS=true
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CompactHeaderNav.tsx
│   │   ├── SearchToolbar.tsx
│   │   ├── SideFilters.tsx
│   │   ├── SearchResults.tsx
│   │   └── ScoreBreakdownPanel.tsx
│   ├── pages/              # Main application pages
│   │   ├── SearchPage.tsx
│   │   ├── RerankPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AboutPage.tsx
│   ├── lib/                # Utilities and services
│   │   ├── api.ts          # API client
│   │   ├── store.ts        # Zustand store
│   │   └── utils.ts        # Helper functions
│   ├── types/              # TypeScript type definitions
│   │   └── api.ts          # API contract types
│   ├── styles/             # Global styles and CSS
│   │   └── globals.css     # Tailwind and custom styles
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

## 🎯 Usage Guide

### Search & Retrieval

1. **Basic Search**: Enter your query in the search bar and click Search
2. **Live Search**: Enable "Live" mode for automatic search as you type
3. **Advanced Parameters**:
   - Adjust Top-K results (5, 10, 25, 50)
   - Enable hybrid search with alpha blending
   - Configure re-ranking with custom weight distributions
   - Set sorting preferences

### Filters & Refinement

- **Component Types**: Filter by Groovy, WSDL, XSLT, BPMN, Properties, XML
- **Score Thresholds**: Set minimum final score requirements
- **Metadata Filters**: Filter by source, tags, and date ranges

### Re-ranking Analysis

- Compare pre/post re-ranking results
- Visualize score contributions from vector, cross-encoder, and metadata
- Export comparison data to CSV
- Analyze position movements and score deltas

### Dashboard & Analytics

- **Session Metrics**: Track query success rates and performance
- **Component Distribution**: Visualize result type breakdowns
- **Query Log**: Review recent searches with parameters
- **Experiment Presets**: Save and load parameter configurations

### Settings & Configuration

- **API Configuration**: Set backend service endpoints
- **Default Parameters**: Configure default search settings
- **Feature Flags**: Enable/disable experimental features
- **Appearance**: Toggle between light and dark themes

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run format       # Format code with Prettier
```

### Code Quality

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking enabled
- **Husky**: Pre-commit hooks for quality assurance

### Styling Guidelines

The app uses a compact design system with consistent spacing:

- **Spacing Scale**: xs(4px), s(8px), m(12px), l(16px), xl(24px), 2xl(32px)
- **Component Heights**: 28px (inputs), 32px (buttons), 36px (table rows)
- **Typography**: 12-18px with appropriate line heights
- **Colors**: CSS variables for consistent theming

## 🌐 API Integration

The app expects a backend API with the following endpoints:

- `POST /search` - Vector and hybrid search
- `GET /facets` - Available filter options
- `GET /stats` - System statistics
- `GET /health` - Service health check

See `src/types/api.ts` for complete API contract definitions.

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

Tests cover:
- Component rendering and interactions
- State management and API calls
- Utility functions and data transformations
- Responsive behavior and accessibility

## 🚀 Deployment

### Build Output

The production build creates optimized static files in `web/dist/`:

```bash
npm run build
```

### Deployment Options

- **Static Hosting**: Deploy to Netlify, Vercel, or GitHub Pages
- **Docker**: Use the provided Dockerfile for containerized deployment
- **CDN**: Serve static assets through a content delivery network

### Environment Variables

Configure production environment variables:

```env
VITE_UI_API_BASE=https://your-api-domain.com/api
VITE_ENABLE_HYBRID=true
VITE_ENABLE_RERANKING=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established code style and component patterns
- Maintain the compact design system principles
- Add appropriate TypeScript types for new features
- Include tests for new functionality
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

- Check the documentation in the `/docs` directory
- Review the API contracts in `src/types/api.ts`
- Examine the component examples in `src/components/`
- Open an issue for bugs or feature requests

## 🔮 Roadmap

- [ ] Advanced chart visualizations with D3.js
- [ ] Real-time collaboration features
- [ ] A/B testing framework for retrieval strategies
- [ ] Export capabilities for analysis reports
- [ ] Integration with external monitoring tools
- [ ] Mobile-optimized touch interactions

---

**Built with ❤️ for the SAP iFlow community**
