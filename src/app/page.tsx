import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/login');
}
EOF{
cat > src/app/page.tsx << 'EOF'
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/login');
}
