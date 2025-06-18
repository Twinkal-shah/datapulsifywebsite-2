import React, { useState } from 'react';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { Button } from '@/components/ui/button';

export default function TestGSC() {
  const [status, setStatus] = useState<string>('');
  const googleAuthService = new GoogleAuthService();

  const checkToken = async () => {
    setStatus('Checking token...');
    const token = localStorage.getItem('gsc_token');
    if (!token) {
      setStatus('No token found. Please connect to GSC first.');
      return;
    }
    setStatus(`Current token: ${token.substring(0, 10)}...`);
  };

  const validateToken = async () => {
    setStatus('Validating token...');
    const token = localStorage.getItem('gsc_token');
    if (!token) {
      setStatus('No token found');
      return;
    }
    const isValid = await googleAuthService.validateToken(token);
    setStatus(`Token validation result: ${isValid ? 'Valid' : 'Invalid'}`);
  };

  const refreshToken = async () => {
    setStatus('Testing token refresh...');
    const result = await googleAuthService.validateAndRefreshToken();
    if (result) {
      setStatus(`Token refreshed successfully. New token: ${result.substring(0, 10)}...`);
    } else {
      setStatus('Token refresh failed');
    }
  };

  const testGSCAccess = async () => {
    setStatus('Testing GSC access...');
    try {
      const properties = await googleAuthService.fetchGSCProperties();
      setStatus(`Successfully fetched ${properties.length} GSC properties: ${JSON.stringify(properties, null, 2)}`);
    } catch (error) {
      setStatus(`Error fetching GSC properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const connectGSC = () => {
    googleAuthService.initiateGSCAuth();
  };

  const disconnect = () => {
    googleAuthService.clearAuth();
    setStatus('Disconnected from GSC');
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">GSC Authentication Test</h1>
      
      <div className="space-y-2">
        <Button onClick={checkToken} variant="outline">Check Current Token</Button>
        <Button onClick={validateToken} variant="outline">Validate Token</Button>
        <Button onClick={refreshToken} variant="outline">Test Token Refresh</Button>
        <Button onClick={testGSCAccess} variant="outline">Test GSC Access</Button>
        <Button onClick={connectGSC} variant="default">Connect GSC</Button>
        <Button onClick={disconnect} variant="destructive">Disconnect</Button>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Status:</h2>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
          {status}
        </pre>
      </div>
    </div>
  );
} 