/**
 * Night Vision Goggles (NVG) post-processing shader.
 *
 * Effects: green phosphor tint, brightness amplification,
 * film grain noise, vignette, subtle bloom.
 */
export const NVG_FRAGMENT_SHADER = `
  uniform sampler2D colorTexture;
  uniform float time;
  in vec2 v_textureCoordinates;

  // Pseudo-random hash
  float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
  }

  void main() {
    vec2 uv = v_textureCoordinates;
    vec4 color = texture(colorTexture, uv);

    // Convert to luminance (perceived brightness)
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Amplify brightness (image intensifier tube)
    lum = pow(lum, 0.7) * 1.6;
    lum = clamp(lum, 0.0, 1.0);

    // Green phosphor tint (P43 phosphor)
    vec3 nvgColor = vec3(lum * 0.1, lum * 1.0, lum * 0.15);

    // Film grain noise
    float grain = hash(uv * 800.0 + time * 50.0) * 0.12 - 0.06;
    nvgColor += grain;

    // Vignette (circular tube effect)
    vec2 center = uv - 0.5;
    float vignette = 1.0 - dot(center, center) * 2.2;
    vignette = clamp(vignette, 0.0, 1.0);
    vignette = smoothstep(0.0, 0.7, vignette);
    nvgColor *= vignette;

    // Subtle horizontal scan lines
    float scan = 0.95 + 0.05 * sin(uv.y * 1200.0);
    nvgColor *= scan;

    // Edge glow (bloom approximation on bright areas)
    float bloom = smoothstep(0.5, 1.0, lum) * 0.15;
    nvgColor += vec3(bloom * 0.05, bloom, bloom * 0.08);

    out_FragColor = vec4(nvgColor, 1.0);
  }
`
