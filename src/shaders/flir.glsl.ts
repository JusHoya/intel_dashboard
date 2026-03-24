/**
 * FLIR (Forward Looking Infrared) thermal imaging shader.
 *
 * Effects: luminance-to-thermal palette mapping (white-hot),
 * crosshair reticle, thermal diffusion blur, edge detection.
 */
export const FLIR_FRAGMENT_SHADER = `
  uniform sampler2D colorTexture;
  uniform float time;
  uniform vec2 resolution;
  in vec2 v_textureCoordinates;

  // Iron-bow thermal palette: black → blue → magenta → red → orange → yellow → white
  vec3 thermalPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    // 7-stop gradient
    vec3 c;
    if (t < 0.15) {
      c = mix(vec3(0.0, 0.0, 0.08), vec3(0.1, 0.0, 0.4), t / 0.15);
    } else if (t < 0.3) {
      c = mix(vec3(0.1, 0.0, 0.4), vec3(0.6, 0.0, 0.5), (t - 0.15) / 0.15);
    } else if (t < 0.45) {
      c = mix(vec3(0.6, 0.0, 0.5), vec3(0.9, 0.1, 0.1), (t - 0.3) / 0.15);
    } else if (t < 0.6) {
      c = mix(vec3(0.9, 0.1, 0.1), vec3(1.0, 0.5, 0.0), (t - 0.45) / 0.15);
    } else if (t < 0.8) {
      c = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.9, 0.2), (t - 0.6) / 0.2);
    } else {
      c = mix(vec3(1.0, 0.9, 0.2), vec3(1.0, 1.0, 1.0), (t - 0.8) / 0.2);
    }
    return c;
  }

  void main() {
    vec2 uv = v_textureCoordinates;
    vec2 texel = 1.0 / resolution;

    // Sample with slight blur (thermal diffusion)
    vec4 color = texture(colorTexture, uv) * 0.4;
    color += texture(colorTexture, uv + vec2(texel.x, 0.0)) * 0.15;
    color += texture(colorTexture, uv - vec2(texel.x, 0.0)) * 0.15;
    color += texture(colorTexture, uv + vec2(0.0, texel.y)) * 0.15;
    color += texture(colorTexture, uv - vec2(0.0, texel.y)) * 0.15;

    // Convert to luminance (simulated thermal reading)
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Enhance contrast
    lum = smoothstep(0.05, 0.85, lum);

    // Map to thermal palette
    vec3 thermal = thermalPalette(lum);

    // Edge detection (Sobel-like for thermal edges)
    float lumL = dot(texture(colorTexture, uv - vec2(texel.x * 2.0, 0.0)).rgb, vec3(0.3, 0.59, 0.11));
    float lumR = dot(texture(colorTexture, uv + vec2(texel.x * 2.0, 0.0)).rgb, vec3(0.3, 0.59, 0.11));
    float lumU = dot(texture(colorTexture, uv - vec2(0.0, texel.y * 2.0)).rgb, vec3(0.3, 0.59, 0.11));
    float lumD = dot(texture(colorTexture, uv + vec2(0.0, texel.y * 2.0)).rgb, vec3(0.3, 0.59, 0.11));
    float edge = abs(lumL - lumR) + abs(lumU - lumD);
    thermal += vec3(edge * 0.3);

    // Crosshair reticle
    vec2 center = abs(uv - 0.5);
    float crossH = step(center.y, 0.001) * step(center.x, 0.06);
    float crossV = step(center.x, 0.001) * step(center.y, 0.06);
    float cross = max(crossH, crossV);

    // Tick marks on crosshair
    float tickH = step(center.y, 0.004) * step(0.02, center.x) * step(center.x, 0.025);
    float tickV = step(center.x, 0.004) * step(0.02, center.y) * step(center.y, 0.025);
    float ticks = max(tickH, tickV);

    float reticle = max(cross, ticks);
    thermal = mix(thermal, vec3(0.0, 1.0, 0.0), reticle * 0.8);

    // Corner brackets
    float bx = step(0.46, abs(uv.x - 0.5)) * step(abs(uv.y - 0.5), 0.48) * step(0.44, abs(uv.y - 0.5));
    float by = step(0.44, abs(uv.y - 0.5)) * step(abs(uv.x - 0.5), 0.48) * step(0.46, abs(uv.x - 0.5));
    float bracket = max(bx, by);
    thermal = mix(thermal, vec3(0.0, 1.0, 0.0), bracket * 0.6);

    // Subtle noise
    float n = fract(sin(dot(uv + time * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
    thermal += (n - 0.5) * 0.03;

    // Vignette
    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    thermal *= clamp(vig, 0.3, 1.0);

    out_FragColor = vec4(thermal, 1.0);
  }
`
