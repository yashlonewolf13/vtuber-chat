'use client';

import { useEffect, useState } from 'react';

export default function VRMExpressionCheck() {
  const [loading, setLoading] = useState(true);
  const [expressions, setExpressions] = useState([]);
  const [error, setError] = useState('');
  const [hasLipSync, setHasLipSync] = useState(false);

  useEffect(() => {
    const checkVRM = async () => {
      try {
        console.log('🔄 Loading VRM...');
        
        // Dynamic imports
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { VRMLoaderPlugin } = await import('@pixiv/three-vrm');
        
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
          '/models/avatar.vrm',
          (gltf) => {
            const vrm = gltf.userData.vrm;
            
            if (vrm && vrm.expressionManager) {
              const expMap = vrm.expressionManager.expressionMap;
              const expList = Object.keys(expMap);
              
              console.log('✅ VRM loaded!');
              console.log('📋 Expressions:', expList);
              
              setExpressions(expList);
              
              // Check for mouth expressions
              const mouthExpressions = ['aa', 'Aa', 'A', 'a', 'o', 'O', 'u', 'U', 'i', 'I', 'e', 'E'];
              const hasMouth = expList.some(exp => mouthExpressions.includes(exp));
              
              setHasLipSync(hasMouth);
              setLoading(false);
              
              if (hasMouth) {
                console.log('✅ This VRM supports lip-sync!');
              } else {
                console.log('❌ This VRM does NOT support lip-sync');
              }
            } else {
              setError('VRM loaded but has no expression manager');
              setLoading(false);
            }
          },
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
            console.log(`📥 Loading: ${percent}%`);
          },
          (err) => {
            console.error('❌ Error:', err);
            setError(err.message || 'Failed to load VRM');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('❌ Setup error:', err);
        setError(err.message || 'Failed to setup VRM loader');
        setLoading(false);
      }
    };

    checkVRM();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          VRM Lip-Sync Checker
        </h1>

        {loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading VRM model...</p>
            <p className="text-white/60 text-sm mt-2">Check console (F12) for progress</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6">
            <h2 className="text-red-300 text-xl font-bold mb-2">❌ Error</h2>
            <p className="text-white">{error}</p>
            <p className="text-white/60 text-sm mt-4">
              Make sure you have a VRM file at: <code className="bg-black/30 px-2 py-1 rounded">frontend/public/models/avatar.vrm</code>
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {hasLipSync ? (
              <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 mb-6">
                <h2 className="text-green-300 text-2xl font-bold mb-4">✅ Lip-Sync Supported!</h2>
                <p className="text-white mb-4">
                  Great news! Your VRM model has facial expressions and supports lip-sync.
                </p>
                <p className="text-white/80 text-sm">
                  The lip-sync feature should work in your main chat interface.
                </p>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6 mb-6">
                <h2 className="text-red-300 text-2xl font-bold mb-4">❌ Lip-Sync NOT Supported</h2>
                <p className="text-white mb-4">
                  Your VRM model does not have mouth/lip expressions. Lip-sync will not work with this model.
                </p>
                <div className="bg-black/30 rounded-xl p-4 mt-4">
                  <p className="text-white font-semibold mb-2">Solutions:</p>
                  <ul className="text-white/80 text-sm space-y-2">
                    <li>• Download a VRM with expressions from: <a href="https://hub.vroid.com/" target="_blank" className="text-blue-300 underline">hub.vroid.com</a></li>
                    <li>• Create a custom VRM with <a href="https://vroid.com/en/studio" target="_blank" className="text-blue-300 underline">VRoid Studio</a></li>
                    <li>• Use the voice feature without lip-sync animation</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white text-xl font-bold mb-4">
                Available Expressions ({expressions.length})
              </h3>
              {expressions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {expressions.map((exp) => {
                    const isMouth = ['aa', 'Aa', 'A', 'a', 'o', 'O', 'u', 'U', 'i', 'I', 'e', 'E'].includes(exp);
                    return (
                      <div
                        key={exp}
                        className={`px-3 py-2 rounded-lg font-mono text-sm ${
                          isMouth
                            ? 'bg-green-500/30 border border-green-400 text-green-200'
                            : 'bg-white/10 border border-white/20 text-white/80'
                        }`}
                      >
                        {exp}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/60 text-center py-4">No expressions found</p>
              )}
              
              {expressions.length > 0 && (
                <p className="text-white/60 text-xs mt-4 text-center">
                  Green = Mouth expressions (used for lip-sync)
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
