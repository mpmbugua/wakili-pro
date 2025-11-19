import React from 'react';
export default function TestApp() {
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '30px',
      textAlign: 'center'
    }}>
      🔥 TEST COMPONENT WORKING! 🔥
      <br />
      If you see this RED screen, the build system works!
      <br />
      Current time: {new Date().toLocaleTimeString()}
    </div>
  );
}