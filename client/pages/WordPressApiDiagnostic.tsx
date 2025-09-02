import React, { useState, useEffect } from 'react';
import { wordpressCustomApi } from '../lib/wordpressCustomApi';
import { AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  message: string;
  data?: any;
  duration?: number;
}

export function WordPressApiDiagnostic() {
  const [results, setResults] = useState<{
    site?: DiagnosticResult;
    restApi?: DiagnosticResult;
    customEndpoint?: DiagnosticResult;
    comprehensive?: DiagnosticResult;
  }>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async (type: 'site' | 'restApi' | 'customEndpoint' | 'comprehensive') => {
    setLoading(true);
    const startTime = Date.now();

    try {
      let result: DiagnosticResult;

      switch (type) {
        case 'site':
          result = await wordpressCustomApi.testWordPressSite();
          break;
        case 'restApi':
          result = await wordpressCustomApi.testWordPressRestApi();
          break;
        case 'customEndpoint':
          result = await wordpressCustomApi.testCustomEndpoint();
          break;
        case 'comprehensive':
          result = await wordpressCustomApi.testConnection();
          break;
        default:
          throw new Error('Unknown diagnostic type');
      }

      result.duration = Date.now() - startTime;
      setResults(prev => ({ ...prev, [type]: result }));
    } catch (error) {
      const result: DiagnosticResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
      setResults(prev => ({ ...prev, [type]: result }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    
    await runDiagnostic('site');
    await runDiagnostic('restApi');
    await runDiagnostic('customEndpoint');
    await runDiagnostic('comprehensive');
    
    setLoading(false);
  };

  useEffect(() => {
    // Run comprehensive test on mount
    runDiagnostic('comprehensive');
  }, []);

  const ResultCard = ({ title, result }: { title: string; result?: DiagnosticResult }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {result ? (
          result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )
        ) : (
          <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
        )}
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {result?.duration && (
          <span className="text-xs text-gray-500">({result.duration}ms)</span>
        )}
      </div>
      
      {result ? (
        <div>
          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          {result.data && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
              <pre className="text-xs bg-gray-50 p-2 mt-1 rounded overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Running test...</div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">WordPress API Diagnostic</h1>
        <p className="text-gray-600">
          Test the connection to your WordPress site and custom API endpoints.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Run All Tests
          </button>
          <button
            onClick={() => runDiagnostic('site')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Test Site
          </button>
          <button
            onClick={() => runDiagnostic('restApi')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Test REST API
          </button>
          <button
            onClick={() => runDiagnostic('customEndpoint')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Test Custom Endpoint
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ResultCard title="WordPress Site Connectivity" result={results.site} />
        <ResultCard title="WordPress REST API" result={results.restApi} />
        <ResultCard title="Custom Vehicles Endpoint" result={results.customEndpoint} />
        <ResultCard title="Comprehensive Test" result={results.comprehensive} />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Configuration Info</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>WordPress URL: <code className="bg-white px-2 py-1 rounded">{import.meta.env.VITE_WP_URL || 'https://env-uploadbackup62225-czdev.kinsta.cloud'}</code></div>
          <div>API Endpoint: <code className="bg-white px-2 py-1 rounded">/wp-json/custom/v1/vehicles</code></div>
          <div>Cache Stats: <code className="bg-white px-2 py-1 rounded">{JSON.stringify(wordpressCustomApi.getCacheStats())}</code></div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => wordpressCustomApi.clearCache()}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-white"
          >
            Clear API Cache
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If site connectivity fails, check the WordPress URL and ensure it's accessible</li>
          <li>• If REST API fails, ensure WordPress REST API is enabled</li>
          <li>• If custom endpoint fails, verify the custom API plugin is installed and activated</li>
          <li>• For CORS errors, configure WordPress to allow cross-origin requests</li>
          <li>• Check browser developer tools Network tab for detailed error information</li>
        </ul>
      </div>
    </div>
  );
}

export default WordPressApiDiagnostic;
