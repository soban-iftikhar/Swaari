import { ArrowRight } from 'lucide-react'
import {Link} from 'react-router-dom'

const Home = () => {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat px-6"
      style={{ backgroundImage: "url('home.png')" }}
    >
      {/* Logo Text - top area */}
      <div className="pt-5 pb-3">
        <h1 className="text-4xl md:text-6xl font-black text-black" style={{ fontFamily: "'Inter', 'Inter ExtraBold', sans-serif" }}>
          Sawari
        </h1>
      </div>

      {/* Button - fixed to absolute bottom */}
      <div className="absolute bottom-3 left-6 right-6 flex justify-center">
        <Link to="/get-started" className="flex items-center justify-center gap-2 rounded-full bg-yellow-400 hover:bg-yellow-500 px-4 py-2 text-lg font-bold text-gray-900 shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl whitespace-nowrap">
          Get Started
          <ArrowRight className="h-6 w-6 shrink-0" />
        </Link>
      </div>
    </div>
  )
}

export default Home