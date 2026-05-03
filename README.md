# Luma - Osmania University LMS Portal

A comprehensive Learning Management System (LMS) portal for Osmania University built with React and Vite.

## 📁 Project Folder Structure

```
lms/
├── src/
│   ├── assets/
│   │   ├── images/          # Image assets
│   │   └── icons/           # Icon assets
│   ├── components/
│   │   ├── Header/          # Header component with navigation
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   ├── Footer/          # Footer component
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   ├── Navigation/      # Navigation components
│   │   │   └── (add navigation items here)
│   │   └── Common/          # Reusable components
│   │       └── (add shared components here)
│   ├── pages/
│   │   ├── HomePage/        # Home page
│   │   │   ├── HomePage.jsx
│   │   │   └── HomePage.css
│   │   ├── FacultyDashboard/    # Faculty dashboard
│   │   │   └── (add faculty dashboard here)
│   │   ├── StudentDashboard/    # Student dashboard
│   │   │   └── (add student dashboard here)
│   │   └── Courses/         # Courses page
│   │       └── (add courses page here)
│   ├── styles/              # Global styles
│   │   ├── variables.css    # CSS variables
│   │   └── global.css       # Global styles
│   ├── hooks/               # Custom React hooks
│   │   └── (add hooks here)
│   ├── utils/               # Utility functions
│   │   └── (add utilities here)
│   ├── context/             # React context providers
│   │   └── (add context here)
│   ├── App.jsx              # Main app component
│   ├── App.css              # App styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static files
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── index.html               # HTML template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized files will be in the `dist/` folder.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎨 Color Scheme

The portal uses a modern color scheme:

- **Primary Color**: `#667eea` (Indigo)
- **Secondary Color**: `#764ba2` (Purple)
- **Accent Color**: `#ff6b6b` (Red)
- **Text Dark**: `#333333`
- **Text Light**: `#666666`
- **Background Light**: `#f8f9fa`

## 🏗️ Component Structure

### Header Component
- Navigation links
- Logo/Branding
- Sign in and Get Started buttons
- Sticky positioning

### Footer Component
- Links organized by sections
- Company information
- Legal links

### Home Page Sections
1. **Hero Section** - Main banner with call-to-action
2. **Featured Program** - Highlight special programs
3. **Features Section** - Key features with cards
4. **Why Choose Us** - Benefits of the platform
5. **Testimonials** - Messages from leadership
6. **FAQ Section** - Frequently asked questions

## 🛠️ Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern features
- **JavaScript ES6+** - Modern JavaScript

## 📱 Responsive Design

Fully responsive with mobile-first approach.

## 🧩 Next Steps - Pages to Add

1. Faculty Dashboard - Course management, grading, analytics
2. Student Dashboard - Courses, assignments, grades
3. Courses Page - Course catalog and enrollment
4. Authentication - Login/Register system
5. User Profiles - Profile management
6. Settings - System settings

## 📝 Development Guidelines

### Creating New Components

1. Create folder in `src/components/` or `src/pages/`
2. Create JSX and CSS files
3. Export component

### Naming Conventions

- **Components**: PascalCase (`HomePage.jsx`)
- **CSS Classes**: kebab-case (`.hero-section`)
- **Variables**: camelCase (`studentData`)

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

## 📄 License

Developed for Osmania University.
