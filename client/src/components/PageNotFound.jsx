// src/components/PageNotFound.jsx
import React from "react"

const PageNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-inter">
      {" "}
      {/* Changed background to white */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm p-10 rounded-xl shadow-2xl text-center transform hover:scale-105 transition-transform duration-500 ease-in-out max-w-md w-full">
        {/* Icon/Illustration */}
        <div className="mb-6 animate-bounce-slow">
          <svg
            className="w-24 h-24 mx-auto text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 mb-4 animate-fade-in-down">
          404
        </h1>
        <p className="text-2xl font-semibold text-gray-700 mb-4 animate-fade-in-up">
          Oops! Page Not Found
        </p>
        <p className="text-lg text-gray-600 mb-8 animate-fade-in">
          It looks like you've ventured into uncharted territory.
          <br />
          The page you're looking for might have been removed,
          <br />
          had its name changed, or is temporarily unavailable.
        </p>
        <a
          href="/"
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 font-bold text-lg"
        >
          Go Back Home
        </a>
      </div>
      {/* Tailwind CSS Custom Animations */}
      <style>
        {`
          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes fade-in-down {
            0% {
              opacity: 0;
              transform: translateY(-20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }

          .animate-bounce-slow {
            animation: bounce-slow 2s infinite ease-in-out;
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.8s ease-out forwards;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            animation-delay: 0.2s; /* Delay for sequential animation */
          }
          .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
            animation-delay: 0.4s; /* Delay for sequential animation */
          }
        `}
      </style>
    </div>
  )
}

export default PageNotFound
