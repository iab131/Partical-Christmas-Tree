import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// --- Configuration ---
const CONFIG = {
  bloomStrength: 0.3,
  bloomRadius: 1,
  bloomThreshold: 0.01,
  treeHeight: 15,
  treeRadiusBottom: 6,
  treeRadiusTop: 0.0,
  treeTurns: 7,

  // Golden Particles
  particleCount: 3300,
  particleSize: 0.13,
  particleOpacity: 1.0,

  // Green Leaves
  leafCount: 3000,
  leafSize: 0.15,
  leafOpacity: 2,

  ornamentCount: 15,
  snowCount: 2000,

  // Colors
  colorGolden: new THREE.Color(0xffb347),
  colorGreen: new THREE.Color(0x1e7f43),
  colorBlue: new THREE.Color(0x0a1a3a),
  colorStar: new THREE.Color(0xf5f9ff),
  colorOrnament: new THREE.Color(0xeaf2ff),
  colorOrnament2: new THREE.Color(0xfff1d6), // Warm Gold/Cream secondary
  colorMagicBall: new THREE.Color(0xfff2cc),

  // Star Tweaks
  starSize: 0.5,
  starGlowIntensity: 1.0,
  starLongRayLen: 6.0,
  starLongRayWidth: 0.3,
  starShortRayLen: 3.0,
  starShortRayWidth: 0.2,
  starBlur: 0.5,

  // Magic Orb Tweaks
  magicOrbCount: 5,
  magicOrbSpeed: 0.3,
  magicOrbRadius: 8.0,
  magicOrbSize: 1,
  magicTrailSize: 0.4,
  magicTrailGravity: 5,
  magicTrailLife: 1.5,
  magicTrailDensity: 0.5,

  // Magic Trail Physics 
  trailUpwardForce: 1.0,
  trailInwardForce: 1.0,
  trailNoise: 1,

  // Ornament Tweaks
  ornamentOpacity: 0.1,     // Base visibility
  ornamentEdgeGlow: 0.6,    // Intensity of rim glow
  ornamentFresnelPower: 1, // Lower = Blus/Softer glow
}

// --- Scene Setup ---
const scene = new THREE.Scene()
scene.background = CONFIG.colorBlue
scene.fog = new THREE.FogExp2(CONFIG.colorBlue, 0.02)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 5, 20)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
document.querySelector('#app').appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.autoRotate = true
controls.autoRotateSpeed = 0.8
controls.minDistance = 5
controls.maxDistance = 30
controls.target.set(0, CONFIG.treeHeight / 2, 0)

// --- Helper Functions ---
function getSpiralPoint(t) {
  const angle = t * Math.PI * 2 * CONFIG.treeTurns
  const radius = THREE.MathUtils.lerp(CONFIG.treeRadiusBottom, CONFIG.treeRadiusTop, t)
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = t * CONFIG.treeHeight
  return new THREE.Vector3(x, y, z)
}

// --- Textures ---
const textureLoader = new THREE.TextureLoader()
const canvas = document.createElement('canvas')
canvas.width = 64
canvas.height = 64
const ctx = canvas.getContext('2d')
const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)')
grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
ctx.fillStyle = grad
ctx.fillRect(0, 0, 64, 64)
const particleTexture = new THREE.CanvasTexture(canvas)


// --- Tree: Particles (Golden Lights) ---
const particlesGeometry = new THREE.BufferGeometry()
const particlePositions = []

for (let i = 0; i < CONFIG.particleCount; i++) {
  const t = Math.random()
  if (t > 0.8 && Math.random() > 0.5) continue;
  if (t > 0.9 && Math.random() > 0.5) continue;

  const pointOnCurve = getSpiralPoint(t)
  const spread = 0.6 * (1 - t * 0.5)
  const randX = (Math.random() - 0.5) * spread
  const randY = (Math.random() - 0.5) * spread
  const randZ = (Math.random() - 0.5) * spread

  particlePositions.push(pointOnCurve.x + randX, pointOnCurve.y + randY, pointOnCurve.z + randZ)
}
particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3))

