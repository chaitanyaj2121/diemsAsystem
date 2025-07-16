import React from "react"
import { Link } from "react-router-dom"
import {
  AcademicCapIcon,
  UserGroupIcon,
  UserIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline" // Using Heroicons for a modern look

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
      {/* Main Title Section */}
      <div className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tighter drop-shadow-lg">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Smart Attendance System
          </span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Streamline attendance management for students, teachers, and
          administrators. Efficiency, accuracy, and insights at your fingertips.
        </p>
      </div>

      {/* Role-based Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {/* HOD Login Card */}
        <Link
          to="/hod-login"
          className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 hover:border-blue-400"
        >
          <div className="flex-shrink-0 p-3 bg-blue-100 text-blue-600 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
            <AcademicCapIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            HoD Login
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Access administrative controls and overall department insights.
          </p>
        </Link>

        {/* Teacher Login Card */}
        <Link
          to="/teacher-login"
          className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 hover:border-indigo-400"
        >
          <div className="flex-shrink-0 p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4 group-hover:bg-indigo-200 transition-colors">
            <UserGroupIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Teacher Login
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Manage your classes, mark attendance, and view student records.
          </p>
        </Link>

        {/* Student Login Card */}
        <Link
          to="/student-login"
          className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 hover:border-green-400"
        >
          <div className="flex-shrink-0 p-3 bg-green-100 text-green-600 rounded-full mb-4 group-hover:bg-green-200 transition-colors">
            <UserIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Student Login
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Check your attendance, academic progress, and notifications.
          </p>
        </Link>

        {/* Student Signup Card */}
        <Link
          to="/student-signup"
          className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 hover:border-purple-400"
        >
          <div className="flex-shrink-0 p-3 bg-purple-100 text-purple-600 rounded-full mb-4 group-hover:bg-purple-200 transition-colors">
            <PlusCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Student Signup
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Register your account to get started with the system.
          </p>
        </Link>
      </div>

      {/* Footer / Credits */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Smart Attendance System. All rights
          reserved.
        </p>
        <p className="mt-1">Built with React and Tailwind CSS.</p>
      </footer>

      {/* Tailwind CSS Customization (for Inter font and animations) */}
      <style>
        {`
        @import url('[https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap)');
        body {
          font-family: 'Inter', sans-serif;
        }
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
        `}
      </style>
    </div>
  )
}

export default Home
