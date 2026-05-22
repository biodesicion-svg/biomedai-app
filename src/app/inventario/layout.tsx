import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#ffffff' }}>
      <Sidebar />
      <main style={{ flex:1, marginLeft:240, minHeight:'100vh', display:'flex', flexDirection:'column', background:'#ffffff' }}>
        {children}
      </main>
    </div>
  )
}
