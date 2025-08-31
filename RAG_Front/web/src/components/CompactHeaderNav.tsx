import { Link, useLocation } from 'react-router-dom'
import { Search, BarChart3, Settings, Info, Zap, Code } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const navigation = [
  { 
    name: 'Search', 
    href: '/search', 
    icon: Search,
    description: 'Run vector/hybrid search and inspect results'
  },
  { 
    name: 'Generation Lab', 
    href: '/generation', 
    icon: Code,
    description: 'Generate iFlow code using retrieved context'
  },
  { 
    name: 'Re-ranking', 
    href: '/rerank', 
    icon: BarChart3,
    description: 'Visualize before/after ranking and movement'
  },
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart3,
    description: 'Session metrics and trends'
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'Configure API and defaults'
  },
  { 
    name: 'About', 
    href: '/about', 
    icon: Info,
    description: 'System information and stats'
  }
]

export function CompactHeaderNav() {
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useAppStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">SAP Agentic RAG Lab</h1>
              <p className="text-xs text-muted-foreground">Intelligence Pipeline Testing</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                              (location.pathname === '/' && item.href === '/search')
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "nav-tab-compact group relative",
                    isActive && "data-[state=active]"
                  )}
                  title={item.description}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="btn-compact-sm h-8 w-8 p-0"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
