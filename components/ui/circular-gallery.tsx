"use client";

import {
  Camera,
  Mesh,
  Plane,
  Program,
  Renderer,
  Texture,
  Transform,
  type OGLRenderingContext,
} from "ogl";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  image: string;
  text: string;
}

interface CircularGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: GalleryItem[];
  bend?: number;
  borderRadius?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  fontClassName?: string;
}

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: object) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof (instance as any)[key] === "function") {
      (instance as any)[key] = (instance as any)[key].bind(instance);
    }
  });
}

function createTextTexture(gl: OGLRenderingContext, text: string, font: string, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  gl: OGLRenderingContext; plane: Mesh; renderer: Renderer; text: string; textColor: string; font: string; mesh!: Mesh;
  constructor({ gl, plane, renderer, text, textColor, font }: any) {
    autoBind(this); this.gl = gl; this.plane = plane; this.renderer = renderer; this.text = text; this.textColor = textColor; this.font = font; this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragment: `precision highp float; uniform sampler2D tMap; varying vec2 vUv; void main() { vec4 color = texture2D(tMap, vUv); if (color.a < 0.1) discard; gl_FragColor = color; }`,
      uniforms: { tMap: { value: texture } }, transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    this.mesh.scale.set(textHeight * aspect, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  gl: OGLRenderingContext; geometry: Plane; image: string; index: number; length: number; renderer: Renderer; scene: Transform;
  screen: { width: number; height: number }; text: string; viewport: { width: number; height: number }; bend: number; textColor: string;
  borderRadius: number; font: string; program!: Program; plane!: Mesh; title!: Title; extra = 0; widthTotal = 0; width = 0; x = 0; scale = 1;
  padding = 2; speed = 0; isBefore = false; isAfter = false;
  constructor(opts: any) {
    Object.assign(this, opts);
    this.createShader(); this.createMesh(); this.createTitle(); this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false, depthWrite: false,
      vertex: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime; uniform float uSpeed; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragment: `precision highp float; uniform vec2 uImageSizes; uniform vec2 uPlaneSizes; uniform sampler2D tMap; uniform float uBorderRadius; varying vec2 vUv; float roundedBoxSDF(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b; return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r; } void main() { vec2 ratio = vec2(min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0), min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)); vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5); vec4 color = texture2D(tMap, uv); float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius); float alpha = 1.0 - smoothstep(-0.002, 0.002, d); gl_FragColor = vec4(color.rgb, alpha); }`,
      uniforms: { tMap: { value: texture }, uPlaneSizes: { value: [0, 0] }, uImageSizes: { value: [0, 0] }, uSpeed: { value: 0 }, uTime: { value: 100 * Math.random() }, uBorderRadius: { value: this.borderRadius } },
      transparent: true,
    });
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = this.image;
    img.onload = () => { texture.image = img; this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight]; };
  }
  createMesh() { this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program }); this.plane.setParent(this.scene); }
  createTitle() { this.title = new Title({ gl: this.gl, plane: this.plane, renderer: this.renderer, text: this.text, textColor: this.textColor, font: this.font }); }
  update(scroll: { current: number; last: number }, direction: "left" | "right") {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x; const H = this.viewport.width / 2;
    if (this.bend === 0) { this.plane.position.y = 0; this.plane.rotation.z = 0; } else {
      const B_abs = Math.abs(this.bend); const R = (H * H + B_abs * B_abs) / (2 * B_abs); const effectiveX = Math.min(Math.abs(x), H); const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) { this.plane.position.y = -arc; this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R); } else { this.plane.position.y = arc; this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R); }
    }
    this.speed = scroll.current - scroll.last; this.program.uniforms.uTime.value += 0.04; this.program.uniforms.uSpeed.value = this.speed;
    const planeOffset = this.plane.scale.x / 2; const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset; this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false; }
    if (direction === "left" && this.isAfter) { this.extra += this.widthTotal; this.isBefore = this.isAfter = false; }
  }
  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen; if (viewport) this.viewport = viewport;
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2; this.width = this.plane.scale.x + this.padding; this.widthTotal = this.width * this.length; this.x = this.width * this.index;
  }
}

