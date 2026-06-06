import React from 'react'
import {useNavigate} from "react-router-dom";

const LoginFailedPage = () => {
    const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col justify-center items-center gap-4 bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-500">Login Failed!!</h1>
        <p className="text-gray-600">Please check your credentials and try again.</p>
        <button onClick={()=>navigate('/')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Try Again
        </button>
        </div>

    </div>
  )
}

export default LoginFailedPage