const particlesMaterial = new THREE.PointsMaterial({
  color: CONFIG.colorGolden,
  size: CONFIG.particleSize,
  map: particleTexture,
  transparent: true,
  opacity: CONFIG.particleOpacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})
const particlesSystem = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particlesSystem)

// --- Tree: Leaves (Green) ---
const leavesGeometry = new THREE.BufferGeometry()
const leafPositions = []

for (let i = 0; i < CONFIG.leafCount; i++) {
  const y = Math.random() * CONFIG.treeHeight
  const pct = y / CONFIG.treeHeight
  if (pct > 0.85 && Math.random() > 0.3) continue;

  const radiusAtHeight = THREE.MathUtils.lerp(CONFIG.treeRadiusBottom, CONFIG.treeRadiusTop, pct)
  const angle = Math.random() * Math.PI * 2
  const r = radiusAtHeight * (0.5 + 0.5 * Math.random())

  const x = Math.cos(angle) * r
  const z = Math.sin(angle) * r
  leafPositions.push(x, y, z)
}
leavesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leafPositions, 3))

const leavesMaterial = new THREE.PointsMaterial({
  color: CONFIG.colorGreen,
  size: CONFIG.leafSize,
  map: particleTexture,
  transparent: true,
  opacity: CONFIG.leafOpacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})
const leavesSystem = new THREE.Points(leavesGeometry, leavesMaterial)
scene.add(leavesSystem)


// --- Ornaments: Custom Shader with Edge Glow ---
const ornamentsGroup = new THREE.Group()
const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32)

const ornamentShaderMat = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: CONFIG.colorOrnament },
    baseOpacity: { value: CONFIG.ornamentOpacity },
    glowIntensity: { value: CONFIG.ornamentEdgeGlow },
    fresnelPower: { value: CONFIG.ornamentFresnelPower }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float baseOpacity;
    uniform float glowIntensity;
    uniform float fresnelPower;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      // Basic View Calc
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel
      float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);
      
      // Simple diffuse lighting simulation (fake light from top-right)
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diff = max(dot(normal, lightDir), 0.0);
      
      // Combine: Base Color + Fresnel Glow
      vec3 finalColor = color * (0.5 + diff * 0.5); // Base lit color
      finalColor += vec3(1.0) * fresnel * glowIntensity; // Add white glow
      
      // Alpha: Base Opacity + Fresnel Opacity
      float alpha = clamp(baseOpacity + fresnel * glowIntensity, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  side: THREE.FrontSide
})

// Create second material variety
const ornamentShaderMat2 = ornamentShaderMat.clone();
ornamentShaderMat2.uniforms = THREE.UniformsUtils.clone(ornamentShaderMat.uniforms);
ornamentShaderMat2.uniforms.color.value = CONFIG.colorOrnament2;

for (let i = 0; i < CONFIG.ornamentCount; i++) {
  const t = Math.random()
  const safeT = 0.1 + t * 0.75
  const point = getSpiralPoint(safeT)

  // Alternate materials
  const mat = (i % 2 === 0) ? ornamentShaderMat : ornamentShaderMat2;

  const mesh = new THREE.Mesh(sphereGeometry, mat)
  mesh.position.copy(point)
  mesh.position.x *= 1.2
  mesh.position.z *= 1.2
  const scale = Math.random() * 0.5 + 0.8
  mesh.scale.set(scale, scale, scale)
  ornamentsGroup.add(mesh)
}
scene.add(ornamentsGroup)


// --- STAR: Soft Billboarded Star ---
const starGroup = new THREE.Group()

