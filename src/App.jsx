import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import AppLayout from '@/components/layout/AppLayout'
import AuthScreen from '@/screens/Auth'
import SourceScreen from '@/screens/Source'
import AnalysisScreen from '@/screens/Analysis'
import WorkbenchScreen from '@/screens/Workbench'
import FinishScreen from '@/screens/Finish'
import AdminScreen from '@/screens/Admin'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex items-center gap-3 text-primary">
        <Leaf className="size-6 animate-pulse text-deep-forest" />
        <span className="font-display text-xl">NaturoPin 1.0…</span>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Splash />

  return (
    <BrowserRouter>
      {!session ? (
        <Routes>
          <Route path="*" element={<AuthScreen />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<AppLayout session={session} />}>
            <Route path="/" element={<SourceScreen />} />
            <Route path="/analysis/:projectId" element={<AnalysisScreen />} />
            <Route path="/workbench/:projectId" element={<WorkbenchScreen />} />
            <Route path="/finish/:projectId" element={<FinishScreen />} />
            {ADMIN_EMAIL && session.user.email === ADMIN_EMAIL && (
              <Route path="/admin" element={<AdminScreen />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  )
}
