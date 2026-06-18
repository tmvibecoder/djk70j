import { redirect } from 'next/navigation'

// Startseite: direkt zur Finanzplanung (Reiter „Kosten")
export default function HomePage() {
  redirect('/finanzen')
}
