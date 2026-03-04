import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/login`,
        { email, password }
      );

      const { token, user } = res.data;

      // Store all authentication details
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role); // admin | doctor | reception | pharmacist | labtech
      localStorage.setItem("name", user.name);
      localStorage.setItem("staff_id", user.id);

      // Set default axios authorization header globally
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Optionally call AuthContext login (if used)
      // Instead of logging in again with email/password, pass the token.
      if (login) login(token, user);

      // Now safely redirect
      navigate("/dashboard", { replace: true });


    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-gray-50 overflow-hidden">
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes slide-up {
          0% { transform: translateY(100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
      `}</style>

      <main className="flex h-full min-h-screen grow items-stretch">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-1 lg:flex-[0_0_50%] xl:flex-[0_0_45%] relative items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 animate-gradient">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=1600&fit=crop"
              alt="Medical Background"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-300/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
          </div>

          <div className="relative flex flex-col items-center justify-center p-12 text-center text-white z-10 animate-slide-up">
            <div className="flex items-center gap-4 mb-6 transform hover:scale-105 transition-transform duration-300">
              <div className="text-7xl animate-float">🏥</div>
              <h1 className="text-5xl font-bold drop-shadow-lg">Naitiri Jambo HMS</h1>
            </div>
            <p className="mt-4 text-lg text-white/90 max-w-md drop-shadow-md">
              Dedicated to providing exceptional care and streamlined hospital management.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="flex flex-1 lg:flex-[0_0_50%] xl:flex-[0_0_55%] flex-col justify-center items-center p-6 sm:p-8 md:p-12 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 animate-gradient relative overflow-hidden">

          <div className="flex flex-col w-full max-w-md gap-8 animate-slide-up relative z-10 bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">

            {/* Mobile Header - Only visible on small screens */}
            <div className="flex lg:hidden flex-col items-center gap-4 pb-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3 transform hover:scale-105 transition-transform duration-300">
                <div className="text-5xl sm:text-6xl animate-float">🏥</div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Naitiri Jambo HMS
                </h1>
              </div>
              <p className="text-gray-600 text-sm text-center max-w-sm">
                Dedicated to providing exceptional care and streamlined hospital management.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-center lg:text-left">
              <h1 className="text-gray-900 text-3xl sm:text-4xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Welcome Back
              </h1>
              <p className="text-gray-700 text-base">
                Please enter your credentials to log in.
              </p>
            </div>

            {error && (
              <div className="bg-red-100/90 backdrop-blur-sm border border-red-300 text-red-700 px-4 py-3 rounded-lg text-center text-sm animate-slide-up shadow-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* EMAIL */}
              <label className="flex flex-col w-full">
                <p className="text-gray-800 text-base font-medium pb-2">
                  Email
                </p>
                <input
                  type="email"
                  className="w-full rounded-lg text-gray-900 border border-gray-300/50 bg-white/80 h-14 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              {/* PASSWORD */}
              <label className="flex flex-col w-full">
                <p className="text-gray-800 text-base font-medium pb-2">
                  Password
                </p>
                <div className="relative flex w-full items-center rounded-lg overflow-hidden">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="flex-1 rounded-lg rounded-r-none text-gray-900 border border-r-0 border-gray-300/50 bg-white/80 h-14 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center justify-center w-12 sm:w-14 h-14 rounded-r-lg bg-white/80 border border-gray-300/50 text-gray-600 hover:bg-gray-50/80 transition-colors duration-200 flex-shrink-0"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </label>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="h-14 px-8 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
