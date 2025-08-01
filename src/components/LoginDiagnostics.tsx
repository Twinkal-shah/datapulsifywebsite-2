import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { clearAuthState } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginDiagnostics: React.FC<LoginDiagnosticsProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    const results = {
      envVars: {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        googleClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
        googleClientSecret: !!import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        googleRedirectUri: !!import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      },
      supabaseConnection: { status: 'testing', error: null },
      oauthTest: { status: 'testing', error: null },
      authState: {
        localStorage: Object.keys(localStorage).filter(key => key.includes('auth')),
        cookies: document.cookie ? 'present' : 'none'
      }
    };

    // Test Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        results.supabaseConnection = { status: 'error', error: error.message };
      } else {
        results.supabaseConnection = { status: 'success', error: null };
      }
    } catch (err) {
      results.supabaseConnection = { status: 'error', error: String(err) };
    }

    // Test OAuth initiation (dry run)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://app.datapulsify.com/auth/google/callback',
          skipBrowserRedirect: true // Don't actually redirect
        }
      });
      
      if (error) {
        results.oauthTest = { status: 'error', error: error.message };
      } else if (data.url) {
        results.oauthTest = { status: 'success', error: null };
      } else {
        results.oauthTest = { status: 'error', error: 'No OAuth URL generated' };
      }
    } catch (err) {
      results.oauthTest = { status: 'error', error: String(err) };
    }

    setDiagnostics(results);
  };

  const handleClearAuthState = async () => {
    setIsClearing(true);
    try {
      await clearAuthState();
      // Re-run diagnostics after clearing
      setTimeout(() => {
        runDiagnostics();
        setIsClearing(false);
      }, 1000);
    } catch (error) {
      console.error('Error clearing auth state:', error);
      setIsClearing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '🔄';
      default: return '⚪';
    }
  };

  if (!diagnostics) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Login Diagnostics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Running diagnostics...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Login Diagnostics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Environment Variables */}
          <div>
            <h3 className="font-semibold mb-3">Environment Variables</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(diagnostics.envVars).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <span className="mr-2">{value ? '✅' : '❌'}</span>
                  <span className="font-mono">{key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supabase Connection */}
          <div>
            <h3 className="font-semibold mb-3">Supabase Connection</h3>
            <div className="flex items-center text-sm">
              <span className="mr-2">{getStatusIcon(diagnostics.supabaseConnection.status)}</span>
              <span>Connection Status</span>
              {diagnostics.supabaseConnection.error && (
                <span className="ml-2 text-red-600">({diagnostics.supabaseConnection.error})</span>
              )}
            </div>
          </div>

          {/* OAuth Test */}
          <div>
            <h3 className="font-semibold mb-3">OAuth Initiation</h3>
            <div className="flex items-center text-sm">
              <span className="mr-2">{getStatusIcon(diagnostics.oauthTest.status)}</span>
              <span>OAuth URL Generation</span>
              {diagnostics.oauthTest.error && (
                <span className="ml-2 text-red-600">({diagnostics.oauthTest.error})</span>
              )}
            </div>
          </div>

          {/* Auth State */}
          <div>
            <h3 className="font-semibold mb-3">Current Auth State</h3>
            <div className="text-sm space-y-2">
              <div>
                <strong>localStorage keys:</strong> {diagnostics.authState.localStorage.length > 0 ? diagnostics.authState.localStorage.join(', ') : 'none'}
              </div>
              <div>
                <strong>Cookies:</strong> {diagnostics.authState.cookies}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={handleClearAuthState}
              disabled={isClearing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClearing ? 'Clearing...' : 'Clear Auth State & Retry'}
            </button>
            
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Re-run Diagnostics
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Recommendations:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {!diagnostics.envVars.supabaseUrl && <li>• Check VITE_SUPABASE_URL environment variable</li>}
              {!diagnostics.envVars.supabaseKey && <li>• Check VITE_SUPABASE_ANON_KEY environment variable</li>}
              {!diagnostics.envVars.googleClientId && <li>• Check VITE_GOOGLE_CLIENT_ID environment variable</li>}
              {diagnostics.supabaseConnection.status === 'error' && <li>• Verify Supabase project configuration</li>}
              {diagnostics.oauthTest.status === 'error' && <li>• Check Google OAuth client configuration</li>}
              {diagnostics.authState.localStorage.length > 0 && <li>• Try clearing auth state if login is stuck</li>}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 