function createSoftRay(length, width) {
  const geo = new THREE.PlaneGeometry(0.1, 1.0)
  const mat = new THREE.MeshBasicMaterial({
    color: CONFIG.colorStar,
    map: particleTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.scale.set(width * 10, length, 1.0)
  return mesh
}

// 1. Cardinal Rays
const cardinals = new THREE.Group()
for (let i = 0; i < 4; i++) {
  const ray = createSoftRay(CONFIG.starLongRayLen, CONFIG.starLongRayWidth)
  ray.rotation.z = i * (Math.PI / 2)
  cardinals.add(ray)
}
starGroup.add(cardinals)

// 2. Diagonal Rays
const diagonals = new THREE.Group()
for (let i = 0; i < 4; i++) {
  const ray = createSoftRay(CONFIG.starShortRayLen, CONFIG.starShortRayWidth)
  ray.rotation.z = (Math.PI / 4) + i * (Math.PI / 2)
  diagonals.add(ray)
}
starGroup.add(diagonals)

// Core Glow
const coreSpriteMat = new THREE.SpriteMaterial({
  map: particleTexture,
  color: CONFIG.colorStar,
  blending: THREE.AdditiveBlending
})
const coreSprite = new THREE.Sprite(coreSpriteMat)
coreSprite.scale.set(2, 2, 1)
starGroup.add(coreSprite)

starGroup.position.set(0, CONFIG.treeHeight, 0)
scene.add(starGroup)

const starLight = new THREE.PointLight(CONFIG.colorStar, 30, 20)
starLight.position.set(0, CONFIG.treeHeight, 0)
starLight.intensity = CONFIG.starGlowIntensity * 20
scene.add(starLight)


// --- Magic Orbiting Orbs + Spiral/Upward Trails ---
const orbGroup = new THREE.Group()
const orbs = []
const trailParticles = []
const MAX_TRAIL_PARTICLES = 2000

// Orb Geometry
const orbSpriteMat = new THREE.SpriteMaterial({
  map: particleTexture,
  color: CONFIG.colorMagicBall,
  blending: THREE.AdditiveBlending
})

for (let i = 0; i < CONFIG.magicOrbCount; i++) {
  const sprite = new THREE.Sprite(orbSpriteMat)
  sprite.scale.setScalar(CONFIG.magicOrbSize)

  // Random Orbit props
  const speed = CONFIG.magicOrbSpeed * (0.8 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1)
  const radius = CONFIG.magicOrbRadius
  const height = Math.random() * CONFIG.treeHeight
  const angle = Math.random() * Math.PI * 2
  const verticalSpeed = (Math.random() - 0.5) * 2.0

  orbGroup.add(sprite)
  orbs.push({ mesh: sprite, speed, radius, height, angle, verticalSpeed })
}
scene.add(orbGroup)

// Trail Geometry
const trailGeo = new THREE.BufferGeometry()
const trailPosArray = new Float32Array(MAX_TRAIL_PARTICLES * 3)
const trailOpacArray = new Float32Array(MAX_TRAIL_PARTICLES)

trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPosArray, 3))
trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailOpacArray, 1))

