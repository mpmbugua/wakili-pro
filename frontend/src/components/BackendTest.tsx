import React from 'react';
import { useEffect, useState } from 'react';

const BackendTest = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch('https://wakili-pro.onrender.com/health');
        const result = await response.json();
        setData(result);
        setStatus('✅ Backend Connected Successfully!');
      } catch (error) {
        setStatus('❌ Backend Connection Failed');
        console.error('Backend test failed:', error);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Wakili Pro Backend Test
        </h1>
        
        <div className="text-center">
          <p className="text-lg mb-4">{status}</p>
          
          {data && (
            <div className="bg-gray-100 p-4 rounded text-left">
              <h3 className="font-semibold mb-2">Backend Response:</h3>
              <pre className="text-sm text-gray-600">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Backend URL:</strong><br/>
              https://wakili-pro.onrender.com
            </p>
            <p className="text-sm text-gray-600">
              <strong>Health Check:</strong><br/>
              https://wakili-pro.onrender.com/health
            </p>
            <p className="text-sm text-gray-600">
              <strong>API Root:</strong><br/>
              https://wakili-pro.onrender.com/api
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendTest;