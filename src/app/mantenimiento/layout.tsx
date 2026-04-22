import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#080e16' }}>
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
