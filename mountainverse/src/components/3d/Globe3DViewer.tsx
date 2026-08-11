import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MOUNTAINS } from '../../data/mountains';
import { Mountain, Continent } from '../../types';
import { Globe, Compass, MapPin, Sparkles } from 'lucide-react';

interface Globe3DViewerProps {
  onSelectMountain: (mountain: Mountain) => void;
  onSelectContinent?: (continent: Continent) => void;
  className?: string;
}

export const Globe3DViewer: React.FC<Globe3DViewerProps> = ({
  onSelectMountain,
  onSelectContinent,
  className = 'h-[500px] w-full'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMountain, setSelectedMountain] = useState<Mountain | null>(null);
  const [hoveredMountain, setHoveredMountain] = useState<Mountain | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);

  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.2, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 7;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Sphere Earth Base
    const radius = 2.2;
    const earthGeo = new THREE.SphereGeometry(radius, 64, 64);

    // Procedural Shader-like texture for continents/oceans
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Deep Blue Ocean
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lat Long grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 32) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Simplified continent shapes
      ctx.fillStyle = '#1e3a8a';
      // Asia/Europe continent mass
      ctx.beginPath();
      ctx.ellipse(650, 180, 220, 120, 0, 0, Math.PI * 2);
      ctx.fill();
      // Africa
      ctx.beginPath();
      ctx.ellipse(550, 300, 100, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      // North America
      ctx.beginPath();
      ctx.ellipse(250, 180, 160, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      // South America
      ctx.beginPath();
      ctx.ellipse(320, 340, 90, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      // Australia
      ctx.beginPath();
      ctx.ellipse(820, 360, 90, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      // Antarctica
      ctx.beginPath();
      ctx.rect(0, 460, canvas.width, 50);
      ctx.fill();
    }

    const earthTex = new THREE.CanvasTexture(canvas);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.8,
      metalness: 0.2
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Outer Glow Atmosphere Ring
    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.08, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // Place 3D Mountain Pin Markers on Globe
    MOUNTAINS.forEach((m) => {
      // Convert lat/long to 3D Cartesian coordinates
      const phi = (90 - m.latitude) * (Math.PI / 180);
      const theta = (m.longitude + 180) * (Math.PI / 180);

      const x = -(radius * 1.02 * Math.sin(phi) * Math.cos(theta));
      const z = radius * 1.02 * Math.sin(phi) * Math.sin(theta);
      const y = radius * 1.02 * Math.cos(phi);

      // Pin Mesh
      const pinGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({
        color: m.isSevenSummit ? 0xf59e0b : 0x38bdf8
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(x, y, z);
      pinMesh.userData = { mountain: m };

      // Light Beam Stem
      const beamGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(x * 1.05, y * 1.05, z * 1.05);
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());

      globeGroup.add(pinMesh);
      globeGroup.add(beamMesh);
    });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging.current) {
        rotation.current.y += 0.002;
      }

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = rotation.current.x;
        globeGroupRef.current.rotation.y = rotation.current.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotation.current.y += deltaX * 0.008;
    rotation.current.x = Math.max(-1, Math.min(1, rotation.current.x + deltaY * 0.008));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-slate-950/90 border border-slate-800 shadow-2xl">
      <div
        ref={containerRef}
        className={`${className} cursor-grab active:cursor-grabbing select-none`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Floating Globe Title Overlay */}
      <div className="absolute top-4 left-4 z-10 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs text-slate-200">
        <div className="flex items-center gap-2 font-semibold text-sky-400">
          <Globe className="w-4 h-4 animate-spin-slow" /> 3D Interactive World Globe
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Spin the Earth to locate mountain hotspots</p>
      </div>

      {/* Peak Hotspots Quick Select Buttons */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-xs text-white">
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-amber-400" /> Featured 3D Hotspots:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOUNTAINS.slice(0, 6).map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMountain(m)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-500 hover:text-white transition-all text-[11px] font-medium border border-white/5 flex items-center gap-1"
            >
              {m.name} ({m.elevationMeters.toLocaleString()}m)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
