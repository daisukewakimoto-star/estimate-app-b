import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '見積書作成 | SEE THE SEA テラス改修',
  description: '建設工事見積書作成システム',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
