import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to the original vehicles design
  redirect('/vehicles-original')
}
