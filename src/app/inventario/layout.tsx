import Sidebar from '@/components/layout/Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#fff' }}>
      <Sidebar />
      <main style={{ flex:1, marginLeft:248, minHeight:'100vh', display:'flex', flexDirection:'column', background:'#fff' }}>
        {children}
      </main>
    </div>
  )
}
