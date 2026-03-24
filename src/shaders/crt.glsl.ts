/**
 * CRT (Cathode Ray Tube) full emulation shader.
 *
 * Effects: barrel distortion, RGB sub-pixel rendering,
 * scanlines, phosphor glow, chromatic aberration, vignette, flicker.
 */
export const CRT_FRAGMENT_SHADER = `
  uniform sampler2D colorTexture;
  uniform float time;
  uniform vec2 resolution;
  in vec2 v_textureCoordinates;

  // Barrel distortion (curved screen)
  vec2 barrelDistort(vec2 uv, float amt) {
    vec2 cc = uv - 0.5;
    float dist = dot(cc, cc);
    return uv + cc * dist * amt;
  }

  void main() {
    vec2 uv = v_textureCoordinates;

    // Apply barrel distortion (curved CRT glass)
    vec2 distorted = barrelDistort(uv, 0.15);

    // Black out pixels outside the curved screen
    if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
      out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Chromatic aberration (slight RGB channel offset)
    float aberration = 0.002;
    vec2 dir = (distorted - 0.5) * aberration;
    float r = texture(colorTexture, distorted + dir).r;
    float g = texture(colorTexture, distorted).g;
    float b = texture(colorTexture, distorted - dir).b;
    vec3 color = vec3(r, g, b);

    // Boost green channel for phosphor effect
    color.g *= 1.1;

    // Scanline effect (every other pixel row)
    float scanlineY = distorted.y * resolution.y;
    float scanline = 0.88 + 0.12 * cos(scanlineY * 3.14159);
    color *= scanline;

    // RGB sub-pixel mask (vertical stripes simulating shadow mask)
    float subPixel = mod(distorted.x * resolution.x, 3.0);
    vec3 mask;
    if (subPixel < 1.0) {
      mask = vec3(1.0, 0.7, 0.7);
    } else if (subPixel < 2.0) {
      mask = vec3(0.7, 1.0, 0.7);
    } else {
      mask = vec3(0.7, 0.7, 1.0);
    }
    color *= mix(vec3(1.0), mask, 0.15);

    // Phosphor glow (bloom on bright areas)
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    float glow = smoothstep(0.4, 0.9, lum) * 0.08;
    color += vec3(glow * 0.3, glow, glow * 0.4);

    // Subtle flicker
    float flicker = 0.98 + 0.02 * sin(time * 8.0);
    color *= flicker;

    // Vignette (dark corners like CRT tube)
    vec2 vig = distorted * (1.0 - distorted);
    float vigAmount = vig.x * vig.y * 15.0;
    vigAmount = pow(clamp(vigAmount, 0.0, 1.0), 0.25);
    color *= vigAmount;

    // Slight overall green tint (P43 phosphor residue)
    color = mix(color, color * vec3(0.9, 1.05, 0.92), 0.3);

    out_FragColor = vec4(color, 1.0);
  }
`
