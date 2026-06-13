import React from 'react';
// Import the new forensic dashboard component
import AudioForensicsDashboard from './AudioForensicsDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Render the dashboard directly */}
      <AudioForensicsDashboard />
    </div>
  );
}

export default App;