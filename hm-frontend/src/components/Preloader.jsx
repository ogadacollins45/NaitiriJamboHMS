import React from 'react';
import { Loader } from 'lucide-react';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-12 h-12 text-indigo-500" />
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    </div>
  );
};

export default Preloader;