class GalleryApp {
  container: HTMLElement; scrollSpeed: number; scroll: any; onCheckDebounce: () => void;
  renderer!: Renderer; gl!: OGLRenderingContext; camera!: Camera; scene!: Transform; planeGeometry!: Plane;
  mediasImages!: GalleryItem[]; medias!: Media[]; isDown = false; start = 0;
  screen!: { width: number; height: number }; viewport!: { width: number; height: number }; raf!: number;
  boundOnResize!: () => void; boundOnWheel!: (e: WheelEvent) => void; boundOnTouchDown!: (e: any) => void;
  boundOnTouchMove!: (e: any) => void; boundOnTouchUp!: () => void;
  constructor(container: HTMLElement, opts: any) {
    this.container = container; this.scrollSpeed = opts.scrollSpeed;
    this.scroll = { ease: opts.scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    autoBind(this); this.createRenderer(); this.createCamera(); this.createScene(); this.onResize();
    this.createGeometry(); this.createMedias(opts.items, opts.bend, opts.textColor, opts.borderRadius, opts.font);
    this.update(); this.addEventListeners();
  }
  createRenderer() { this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) }); this.gl = this.renderer.gl; this.gl.clearColor(0, 0, 0, 0); this.container.appendChild(this.gl.canvas); }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov = 45; this.camera.position.z = 20; }
  createScene() { this.scene = new Transform(); }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }); }
  createMedias(items: GalleryItem[] | undefined, bend: number, textColor: string, borderRadius: number, font: string) {
    const galleryItems = items && items.length > 0 ? items : []; this.mediasImages = [...galleryItems, ...galleryItems];
    this.medias = this.mediasImages.map((data, index) => new Media({ geometry: this.planeGeometry, gl: this.gl, image: data.image, index, length: this.mediasImages.length, renderer: this.renderer, scene: this.scene, screen: this.screen, text: data.text, viewport: this.viewport, bend, textColor, borderRadius, font }));
  }
  onTouchDown(e: any) { this.isDown = true; (this.scroll as any).position = this.scroll.current; this.start = e.touches ? e.touches[0].clientX : e.clientX; }
  onTouchMove(e: any) { if (!this.isDown) return; const x = e.touches ? e.touches[0].clientX : e.clientX; this.scroll.target = (this.scroll as any).position + (this.start - x) * (this.scrollSpeed * 0.025); }
  onTouchUp() { this.isDown = false; this.onCheck(); }
  onWheel(e: WheelEvent) { const d = e.deltaY || (e as any).wheelDelta || (e as any).detail; this.scroll.target += (d > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2; this.onCheckDebounce(); }
  onCheck() { if (!this.medias?.[0]) return; const w = this.medias[0].width; const i = Math.round(Math.abs(this.scroll.target) / w); this.scroll.target = this.scroll.target < 0 ? -(w * i) : w * i; }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180; const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    this.viewport = { width: height * this.camera.aspect, height };
    if (this.medias) this.medias.forEach((m) => m.onResize({ screen: this.screen, viewport: this.viewport }));
  }
  update() { this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease); const dir = this.scroll.current > this.scroll.last ? "right" : "left"; if (this.medias) this.medias.forEach((m) => m.update(this.scroll, dir)); this.renderer.render({ scene: this.scene, camera: this.camera }); this.scroll.last = this.scroll.current; this.raf = window.requestAnimationFrame(this.update); }
  addEventListeners() {
    this.boundOnResize = this.onResize; this.boundOnWheel = this.onWheel; this.boundOnTouchDown = this.onTouchDown; this.boundOnTouchMove = this.onTouchMove; this.boundOnTouchUp = this.onTouchUp;
    window.addEventListener("resize", this.boundOnResize); window.addEventListener("wheel", this.boundOnWheel);
    this.container.addEventListener("mousedown", this.boundOnTouchDown); window.addEventListener("mousemove", this.boundOnTouchMove); window.addEventListener("mouseup", this.boundOnTouchUp);
    this.container.addEventListener("touchstart", this.boundOnTouchDown); window.addEventListener("touchmove", this.boundOnTouchMove); window.addEventListener("touchend", this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize); window.removeEventListener("wheel", this.boundOnWheel);
    this.container.removeEventListener("mousedown", this.boundOnTouchDown); window.removeEventListener("mousemove", this.boundOnTouchMove); window.removeEventListener("mouseup", this.boundOnTouchUp);
    this.container.removeEventListener("touchstart", this.boundOnTouchDown); window.removeEventListener("touchmove", this.boundOnTouchMove); window.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer?.gl?.canvas?.parentNode) this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
  }
}

const CircularGallery = ({ items, bend = 3, borderRadius = 0.05, scrollSpeed = 2, scrollEase = 0.05, className, fontClassName, ...props }: CircularGalleryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const cs = getComputedStyle(containerRef.current);
    const app = new GalleryApp(containerRef.current, { items, bend, textColor: cs.color || "#fff", borderRadius, font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, scrollSpeed, scrollEase });
    return () => app.destroy();
  }, [items, bend, borderRadius, scrollSpeed, scrollEase, fontClassName]);
  return <div ref={containerRef} className={cn("w-full h-full overflow-hidden cursor-grab active:cursor-grabbing text-foreground font-bold text-[30px]", fontClassName, className)} {...props} />;
};

export { CircularGallery };
