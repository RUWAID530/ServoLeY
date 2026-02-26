import React from 'react'
import { Link } from 'react-router-dom'

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please log in with the correct account type.
          </p>
          <div className="flex flex-col space-y-2">
            <Link
              to="/auth"
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
            <Link
              to="/"
              className="w-full bg-gray-200 text-gray-800 rounded-md py-2 px-4 hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
