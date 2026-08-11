import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mountain, RouteHotspot } from '../../types';
import { Play, Pause, Sun, Moon, Eye, Layers, Compass, Snowflake, Cloud, Sparkles, RefreshCw } from 'lucide-react';

interface Mountain3DViewerProps {
  mountain: Mountain;
  activeHotspotId?: string;
  onHotspotClick?: (hotspot: RouteHotspot) => void;
  className?: string;
}

export type RenderMode = 'realistic' | 'wireframe' | 'heatmap' | 'satellite';
export type LightingMode = 'day' | 'golden' | 'dusk' | 'night';

export const Mountain3DViewer: React.FC<Mountain3DViewerProps> = ({
  mountain,
  activeHotspotId,
  onHotspotClick,
  className = 'h-[500px] w-full'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('realistic');
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [showSnowParticles, setShowSnowParticles] = useState<boolean>(true);
  const [showClouds, setShowClouds] = useState<boolean>(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<RouteHotspot | null>(null);

  // References to threejs components
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountainMeshRef = useRef<THREE.Mesh | null>(null);
  const snowParticlesRef = useRef<THREE.Points | null>(null);
  const cloudMeshRef = useRef<THREE.Group | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Mouse drag interaction
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0.5 });
  const zoomLevel = useRef(8);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'night' ? 0x050814 : 0x0b1120);

    // Fog for atmospheric depth
    scene.fog = new THREE.FogExp2(lightingMode === 'night' ? 0x050814 : 0x0b1120, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 4, zoomLevel.current);
    camera.lookAt(0, 0.5, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear element
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0001;
    directionalLightRef.current = dirLight;
    scene.add(dirLight);

    // 5. Generate Procedural Mountain Terrain Geometry
    const gridSegments = 120;
    const geometry = new THREE.PlaneGeometry(6, 6, gridSegments, gridSegments);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    // Procedural noise function for unique mountain profiles
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const distFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDist = Math.max(0, 1 - distFromCenter / 2.8);

      let height = 0;

      if (mountain.terrainType === 'pyramid') {
        // Matterhorn or K2 sharp pyramid
        const angle = Math.atan2(z, x);
        const pyramidFacets = Math.abs(Math.cos(angle * 2)) * 0.4 + 0.8;
        height = Math.pow(normalizedDist, 1.8) * 3.2 * mountain.peakSharpness * pyramidFacets;
        height += (Math.sin(x * 6) * Math.cos(z * 6) * 0.2 + Math.sin(x * 14) * 0.08) * mountain.roughness;
      } else if (mountain.terrainType === 'crater') {
        // Fuji / Etna stratovolcano with crater
        const craterRim = Math.sin(Math.min(Math.PI, normalizedDist * Math.PI)) * 2.5;
        const craterDip = distFromCenter < 0.4 ? (0.4 - distFromCenter) * 1.5 : 0;
        height = Math.max(0, craterRim - craterDip);
        height += Math.sin(x * 8 + z * 8) * 0.06 * mountain.roughness;
      } else if (mountain.terrainType === 'twin_peak') {
        // Denali / Elbrus twin summit domes
        const peak1 = Math.exp(-Math.pow(x - 0.4, 2) - Math.pow(z - 0.2, 2) * 2) * 2.8;
        const peak2 = Math.exp(-Math.pow(x + 0.5, 2) - Math.pow(z + 0.3, 2) * 2) * 2.5;
        const baseRidge = Math.pow(normalizedDist, 1.4) * 1.2;
        height = Math.max(baseRidge, peak1 + peak2) + Math.sin(x * 10) * Math.cos(z * 10) * 0.08 * mountain.roughness;
      } else if (mountain.terrainType === 'plateau_cone') {
        // Kilimanjaro / Kosciuszko broad volcano plateau
        height = Math.min(2.0, Math.pow(normalizedDist, 1.2) * 2.6);
        height += Math.sin(x * 5) * Math.cos(z * 5) * 0.12 * mountain.roughness;
      } else if (mountain.terrainType === 'sharp_spire') {
        // Fitz Roy / Matterhorn granite spire
        height = Math.pow(normalizedDist, 2.2) * 3.8;
        height += (Math.sin(x * 12) * Math.cos(z * 12) * 0.25) * mountain.roughness;
      } else {
        // Massive Ridge (Everest, Aconcagua, Annapurna)
        const ridgeEffect = Math.exp(-Math.pow(z - x * 0.3, 2) * 2) * normalizedDist * 2.8;
        height = ridgeEffect + Math.pow(normalizedDist, 1.5) * 1.5;
        height += (Math.sin(x * 7) * Math.cos(z * 7) * 0.18 + Math.sin(x * 15) * 0.06) * mountain.roughness;
      }

      posAttr.setY(i, height);

      // Color mapping for realistic terrain elevation
      const normHeight = height / 3.5;
      let color = new THREE.Color();

      if (normHeight < 0.25) {
        // Base rock / vegetation
        color.setHSL(0.1, 0.3, 0.2 + normHeight * 0.3);
      } else if (normHeight < mountain.snowLineRatio) {
        // Exposed granite / slate scree
        const rockLighter = 0.3 + (normHeight - 0.25) * 0.4;
        color.setRGB(rockLighter, rockLighter * 0.95, rockLighter * 0.9);
      } else {
        // Glacial snow cap
        const snowPurity = 0.85 + (normHeight - mountain.snowLineRatio) * 0.3;
        color.setRGB(snowPurity, snowPurity * 0.98, snowPurity * 1.0);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Material setup
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    const mountainMesh = new THREE.Mesh(geometry, material);
    mountainMesh.castShadow = true;
    mountainMesh.receiveShadow = true;
    mountainMeshRef.current = mountainMesh;
    scene.add(mountainMesh);

    // 6. Weather Snow Particles
    const snowCount = 400;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 8;
      snowPos[i * 3 + 1] = Math.random() * 5 + 0.5;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });

    const snowParticles = new THREE.Points(snowGeo, snowMat);
    snowParticlesRef.current = snowParticles;
    scene.add(snowParticles);

    // 7. Cloud Layer
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      transparent: true,
      opacity: 0.35,
      roughness: 1.0
    });

    for (let i = 0; i < 8; i++) {
      const cloudPuff = new THREE.Mesh(cloudGeo, cloudMat);
      const angle = (i / 8) * Math.PI * 2;
      cloudPuff.position.set(Math.cos(angle) * 2.2, 1.2 + Math.random() * 0.4, Math.sin(angle) * 2.2);
      cloudPuff.scale.set(1.5 + Math.random(), 0.6 + Math.random() * 0.4, 1.5 + Math.random());
      cloudGroup.add(cloudPuff);
    }
    cloudMeshRef.current = cloudGroup;
    scene.add(cloudGroup);

    // 8. 3D Route Hotspot Markers
    const hotspotGroup = new THREE.Group();
    hotspotGroupRef.current = hotspotGroup;

    mountain.hotspots.forEach((spot) => {
      const pinGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const isSummit = spot.type === 'summit';
      const isDanger = spot.type === 'hazard';

      const pinMat = new THREE.MeshBasicMaterial({
        color: isSummit ? 0xf59e0b : isDanger ? 0xef4444 : 0x3b82f6
      });

      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(spot.xRatio * 3, spot.yRatio * 3.5 + 0.2, spot.zRatio * 3);
      pinMesh.userData = { hotspot: spot };

      // Pulsing ring
      const ringGeo = new THREE.RingGeometry(0.1, 0.14, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSummit ? 0xfcd34d : 0x60a5fa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pinMesh.position);
      hotspotGroup.add(ringMesh);

      hotspotGroup.add(pinMesh);
    });

    scene.add(hotspotGroup);

    // 9. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotate && !isDragging.current) {
        rotation.current.y += 0.003;
      }

      if (mountainMeshRef.current) {
        mountainMeshRef.current.rotation.x = rotation.current.x;
        mountainMeshRef.current.rotation.y = rotation.current.y;
      }

      if (hotspotGroupRef.current) {
        hotspotGroupRef.current.rotation.x = rotation.current.x;
        hotspotGroupRef.current.rotation.y = rotation.current.y;
      }

      if (cloudMeshRef.current) {
        cloudMeshRef.current.rotation.y += 0.001;
      }

      // Animate snow particles
      if (snowParticlesRef.current) {
        const positions = snowParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < snowCount; i++) {
          let y = positions.getY(i);
          y -= 0.015;
          if (y < 0) y = 5;
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
  }, [mountain]);

  // Update Render Mode (Wireframe / Heatmap / Realistic)
  useEffect(() => {
    if (!mountainMeshRef.current) return;
    const mat = mountainMeshRef.current.material as THREE.MeshStandardMaterial;

    if (renderMode === 'wireframe') {
      mat.wireframe = true;
      mat.vertexColors = false;
      mat.color.setHex(0x38bdf8);
    } else {
      mat.wireframe = false;
      mat.vertexColors = true;
    }
  }, [renderMode]);

  // Update Lighting Mode
  useEffect(() => {
    if (!directionalLightRef.current || !ambientLightRef.current || !sceneRef.current) return;

    const dir = directionalLightRef.current;
    const amb = ambientLightRef.current;
    const scene = sceneRef.current;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color(0x0b1120);
      scene.fog = new THREE.FogExp2(0x0b1120, 0.035);
      dir.color.setHex(0xffffff);
      dir.intensity = 1.2;
      dir.position.set(5, 12, 7);
      amb.color.setHex(0xffffff);
      amb.intensity = 0.6;
    } else if (lightingMode === 'golden') {
      scene.background = new THREE.Color(0x1a0f1d);
      scene.fog = new THREE.FogExp2(0x1a0f1d, 0.035);
      dir.color.setHex(0xfb923c);
      dir.intensity = 1.5;
      dir.position.set(8, 4, 8);
      amb.color.setHex(0xfdba74);
      amb.intensity = 0.4;
    } else if (lightingMode === 'night') {
      scene.background = new THREE.Color(0x030712);
      scene.fog = new THREE.FogExp2(0x030712, 0.04);
      dir.color.setHex(0x818cf8);
      dir.intensity = 0.4;
      dir.position.set(-5, 8, -5);
      amb.color.setHex(0x1e1b4b);
      amb.intensity = 0.2;
    }
  }, [lightingMode]);

  // Mouse Orbit Drag Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotation.current.y += deltaX * 0.008;
    rotation.current.x = Math.max(-0.2, Math.min(1.2, rotation.current.x + deltaY * 0.008));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    zoomLevel.current = Math.max(4, Math.min(12, zoomLevel.current + e.deltaY * 0.005));
    cameraRef.current.position.z = zoomLevel.current;
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl">
      {/* 3D Canvas Canvas Container */}
      <div
        ref={containerRef}
        className={`${className} cursor-grab active:cursor-grabbing select-none`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating 3D Control Panel Header */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs text-white z-10 shadow-lg">
        {/* Render Modes */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
          <button
            onClick={() => setRenderMode('realistic')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${renderMode === 'realistic' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Realistic
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${renderMode === 'wireframe' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Wireframe
          </button>
        </div>

        {/* Lighting Modes */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
          <button
            onClick={() => setLightingMode('day')}
            title="Daytime Sun"
            className={`p-1.5 rounded-md transition-all ${lightingMode === 'day' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingMode('golden')}
            title="Golden Hour Sunset"
            className={`p-1.5 rounded-md transition-all ${lightingMode === 'golden' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingMode('night')}
            title="Night Stars"
            className={`p-1.5 rounded-md transition-all ${lightingMode === 'night' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Rotation & Reset */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`px-2 py-1 rounded-md flex items-center gap-1.5 transition-all ${isAutoRotate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Rotate</span>
          </button>
          <button
            onClick={() => {
              rotation.current = { x: 0.3, y: 0.5 };
              zoomLevel.current = 8;
              if (cameraRef.current) cameraRef.current.position.z = 8;
            }}
            title="Reset View Angle"
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Hotspots Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-xs text-slate-300 pointer-events-none sm:pointer-events-auto">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
          <Compass className="w-3 h-3 text-sky-400" /> Interactive 3D Route Pins
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {mountain.hotspots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => onHotspotClick?.(spot)}
              className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition-all border ${
                spot.type === 'summit'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : spot.type === 'hazard'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${spot.type === 'summit' ? 'bg-amber-400' : spot.type === 'hazard' ? 'bg-rose-400' : 'bg-sky-400'}`} />
              {spot.name} ({spot.altitudeMeters}m)
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Right Interaction Hint */}
      <div className="absolute bottom-4 right-4 z-10 text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Drag to Orbit • Scroll to Zoom
      </div>
    </div>
  );
};
