'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarStatus } from '@/hooks/useConversation';
import * as THREE from 'three';

// VRM Type
interface VRMType {
  scene: THREE.Group;
  update: (delta: number) => void;
}

interface AvatarDisplayProps {
  isActive: boolean;
  status: AvatarStatus;
  onStart: () => void;
  onStop: () => void;
}

// VRM Avatar Component
function VRMAvatar({ 
  status, 
  onLoaded 
}: { 
  status: AvatarStatus;
  onLoaded: () => void;
}) {
  const [vrm, setVrm] = useState<VRMType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let isMounted = true;

    const loadVRM = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { VRMLoaderPlugin } = await import('@pixiv/three-vrm');

        const loader = new GLTFLoader();
        
        loader.register((parser) => {
          return new VRMLoaderPlugin(parser);
        });

        loader.load(
          '/models/avatar.vrm',
          (gltf) => {
            if (!isMounted) return;
            
            const vrm = gltf.userData.vrm as VRMType;
            
            if (vrm) {
              setVrm(vrm);
              onLoaded(); // ✅ Notify parent that VRM is loaded
              console.log('✅ VRM loaded successfully');
            }
          },
          (progress) => {
            if (!isMounted) return;
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Loading VRM: ${percent}%`);
          },
          (err) => {
            if (!isMounted) return;
            console.error('❌ Failed to load VRM:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Error loading VRM libraries:', err);
        setError('Failed to load VRM libraries');
      }
    };

    loadVRM();

    return () => {
      isMounted = false;
    };
  }, [onLoaded]);

  useFrame((state, delta) => {
    if (vrm && vrm.update) {
      vrm.update(delta);
    }
  });

  if (error) {
    console.error('VRM Error:', error);
    return null;
  }

  if (!vrm) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive 
        object={vrm.scene} 
        scale={1.5}
        position={[0, -1, 0]}
      />
    </group>
  );
}

// Fallback Component (only shows while loading)
function AvatarFallback({ status, show }: { status: AvatarStatus; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-oshi-bright-blue to-oshi-accent"
              animate={{
                scale: status === 'speaking' ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: status === 'speaking' ? Infinity : 0,
              }}
            />
            <p className="text-xl font-bold text-oshi-blue">Loading Avatar...</p>
            <p className="text-sm text-gray-500 mt-2">
              {status === 'idle' && 'Ready to chat'}
              {status === 'thinking' && 'Thinking...'}
              {status === 'speaking' && 'Speaking...'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AvatarDisplay({ isActive, status, onStart, onStop }: AvatarDisplayProps) {
  const [vrmLoaded, setVrmLoaded] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 lg:px-12">
      {/* Avatar Container */}
      <motion.div
        className="relative w-full max-w-lg aspect-video bg-gradient-to-br from-white to-gray-100 rounded-3xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 3D VRM Avatar Canvas */}
        <Canvas
          camera={{ position: [0, 0.5, 5], fov: 50 }}
          style={{ 
            background: 'linear-gradient(to bottom right, #ffffff, #f3f4f6)',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 3, -5]} intensity={0.4} />
          <pointLight position={[0, 2, 0]} intensity={0.3} />
          
          {/* VRM Avatar */}
          <Suspense fallback={null}>
            <VRMAvatar 
              status={status} 
              onLoaded={() => setVrmLoaded(true)} 
            />
          </Suspense>
          
          {/* Camera Controls */}
          <OrbitControls 
            enableZoom={true}
            minDistance={3}
            maxDistance={7}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            target={[0, 0.5, 0]}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Fallback UI - Only shows while loading */}
        <AvatarFallback status={status} show={!vrmLoaded} />

        {/* Status Indicator */}
        {status !== 'idle' && vrmLoaded && (
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 'thinking' ? 'bg-yellow-500' : 'bg-green-500'
              } text-white shadow-lg`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {status === 'thinking' ? '🤔 Thinking' : '🗣️ Speaking'}
            </motion.div>
          </div>
        )}

        {/* Instructions - Only show after loaded */}
        {vrmLoaded && (
          <motion.div 
            className="absolute bottom-4 left-0 right-0 text-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-gray-400 drop-shadow">
              Drag to rotate • Scroll to zoom
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Control Buttons */}
      <div className="flex gap-4 mt-8">
        <motion.button
          onClick={onStart}
          disabled={isActive}
          className={`px-8 py-3 rounded-full font-bold text-white transition-all ${
            isActive
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-oshi-bright-blue hover:bg-blue-600 shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isActive ? { scale: 1.05 } : {}}
          whileTap={!isActive ? { scale: 0.95 } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            start avatar
          </span>
        </motion.button>

        <motion.button
          onClick={onStop}
          disabled={!isActive}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            !isActive
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700 shadow-lg'
          }`}
          whileHover={isActive ? { scale: 1.05 } : {}}
          whileTap={isActive ? { scale: 0.95 } : {}}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" />
            </svg>
            stop avatar
          </span>
        </motion.button>
      </div>
    </div>
  );
}
