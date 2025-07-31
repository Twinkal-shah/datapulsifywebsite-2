import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface DiagnosticInfo {
  environment: {
    supabaseUrl: boolean;
    supabaseKey: boolean;
    googleClientId: boolean;
    googleClientSecret: boolean;
    googleRedirectUri: boolean;
    isDev: boolean;
    mode: string;
  };
  supabase: {
    canConnect: boolean;
    error: string | null;
  };
  oauth: {
    canInitiate: boolean;
    error: string | null;
  };
}

export const LoginDiagnostics: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: DiagnosticInfo = {
        environment: {
          supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          googleClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
          googleClientSecret: !!import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          googleRedirectUri: !!import.meta.env.VITE_GOOGLE_REDIRECT_URI,
          isDev: import.meta.env.DEV,
          mode: import.meta.env.MODE || 'unknown'
        },
        supabase: {
          canConnect: false,
          error: null
        },
        oauth: {
          canInitiate: false,
          error: null
        }
      };

      // Test Supabase connection
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          results.supabase.error = error.message;
        } else {
          results.supabase.canConnect = true;
        }
      } catch (error) {
        results.supabase.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Test OAuth initiation (dry run)
      try {
        // Don't actually initiate OAuth, just test the configuration
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'https://app.datapulsify.com/auth/google/callback',
            skipBrowserRedirect: true // This prevents actual redirect
          }
        });
        
        if (error) {
          results.oauth.error = error.message;
        } else if (data?.url) {
          results.oauth.canInitiate = true;
        } else {
          results.oauth.error = 'No OAuth URL returned';
        }
      } catch (error) {
        results.oauth.error = error instanceof Error ? error.message : 'Unknown error';
      }

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Running Login Diagnostics...</h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!diagnostics) return null;

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';
  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Login Diagnostics</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Environment Variables */}
          <div>
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div className={getStatusColor(diagnostics.environment.supabaseUrl)}>
                {getStatusIcon(diagnostics.environment.supabaseUrl)} VITE_SUPABASE_URL
              </div>
              <div className={getStatusColor(diagnostics.environment.supabaseKey)}>
                {getStatusIcon(diagnostics.environment.supabaseKey)} VITE_SUPABASE_ANON_KEY
              </div>
              <div className={getStatusColor(diagnostics.environment.googleClientId)}>
                {getStatusIcon(diagnostics.environment.googleClientId)} VITE_GOOGLE_CLIENT_ID
              </div>
              <div className={getStatusColor(diagnostics.environment.googleClientSecret)}>
                {getStatusIcon(diagnostics.environment.googleClientSecret)} VITE_GOOGLE_CLIENT_SECRET
              </div>
              <div className={getStatusColor(diagnostics.environment.googleRedirectUri)}>
                {getStatusIcon(diagnostics.environment.googleRedirectUri)} VITE_GOOGLE_REDIRECT_URI
              </div>
              <div className="text-gray-600">
                🌍 Environment: {diagnostics.environment.isDev ? 'Development' : 'Production'} ({diagnostics.environment.mode})
              </div>
            </div>
          </div>

          {/* Supabase Connection */}
          <div>
            <h4 className="font-medium mb-2">Supabase Connection</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className={getStatusColor(diagnostics.supabase.canConnect)}>
                {getStatusIcon(diagnostics.supabase.canConnect)} Connection Status
              </div>
              {diagnostics.supabase.error && (
                <div className="text-red-600 mt-1">
                  Error: {diagnostics.supabase.error}
                </div>
              )}
            </div>
          </div>

          {/* OAuth Configuration */}
          <div>
            <h4 className="font-medium mb-2">OAuth Configuration</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className={getStatusColor(diagnostics.oauth.canInitiate)}>
                {getStatusIcon(diagnostics.oauth.canInitiate)} OAuth Initiation
              </div>
              {diagnostics.oauth.error && (
                <div className="text-red-600 mt-1">
                  Error: {diagnostics.oauth.error}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <div className="bg-blue-50 p-3 rounded text-sm space-y-2">
              {!diagnostics.environment.supabaseUrl && (
                <div>• Set VITE_SUPABASE_URL in your environment variables</div>
              )}
              {!diagnostics.environment.supabaseKey && (
                <div>• Set VITE_SUPABASE_ANON_KEY in your environment variables</div>
              )}
              {!diagnostics.environment.googleClientId && (
                <div>• Set VITE_GOOGLE_CLIENT_ID in your environment variables</div>
              )}
              {!diagnostics.supabase.canConnect && (
                <div>• Check Supabase configuration and network connectivity</div>
              )}
              {!diagnostics.oauth.canInitiate && (
                <div>• Verify Google OAuth configuration in Google Cloud Console</div>
              )}
              {diagnostics.environment.supabaseUrl && 
               diagnostics.environment.supabaseKey && 
               diagnostics.supabase.canConnect && 
               diagnostics.oauth.canInitiate && (
                <div className="text-green-600">✅ All systems appear to be working correctly!</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 