// Trail Shader
const trailMat = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: CONFIG.colorMagicBall },
  },
  vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = ${(CONFIG.magicTrailSize * 200).toFixed(1)} * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
  fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
            if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
            gl_FragColor = vec4(color, vAlpha);
        }
    `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
})
const trailSystem = new THREE.Points(trailGeo, trailMat)
scene.add(trailSystem)


// --- Lighting ---
const lightGroup = new THREE.Group()
const blueLight = new THREE.PointLight(0x8888ff, 20, 30)
blueLight.position.set(6, 8, 6)
lightGroup.add(blueLight)

const whiteLight = new THREE.PointLight(0xffffff, 20, 30)
whiteLight.position.set(-6, 5, -6)
lightGroup.add(whiteLight)
scene.add(lightGroup)


// --- Snow Particles ---
const snowGeometry = new THREE.BufferGeometry()
const snowPositions = []
const snowVelocities = []
for (let i = 0; i < CONFIG.snowCount; i++) {
  const x = (Math.random() - 0.5) * 50
  const y = Math.random() * 30
  const z = (Math.random() - 0.5) * 50
  snowPositions.push(x, y, z)
  snowVelocities.push(Math.random() * 0.04 + 0.01)
}
snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPositions, 3))

const snowMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.12,
  map: particleTexture,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})
const snowSystem = new THREE.Points(snowGeometry, snowMaterial)
scene.add(snowSystem)

// --- Post Processing ---
const renderScene = new RenderPass(scene, camera)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CONFIG.bloomStrength,
  CONFIG.bloomRadius,
  CONFIG.bloomThreshold
)
const composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

// --- Loop ---
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const elapsedTime = clock.getElapsedTime()
  const dt = 0.016;

  controls.update()

  // Star Billboard
  starGroup.lookAt(camera.position)

  // Animate Orbs & Random Trails
  orbs.forEach(orb => {
    orb.angle += orb.speed * dt
    orb.height += orb.verticalSpeed * dt
    if (orb.height > CONFIG.treeHeight + 2 || orb.height < 0) orb.verticalSpeed *= -1

    orb.mesh.position.x = Math.cos(orb.angle) * orb.radius
    orb.mesh.position.z = Math.sin(orb.angle) * orb.radius
    orb.mesh.position.y = orb.height

    // Spawn Trails
    const spawnCount = Math.floor(Math.random() * 3 * CONFIG.magicTrailDensity);
    for (let k = 0; k < spawnCount; k++) {
      trailParticles.push({
        x: orb.mesh.position.x + (Math.random() - 0.5) * 0.5,
        y: orb.mesh.position.y + (Math.random() - 0.5) * 0.5,
        z: orb.mesh.position.z + (Math.random() - 0.5) * 0.5,
        vy: 0,
        life: CONFIG.magicTrailLife * (0.5 + Math.random() * 0.5)
      })
    }
  })

  // Update Trail Physics: Upward Bias & Spiral Attraction
  let pIndex = 0;
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i]
    p.life -= dt
    if (p.life <= 0) {
      trailParticles.splice(i, 1)
    } else {
      // 1. Upward Bias (Lift)
      p.vy += CONFIG.trailUpwardForce * dt
      p.y += p.vy * dt

      // 2. Spiral/Inward Attraction
      // Vector to center (0, y, 0)
      const angle = Math.atan2(p.z, p.x)
      // Move towards center
      const radialIn = CONFIG.trailInwardForce * dt
      p.x -= Math.cos(angle) * radialIn
      p.z -= Math.sin(angle) * radialIn

      // 4. Subtle Noise (X/Z)
      p.x += (Math.random() - 0.5) * CONFIG.trailNoise * dt
      p.z += (Math.random() - 0.5) * CONFIG.trailNoise * dt

      if (pIndex < MAX_TRAIL_PARTICLES) {
        trailPosArray[pIndex * 3] = p.x
        trailPosArray[pIndex * 3 + 1] = p.y
        trailPosArray[pIndex * 3 + 2] = p.z
        trailOpacArray[pIndex] = p.life / CONFIG.magicTrailLife
        pIndex++
      }
    }
  }

  trailSystem.geometry.setDrawRange(0, pIndex)
  trailSystem.geometry.attributes.position.needsUpdate = true
  trailSystem.geometry.attributes.alpha.needsUpdate = true


  // Animate Snow
  const positions = snowSystem.geometry.attributes.position.array
  for (let i = 0; i < CONFIG.snowCount; i++) {
    let y = positions[i * 3 + 1]
    y -= snowVelocities[i]
    if (y < 0) {
      y = 30
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50
    }
    positions[i * 3 + 1] = y
  }
  snowSystem.geometry.attributes.position.needsUpdate = true

  // Tree rotation
  const treeRot = elapsedTime * 0.1
  particlesSystem.rotation.y = treeRot
  leavesSystem.rotation.y = treeRot

  // Rotating ornaments group? 
  // Wait, in previous step I had ornamentsGroup.rotation.y = treeRot. 
  // Let's ensure that matches.
  ornamentsGroup.rotation.y = treeRot

  // Pulse Star
  const pulse = Math.sin(elapsedTime * 2.5) * 0.1 + 1.0
  starGroup.scale.setScalar(CONFIG.starSize * pulse)

  // Lights rotation
  lightGroup.rotation.y = elapsedTime * -0.3

  composer.render()
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(window.innerWidth, window.innerHeight)
})

animate()
