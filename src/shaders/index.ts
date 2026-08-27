/**
 * Fresnel atmosphere shell.
 *
 * Rendered as a slightly larger back-face sphere around the planet. The rim
 * term is the classic fresnel `1 - dot(normal, viewDir)` raised to a power,
 * multiplied by a sun-facing term so the limb only glows where it is actually
 * lit - otherwise the night side gets an unphysical halo.
 */
export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunPosition;
  uniform float uIntensity;
  uniform float uPower;

  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 normal = normalize(vNormalW);

    // Back faces are rendered, so flip the normal towards the viewer.
    float rim = 1.0 - abs(dot(normal, viewDir));
    rim = pow(clamp(rim, 0.0, 1.0), uPower);

    vec3 sunDir = normalize(uSunPosition - vPositionW);
    // Allow a little wrap past the terminator so the limb fades smoothly
    // instead of cutting off in a hard line.
    float sunFacing = clamp(dot(normal, sunDir) * 0.5 + 0.5, 0.0, 1.0);
    sunFacing = pow(sunFacing, 1.6);

    float alpha = rim * sunFacing * uIntensity;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

/**
 * Sun surface: animated granulation plus a limb-darkening term, which is what
 * gives a real star its slightly darker, redder edge.
 */
export const sunVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const sunFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColorHot;
  uniform vec3 uColorCool;
  uniform float uTime;

  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;

  // Cheap value noise - enough to make the granulation shimmer without a
  // texture fetch per octave.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 base = texture2D(uMap, vUv).rgb;

    float n = noise(vUv * 90.0 + vec2(uTime * 0.02, uTime * 0.013));
    n += 0.5 * noise(vUv * 180.0 - vec2(uTime * 0.03, 0.0));
    n = n / 1.5;

    vec3 color = mix(uColorCool, uColorHot, clamp(n * 0.85 + 0.25, 0.0, 1.0));
    color *= 0.55 + base * 1.1;

    // Limb darkening: the edge of the disc is cooler and dimmer.
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float mu = clamp(dot(normalize(vNormalW), viewDir), 0.0, 1.0);
    float limb = 0.42 + 0.58 * pow(mu, 0.55);

    gl_FragColor = vec4(color * limb, 1.0);
  }
`;

/**
 * Corona / glow billboard drawn behind the Sun with additive blending.
 * A simple inverse-power falloff reads far better than a gaussian here because
 * it keeps a bright core while still reaching a long way out.
 */
export const glowVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFalloff;
  varying vec2 vUv;

  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    if (d > 1.0) discard;
    float glow = pow(1.0 - d, uFalloff);
    gl_FragColor = vec4(uColor * glow * uIntensity, glow);
  }
`;
