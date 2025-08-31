import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { CompactHeaderNav } from '@/components/CompactHeaderNav'
import { SearchPage } from '@/pages/SearchPage'
import { GenerationLabPage } from '@/pages/GenerationLabPage'
import { RerankPage } from '@/pages/RerankPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AboutPage } from '@/pages/AboutPage'
import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { darkMode } = useAppStore()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen bg-background text-foreground">
          <CompactHeaderNav />
          <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/generation" element={<GenerationLabPage />} />
              <Route path="/rerank" element={<RerankPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
