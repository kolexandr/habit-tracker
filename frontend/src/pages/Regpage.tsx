import React from 'react';

const Regpage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {/* Logo Placeholder */}
        <img src="/logo_new.png" className='rounded-full mb-5 w-70 h-50 mx-auto'/>
        {/* <h1 className='font-medium mx-auto mb-2'>Habit Tracker</h1> */}

        {/* Tab Switcher */}
        <div className="flex border rounded-md mb-6 overflow-hidden">
          <button className="flex-1 py-2 bg-gray-400 text-white font-medium">Login</button>
          <button className="flex-1 py-2 bg-white text-gray-600 hover:bg-gray-50">Register</button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-left">
          <div>
            <p className='font-medium text-black flex-1'>Email</p>
            <input 
              type="email" 
              placeholder="email@example.com" 
              className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div>
            <p className='font-medium text-black flex-1'>Password</p>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <button className="w-full bg-neutral-800 text-white py-3 rounded-md mt-6 font-bold hover:bg-black">
          Login
        </button>

        <button className="text-sm text-gray-500 mt-4 underline block mx-auto">
          Forgot password?
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t"></div>
        </div>

        <button className="w-full border py-3 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50">
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Regpage;