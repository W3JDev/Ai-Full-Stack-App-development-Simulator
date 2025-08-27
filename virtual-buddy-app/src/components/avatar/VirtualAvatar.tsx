'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Text, Billboard } from '@react-three/drei'
import { AvatarState } from '@/types'
import * as THREE from 'three'

interface Avatar3DProps {
  state: AvatarState
}

function AvatarMesh({ state }: Avatar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const eyesRef = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)

  // Animation based on avatar state
  useFrame(() => {
    if (meshRef.current) {
      // Gentle breathing animation
      meshRef.current.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.02
      
      // Slight head movement when listening
      if (state.isListening) {
        meshRef.current.rotation.y = Math.sin(Date.now() * 0.0015) * 0.1
      }
    }

    // Eye animations
    if (eyesRef.current) {
      if (state.emotion === 'thinking') {
        eyesRef.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.1
      } else if (state.emotion === 'happy') {
        eyesRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.05)
      }
    }

    // Mouth animations for speaking
    if (mouthRef.current && state.isSpeaking) {
      mouthRef.current.scale.x = 1 + Math.sin(Date.now() * 0.008) * 0.3
    }
  })

  const avatarColor = useMemo(() => {
    switch (state.emotion) {
      case 'happy': return '#4ade80'
      case 'concerned': return '#f59e0b'
      case 'thinking': return '#8b5cf6'
      case 'excited': return '#ef4444'
      default: return '#3b82f6'
    }
  }, [state.emotion])

  const getEmotionEmoji = () => {
    switch (state.emotion) {
      case 'happy': return '😊'
      case 'concerned': return '🤔'
      case 'thinking': return '💭'
      case 'excited': return '🎉'
      default: return '😌'
    }
  }

  return (
    <group ref={meshRef}>
      {/* Main head sphere */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={avatarColor} 
          transparent 
          opacity={0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </Sphere>

      {/* Eyes */}
      <group ref={eyesRef}>
        <Sphere args={[0.15, 16, 16]} position={[-0.3, 0.2, 0.8]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>
        <Sphere args={[0.15, 16, 16]} position={[0.3, 0.2, 0.8]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>
        {/* Pupils */}
        <Sphere args={[0.08, 16, 16]} position={[-0.3, 0.2, 0.85]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere args={[0.08, 16, 16]} position={[0.3, 0.2, 0.85]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
      </group>

      {/* Mouth */}
      <Sphere ref={mouthRef} args={[0.1, 16, 16]} position={[0, -0.3, 0.8]}>
        <meshStandardMaterial color="#ff69b4" />
      </Sphere>

      {/* Emotion indicator */}
      <Billboard position={[0, 1.5, 0]}>
        <Text
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {getEmotionEmoji()}
        </Text>
      </Billboard>

      {/* Status indicators */}
      {state.isListening && (
        <Billboard position={[-1.5, 0.5, 0]}>
          <Text
            fontSize={0.3}
            color="#4ade80"
            anchorX="center"
            anchorY="middle"
          >
            🎤 Listening...
          </Text>
        </Billboard>
      )}

      {state.isSpeaking && (
        <Billboard position={[1.5, 0.5, 0]}>
          <Text
            fontSize={0.3}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
          >
            🗣️ Speaking...
          </Text>
        </Billboard>
      )}

      {state.isTyping && (
        <Billboard position={[0, -1.5, 0]}>
          <Text
            fontSize={0.3}
            color="#8b5cf6"
            anchorX="center"
            anchorY="middle"
          >
            ⌨️ Typing...
          </Text>
        </Billboard>
      )}
    </group>
  )
}

interface VirtualAvatarProps {
  state: AvatarState
  className?: string
}

export function VirtualAvatar({ state, className = "" }: VirtualAvatarProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <AvatarMesh state={state} />
      </Canvas>
    </div>
  )
}