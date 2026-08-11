import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Hero3DCanvasProps {
  timeOfDay?: number; // 0 (midnight) to 24 (noon)
  className?: string;
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({
  timeOfDay = 14,
  className = 'absolute inset-0 z-0'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070d19);
    scene.fog = new THREE.FogExp2(0x070d19, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfba518, 1.4);
    sunLight.position.set(10, 15, 10);
    scene.add(sunLight);

    // Multiple Mountain Range Meshes (Foreground, Midground, Background)
    const createMountainRidge = (zPos: number, heightScale: number, colorHex: number) => {
      const segs = 80;
      const geo = new THREE.PlaneGeometry(30, 8, segs, 20);
      geo.rotateX(-Math.PI / 2.5);

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * heightScale +
                      Math.sin(x * 1.5) * 0.5 * heightScale;
        pos.setZ(i, Math.max(0, noise));
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.9,
        flatShading: true
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, -1, zPos);
      return mesh;
    };

    const bgRidge = createMountainRidge(-10, 5, 0x1e293b);
    const midRidge = createMountainRidge(-4, 3.5, 0x0f172a);
    const fgRidge = createMountainRidge(2, 2, 0x020617);

    scene.add(bgRidge);
    scene.add(midRidge);
    scene.add(fgRidge);

    // Drifting Snow Flakes
    const snowCount = 500;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 30;
      snowPos[i * 3 + 1] = Math.random() * 10;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.7
    });

    const snowPoints = new THREE.Points(snowGeo, snowMat);
    scene.add(snowPoints);

    // Animation Loop
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.005;

      // Subtle camera pan
      camera.position.x = Math.sin(time * 0.5) * 0.8;
      camera.lookAt(0, 2, 0);

      // Animate snow
      const positions = snowGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < snowCount; i++) {
        let y = positions.getY(i);
        let x = positions.getX(i);
        y -= 0.02;
        x += Math.sin(time + i) * 0.005;
        if (y < -2) y = 10;
        positions.setY(i, y);
        positions.setX(i, x);
      }
      positions.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};
