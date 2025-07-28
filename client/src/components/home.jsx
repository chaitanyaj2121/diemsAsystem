import React from "react"
import { Link } from "react-router-dom"
import {
  AcademicCapIcon,
  UserGroupIcon,
  UserIcon,
  PlusCircleIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"

const Home = () => {
  const features = [
    { icon: ChartBarIcon, title: "Analytics", desc: "Real-time insights" },
    { icon: ClockIcon, title: "Automated", desc: "Smart tracking" },
    { icon: ShieldCheckIcon, title: "Secure", desc: "Data protection" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Main Title Section */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="relative inline-block mb-6">
            <SparklesIcon className="absolute -top-4 -left-4 w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 leading-tight tracking-tighter drop-shadow-2xl">
              Smart Attendance System
            </h1>
            <SparklesIcon className="absolute -bottom-4 -right-4 w-6 h-6 text-pink-400 animate-pulse animation-delay-1000" />
          </div>

          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Streamline attendance management for students, teachers, and
            administrators. Efficiency, accuracy, and insights at your
            fingertips.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white"
              >
                <feature.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{feature.title}</span>
                <span className="text-xs text-slate-300">• {feature.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role-based Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {/* HOD Login Card */}
          <Link
            to="/hod-login"
            className="group relative h-full transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-lg -z-10" />

            <div className="relative h-full flex flex-col items-center p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-blue-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10 flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <AcademicCapIcon className="h-8 w-8" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                  HoD Login
                </h2>
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Access administrative controls and overall department
                  insights.
                </p>
              </div>

              <div className="absolute bottom-4 right-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Teacher Login Card */}
          <Link
            to="/teacher-login"
            className="group relative h-full transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-lg -z-10" />

            <div className="relative h-full flex flex-col items-center p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-emerald-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10 flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <UserGroupIcon className="h-8 w-8" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                  Teacher Login
                </h2>
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Manage your classes, mark attendance, and view student
                  records.
                </p>
              </div>

              <div className="absolute bottom-4 right-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Student Login Card */}
          <Link
            to="/student-login"
            className="group relative h-full transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-violet-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-lg -z-10" />

            <div className="relative h-full flex flex-col items-center p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-purple-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10 flex-shrink-0 p-3 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <UserIcon className="h-8 w-8" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                  Student Login
                </h2>
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Check your attendance, academic progress, and notifications.
                </p>
              </div>

              <div className="absolute bottom-4 right-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Student Signup Card */}
          <Link
            to="/student-signup"
            className="group relative h-full transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-lg -z-10" />

            <div className="relative h-full flex flex-col items-center p-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-orange-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10 flex-shrink-0 p-3 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <PlusCircleIcon className="h-8 w-8" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                  Student Signup
                </h2>
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Register your account to get started with the system.
                </p>
              </div>

              <div className="absolute bottom-4 right-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer / Credits */}
        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Smart Attendance System. All
            rights reserved.
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 1s ease-out forwards;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}

export default Home
