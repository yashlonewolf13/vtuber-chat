"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarStatus } from "@/hooks/useConversation";
import * as THREE from "three";

// VRM Type with expression manager for lip-sync
interface VRMType {
  scene: THREE.Group;
  update: (delta: number) => void;
  expressionManager?: {
    setValue: (name: string, value: number) => void;
  };
}

interface AvatarDisplayProps {
  status: "idle" | "thinking" | "speaking";
  isActive: boolean;
  audioElement?: HTMLAudioElement | null;
  onStart: () => void;
  onStop: () => void;
  conversationMode: "text" | "speech";
}

// VRM Avatar Component with Lip-Sync
function VRMAvatar({
  status,
  audioData,
  onLoaded,
}: {
  status: AvatarStatus;
  audioData: number;
  onLoaded: () => void;
}) {
  const [vrm, setVrm] = useState<VRMType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRMType | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadVRM = async () => {
      try {
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        const { VRMLoaderPlugin } = await import("@pixiv/three-vrm");

        const loader = new GLTFLoader();

        loader.register((parser) => {
          return new VRMLoaderPlugin(parser);
        });

        loader.load(
          "/models/avatar.vrm",
          (gltf) => {
            if (!isMounted) return;

            const vrmModel = gltf.userData.vrm as VRMType;

            if (vrmModel) {
              setVrm(vrmModel);
              vrmRef.current = vrmModel;
              onLoaded();
              console.log("✅ VRM loaded successfully");

              // Check if expression manager exists
              if (vrmModel.expressionManager) {
                console.log("✅ Expression manager available for lip-sync");
              } else {
                console.warn("⚠️ No expression manager - lip-sync disabled");
              }
            }
          },
          (progress) => {
            if (!isMounted) return;
            const percent = Math.round(
              (progress.loaded / progress.total) * 100
            );
            console.log(`Loading VRM: ${percent}%`);
          },
          (err) => {
            if (!isMounted) return;
            console.error("❌ Failed to load VRM:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error("❌ Error loading VRM libraries:", err);
        setError("Failed to load VRM libraries");
      }
    };

    loadVRM();

    return () => {
      isMounted = false;
    };
  }, [onLoaded]);

  // Animate mouth based on audio data
  useFrame((state, delta) => {
    if (vrmRef.current) {
      // Update VRM
      if (vrmRef.current.update) {
        vrmRef.current.update(delta);
      }

      // Lip-sync animation
      if (
        vrmRef.current.expressionManager &&
        status === "speaking" &&
        audioData > 0
      ) {
        // Map audio volume to mouth opening
        const mouthValue = Math.min(audioData * 2.5, 1.0);

        // Add natural variation
        const variation = Math.sin(state.clock.elapsedTime * 20) * 0.15;
        const finalValue = Math.max(0, Math.min(1, mouthValue + variation));

        // Set mouth expression (try 'aa' which is the mouth open expression)
        try {
          vrmRef.current.expressionManager.setValue("aa", finalValue);
        } catch (e) {
          // Expression might not exist, silently fail
        }
      } else if (vrmRef.current.expressionManager) {
        // Close mouth when not speaking
        try {
          vrmRef.current.expressionManager.setValue("aa", 0);
        } catch (e) {
          // Silently fail
        }
      }
    }
  });

  if (error) {
    console.error("VRM Error:", error);
    return null;
  }

  if (!vrm) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive
        object={vrm.scene}
        scale={3.5}
        position={[0, -3.8, 0]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

export default function AvatarDisplay({
  isActive,
  status,
  audioElement,
  onStart,
  onStop,
  conversationMode,
}: AvatarDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  const [vrmLoaded, setVrmLoaded] = useState(false);
  const [audioData, setAudioData] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAudioSetupRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-start/stop avatar based on conversation mode
  useEffect(() => {
    if (conversationMode === "speech" && !isActive) {
      console.log("🎵 Speech mode selected - auto-starting avatar");
      onStart();
    } else if (conversationMode === "text" && isActive) {
      console.log("📝 Text mode selected - auto-stopping avatar");
      onStop();
    }
  }, [conversationMode, isActive, onStart, onStop]);

  // One-Time Setup: Create audio context when audio element is available
  useEffect(() => {
    if (!audioElement) return;

    console.log("🎙️ AUDIO SETUP - Checking audio context...");

    // If we already have a working audio context, we're done
    if (audioContextRef.current && analyserRef.current && sourceRef.current) {
      console.log("✅ Audio context already setup and working");
      return;
    }

    // If this is the first time, create everything
    if (!isAudioSetupRef.current) {
      console.log("🎵 FIRST TIME - Creating audio context...");
      isAudioSetupRef.current = true;

      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        console.log(
          "📊 Creating MediaElementSource (can only be done ONCE)..."
        );
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        console.log("✅ Audio context ready - will work for ALL messages!");
        (window as any).audioContextForLipSync = audioContext;
      } catch (error) {
        console.error("❌ Error setting up audio context:", error);
        isAudioSetupRef.current = false;
      }
    }
    // NO cleanup - let audio context persist
  }, [audioElement]);

  // Listen for audio play events to trigger analysis
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => {
      console.log("🎵 Audio play detected - triggering re-check");
    };

    audioElement.addEventListener("play", handlePlay);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
    };
  }, [audioElement]);

  // Monitor status changes to start/stop audio analysis
  useEffect(() => {
    console.log("🔍 Status changed:", status);

    if (status === "speaking" && audioElement) {
      if (!analyserRef.current || !audioContextRef.current) {
        console.log("⚠️ Audio context not ready yet");
        return;
      }

      console.log("🎵 Starting audio analysis...");
      let animationFrameId: number;
      let frameCount = 0;

      const updateAudioData = () => {
        if (!analyserRef.current || status !== "speaking") {
          console.log("⏹️ Stopping analysis - status changed or no analyser");
          return;
        }

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = average / 255;

        frameCount++;
        if (frameCount === 1 || frameCount % 30 === 0) {
          console.log("📊 Setting audioData:", normalized.toFixed(3));
        }

        setAudioData(normalized);
        animationFrameId = requestAnimationFrame(updateAudioData);
      };

      updateAudioData();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        setAudioData(0);
      };
    } else {
      console.log("⏹️ Not speaking, stopping analysis");
      setAudioData(0);
    }
  }, [status, audioElement]);

  const getStatusText = () => {
    switch (status) {
      case "thinking":
        return "Thinking";
      case "speaking":
        return "Speaking";
      default:
        return isActive ? "Active" : "Ready";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "thinking":
        return "bg-yellow-500/80";
      case "speaking":
        return "bg-green-500/80";
      default:
        return isActive ? "bg-blue-500/80" : "bg-purple-500/80";
    }
  };

  return (
    <div
      className="bg-oshi-blue/40 backdrop-blur-lg border border-white/10 shadow-2xl flex flex-col"
      style={{
        width: "696px",
        height: "479px",
        borderRadius: "50px",
        paddingTop: "20px",
        paddingBottom: "20px",
        gap: "22px",
        maxWidth: "100%",
      }}
    >
      {/* Avatar Display Area */}
      <div className="flex-1 flex items-center justify-center px-5 overflow-hidden rounded-3xl bg-gradient-to-b from-purple-900/20 to-blue-900/20 relative">
        {isClient ? (
          <>
            <Canvas
              camera={{
                position: [0, 0.8, 1.8],
                fov: 30,
                near: 0.1,
                far: 1000,
              }}
              style={{ width: "100%", height: "100%" }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
            >
              <Suspense fallback={null}>
                {/* Enhanced Lighting Setup */}
                <ambientLight intensity={0.9} />
                <directionalLight position={[1, 2, 2]} intensity={1.5} />
                <directionalLight position={[-1, 2, 2]} intensity={1} />
                <pointLight position={[0, 1.5, 1.5]} intensity={0.6} />
                <spotLight
                  position={[0, 3, 1]}
                  intensity={0.4}
                  angle={0.3}
                  penumbra={1}
                />

                {/* VRM Avatar with Lip-Sync */}
                <VRMAvatar
                  status={status}
                  audioData={audioData}
                  onLoaded={() => setVrmLoaded(true)}
                />

                {/* Camera Controls - Very restricted for portrait mode */}
                <OrbitControls
                  enableZoom={true}
                  minDistance={1.5}
                  maxDistance={2.5}
                  enablePan={false}
                  minPolarAngle={Math.PI / 2.2}
                  maxPolarAngle={Math.PI / 1.9}
                  target={[0, 0.8, 0]}
                  enableDamping
                  dampingFactor={0.05}
                  maxAzimuthAngle={Math.PI / 8}
                  minAzimuthAngle={-Math.PI / 8}
                />
              </Suspense>
            </Canvas>

            {/* Loading Fallback */}
            <AnimatePresence>
              {!vrmLoaded && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-gradient-to-b from-purple-900/20 to-blue-900/20"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/70 text-sm font-medium">
                      Loading Avatar...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Indicator Overlay */}
            {vrmLoaded && (
              <div className="absolute top-6 left-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-4 py-2 ${getStatusColor()} backdrop-blur-md rounded-full border border-white/30 shadow-lg`}
                >
                  <span className="text-xs font-bold text-white">
                    {getStatusText()}
                  </span>
                </motion.div>
              </div>
            )}

            {/* Speaking Animation Indicator */}
            {status === "speaking" && vrmLoaded && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-6 bg-green-400 rounded-full"
                    animate={{
                      scaleY: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
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
                <p className="text-xs text-white/40 drop-shadow">
                  Drag to rotate • Scroll to zoom
                </p>
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Initializing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
