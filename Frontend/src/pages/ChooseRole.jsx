import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ChooseRole = () => {
  return (
    <>
      {/* Logo Text - top left corner */}
      <div className="absolute top-4 left-4 z-10">
        <h1
          className="text-4xl md:text-6xl font-black text-black"
          style={{ fontFamily: "'Inter', 'Inter ExtraBold', sans-serif" }}
        >
          Sawari
        </h1>
      </div>
      <div
        className="relative min-h-screen bg-cover bg-center bg-no-repeat px-6 flex items-end justify-center pb-20"
        style={{ backgroundImage: "url('trafficLights.png')" }}
      >
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <div className="bg-black/30 backdrop-blur-sm px-8 py-4 rounded-2xl">
            <h1 className="text-3xl font-bold text-white">Choose Your Role</h1>
          </div>
          <div className="flex gap-8 justify-center w-full">
            <Link
              to="/driver/login"
              className="px-8 py-3 bg-orange-400/75 text-black text-2xl rounded-lg hover:bg-orange-600 transition font-semibold shadow-lg flex items-center gap-2"
            >
              Driver
            </Link>
            <Link
              to="/user/login"
              className="px-8 py-3 bg-pink-400/75 text-black text-2xl rounded-lg hover:bg-pink-600 transition font-semibold shadow-lg flex items-center gap-2"
            >
              Rider
            </Link>
          </div>
        </div>

        {/* Back to Home button */}
        <Link
          to="/"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
          title="Back to Home"
        >
          <ChevronLeft className="h-6 w-6 text-black" />
        </Link>
      </div>
    </>
  );
};

export default ChooseRole;
