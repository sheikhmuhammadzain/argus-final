import React from 'react';
import logo from '../assets/cybergen-logo-black.svg';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Cybergen logo" className="h-5 md:h-8 w-auto" />
          <h1 className="text-sm font-semibold text-gray-800 md:text-2xl "> <span className="text-blue-500 font-bold ">RAG </span> Evaluation</h1>
        </div>
        <div className="text-xs text-gray-700/80 md:text-md ">ARGUS System</div>
      </div>
    </header>
  );
};

export default Header;