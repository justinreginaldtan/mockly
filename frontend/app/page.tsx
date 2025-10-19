import Hero from "@/components/Hero"
import HomePage from "./_components/home-page"

export const metadata = {
  title: "Mockly – AI Customer Service Training Platform",
  description: "Master customer service with AI-powered voice simulations, real-time feedback, and adaptive difficulty training.",
}

export default function Page() {
  return <HomePage HeroComponent={Hero} />
}
