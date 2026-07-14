// Virtual Staging Studio Component
// Integrates React Three Fiber for 3D rendering

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Model {
  id: string;
  name: string;
  object: THREE.Group;
  position: [number, number, number];
}

interface VirtualStagingStudioProps {
  propertyId?: string;
}

export default function VirtualStagingStudio({ propertyId }: VirtualStagingStudioProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const sceneRef = useRef<THREE.Scene>(null!);

  // Load 3D models for Elephant furniture
  useEffect(() => {
    const loadModels = async () => {
      try {
        const elephantSofa = new THREE.Group();
        const sofaBase = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.5, 1),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        sofaBase.position.y = 0.25;
        elephantSofa.add(sofaBase);

        const sofaBack = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        sofaBack.position.set(0, 1, -0.25);
        elephantSofa.add(sofaBack);

        const elephantTable = new THREE.Group();
        const tableTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        tableTop.position.y = 0.5;
        elephantTable.add(tableTop);

        const tableLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        tableLeg.position.set(0, 0.25, 0);
        elephantTable.add(tableLeg);

        setModels([
          { id: 'elephant-sofa', name: 'Elephant Sofa', object: elephantSofa, position: [0, 0, 0] },
          { id: 'elephant-table', name: 'Elephant Table', object: elephantTable, position: [2, 0, 0] }
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load 3D models:', error);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Handle object placement in AR
  const handlePlaceObject = (model: Model) => {
    if (!model) return;
    console.log(`Placing ${model.name} in the scene`);
  };

  return (
    <div className="relative w-full h-[600px]">
      {/* 3D Canvas */}
      <Canvas
        style={{ height: '100%', width: '100%' }}
        camera={{ position: [0, 1.6, 3], fov: 60 }}
      >
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 7]} intensity={1} castShadow />

        {/* Grid helper for reference */}
        {!isLoading && (
          <gridHelper args={[10, 10]} />
        )}

        {/* 3D Models */}
        {!isLoading && models.map(model => (
          <primitive
            key={model.id}
            object={model.object}
            position={model.position}
            scale={[0.5, 0.5, 0.5]}
          />
        ))}

        {/* Controls */}
        <OrbitControls
          enableZoom
          enableRotate
          makeDefault
        />
      </Canvas>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-muted">Loading 3D models...</div>
        </div>
      )}
    </div>
  );
}