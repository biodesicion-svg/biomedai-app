import Sidebar from '@/components/layout/Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#080e16' }}>
      <Sidebar />
      <div style={{ marginLeft:'256px', flex:1 }}>
        {children}
      </div>
    </div>
  )
}
