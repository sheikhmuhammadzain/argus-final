// src/App.jsx
import React from 'react';
import Header from './Components/Header';
import QueryComponent from './Components/QueryComponent';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <QueryComponent />
    </div>
  );
}

export default App;
