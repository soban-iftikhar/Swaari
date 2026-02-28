# Swaari Frontend

React application built with Vite for the Swaari project.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: JavaScript (JSX)
- **Styling**: CSS
- **Linting**: ESLint

## Project Structure

```
Frontend/
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
├── public/              # Static assets
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # Main App component
    └── index.css        # Global styles
```

## Installation

```bash
npm install
```

## Available Scripts

### Development Server
```bash
npm run dev
```
Runs the app in development mode at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Builds the app for production to the `dist` folder

### Preview Production Build
```bash
npm run preview
```
Locally preview production build

### Linting
```bash
npm run lint
```
Run ESLint to check code quality

## Environment Variables

Create a `.env` file in the Frontend directory if needed:

```env
VITE_API_URL=http://localhost:5000/api
```

Access in code using `import.meta.env.VITE_API_URL`

## Development Guidelines

### Component Structure
- Use functional components with hooks
- Keep components small and focused
- Use descriptive component names

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.jsx`)
- Files: camelCase or PascalCase
- CSS: kebab-case for class names

### Code Style
- Use ES6+ features
- Destructure props
- Use arrow functions
- Follow ESLint rules

## Project Features

### Current Features
- ✅ Basic React setup with Vite
- ✅ Hot Module Replacement (HMR)
- ✅ ESLint configuration
- ✅ React 19 with modern features

### Planned Features
- 🔄 User authentication UI
- 🔄 Dashboard/Home page
- 🔄 Responsive design
- 🔄 API integration
- 🔄 Real-time features
- 🔄 Routing (React Router)
- 🔄 State management
- [Add more as development progresses]

## API Integration

The frontend will communicate with the backend API at:
- Development: `http://localhost:5000/api`
- Production: [Add production URL here]

### Example API Call
```javascript
// Example: Login user
const response = await fetch('http://localhost:5000/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const data = await response.json();
```

## Folder Organization (Recommended)

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── services/        # API service functions
├── utils/           # Utility functions
├── context/         # React Context providers
├── assets/          # Images, fonts, etc.
└── styles/          # CSS/styling files
```

## Styling

Currently using vanilla CSS. Consider adding:
- [ ] CSS Modules
- [ ] Styled Components
- [ ] Tailwind CSS
- [ ] Material-UI / Chakra UI
- [ ] Other UI library

## State Management

Currently using React built-in state (useState, useContext).

Consider adding when needed:
- [ ] Redux / Redux Toolkit
- [ ] Zustand
- [ ] Jotai
- [ ] Recoil

## Routing

Not yet implemented. Consider adding:
- [ ] React Router v6+

## Testing

[Add testing setup information here]

Recommended tools:
- Vitest (unit testing)
- React Testing Library
- Cypress (E2E testing)

## Build & Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deployment Options
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- [Add your chosen platform]

## Performance Optimization

- [ ] Code splitting
- [ ] Lazy loading components
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Caching strategies

## Browser Support

Modern browsers supporting ES6+:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Issues

[Document any known issues here]

## Contributing

[Add contribution guidelines]

---

**Last Updated**: February 28, 2026
