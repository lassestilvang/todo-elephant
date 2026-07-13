// Virtual Staging Studio Component - Enhanced with AR/VR capabilities
// Integrates React Three Fiber for 3D rendering and WebXR for AR/VR support

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { XRController, XRHandPrimitiveModel, XRButton } from '@react-three/xr';
import * as THREE from 'three';

const VirtualStagingStudio = ({ propertyId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const sceneRef = useRef(null);

  // Load 3D models for Elephant furniture
  useEffect(() => {
    const loadModels = async () => {
      try {
        // In a real implementation, this would fetch from a model API or load GLTF/GLB files
        // For now, we'll create placeholder geometries
        const elephantSofa = new THREE.Group();
        const sofaBase = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.5, 1),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 }) // Saddle brown
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
          { id: 'elephant-table', name: 'Elephant Table', object: elephantTable, position: [0, 0, 0] }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load 3D models:', error);
        setIsLoading(false);
      }
    };

    if (propertyId) {
      loadModels();
    }
  };

  // Handle object placement in AR
  const handlePlaceObject = (model) => {
    if (!model) return;

    // Clone the model for placement in the scene
    const clonedObject = model.object.clone();
    clonedObject.position.set(...model.position);
    clonedObject.userData = {
      id: model.id,
      name: model.name,
      isPlaced: true
    };

    // Add to scene (in a real implementation, we'd use a proper state management approach)
    // This is simplified for demonstration
    console.log(`Placing ${model.name} in the scene`);
  };

  return (
    <div className="relative w-full h-[600px]">
      {/* XR Button for entering AR/VR mode */}
      <XRButton
        buttonStyle="flat"
        onSessionStarted={() => console.log('XR Session started')}
        onSessionEnded={() => console.log('XR Session ended')}
      >
        Enter AR/VR
      </XRButton>

      {/* 3D Canvas */}
      <Scene
        models={models}
        selectedModel={selectedModel}
        onPlaceObject={handlePlaceObject}
        isLoading={isLoading}
        sceneRef={sceneRef}
      />

      {/* Controls Panel */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className={`flex-1 px-3 py-2 bg-${selectedModel?.id === model.id ? 'accent' : 'muted'}/20 text-${selectedModel?.id === model.id ? 'white' : 'foreground'}
                       rounded transition-colors hover:bg-${selectedModel?.id === model.id ? 'accent' : 'muted'}/30`}
          >
            {model.name}
          </button>
        ))}
        {!isLoading && selectedModel && (
          <button
            onClick={() => handlePlaceObject(selectedModel)}
            className="flex-1 px-3 py-2 bg-green-500/20 text-green-500 rounded transition-colors hover:bg-green-500/30"
          >
            Place in Space
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-muted">Loading 3D models...</div>
        </div>
      )}
    </div>
  );
};

// Reusable Scene component
const Scene = ({ models, selectedModel, onPlaceObject, isLoading, sceneRef }) => {
  const ref = useRef();

  // Update ref when provided
  useEffect(() => {
    if (sceneRef) {
      sceneRef.current = ref.current;
    }
  }, [sceneRef]);

  return (
    <Canvas
      ref={ref}
      style={{ height: '100%', width: '100%' }}
      camera={{ position: [0, 1.6, 3], fov: 60 }}
    >
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 7]} intensity={1} castShadow />

      {/* XR Controller for hand tracking and input */}
      <XRController>
        {(props) => (
          <primitive object={props} />
          <XRHandPrimitiveModel {...props} />
        )}
      </XRController>

      {/* Grid helper for reference */}
      {!isLoading && (
        <gridHelper args={[10, 10]} color="#444" opacity={0.2} />
      )}

      {/* 3D Models */}
      {!isLoading && models.map(model => (
        <key key={model.id}>
          <primitive
            object={model.object}
            position={model.position}
            scale={[0.5, 0.5, 0.5]}
          />
        </key>
      ))}

      {/* Controls */}
      <OrbitControls
        enableZoom
        enableRotate
        makeDefault
      />
    </Canvas>
  );
};

export default VirtualStagingStudio;