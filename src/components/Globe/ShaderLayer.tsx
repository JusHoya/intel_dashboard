import { useEffect, useRef } from 'react'
import { useCesium } from 'resium'
import { PostProcessStage, Cartesian2 } from 'cesium'
import { useGlobeStore } from '../../store/globe'
import { NVG_FRAGMENT_SHADER } from '../../shaders/nvg.glsl'
import { FLIR_FRAGMENT_SHADER } from '../../shaders/flir.glsl'
import { CRT_FRAGMENT_SHADER } from '../../shaders/crt.glsl'
import type { ShaderMode } from '../../shaders'

function getShaderSource(mode: ShaderMode): string | null {
  switch (mode) {
    case 'nvg': return NVG_FRAGMENT_SHADER
    case 'flir': return FLIR_FRAGMENT_SHADER
    case 'crt': return CRT_FRAGMENT_SHADER
    default: return null
  }
}

/**
 * Applies post-processing visual shaders to the Cesium globe scene.
 * Supports NVG (night vision), FLIR (thermal), and CRT modes.
 * Uses Cesium's PostProcessStage API with custom GLSL fragment shaders.
 */
export function ShaderLayer() {
  const shaderMode = useGlobeStore((s) => s.shaderMode)
  const { viewer } = useCesium()
  const stageRef = useRef<PostProcessStage | null>(null)
  const startTimeRef = useRef(Date.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    // Clean up previous shader
    if (stageRef.current) {
      try {
        viewer.scene.postProcessStages.remove(stageRef.current)
        stageRef.current.destroy()
      } catch { /* already cleaned up */ }
      stageRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    const shaderSource = getShaderSource(shaderMode)
    if (!shaderSource) return

    // Create the post-process stage
    const canvas = viewer.scene.canvas
    const stage = new PostProcessStage({
      fragmentShader: shaderSource,
      uniforms: {
        time: 0.0,
        resolution: new Cartesian2(canvas.width, canvas.height),
      },
    })

    viewer.scene.postProcessStages.add(stage)
    stageRef.current = stage
    startTimeRef.current = Date.now()

    // Animate time uniform
    function tick() {
      if (!stageRef.current || !viewer || viewer.isDestroyed()) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000.0
      stageRef.current.uniforms.time = elapsed

      // Update resolution if canvas resized
      const c = viewer.scene.canvas
      stageRef.current.uniforms.resolution = new Cartesian2(c.width, c.height)

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      if (stageRef.current) {
        try {
          if (!viewer.isDestroyed()) {
            viewer.scene.postProcessStages.remove(stageRef.current)
          }
          stageRef.current.destroy()
        } catch { /* already cleaned up */ }
        stageRef.current = null
      }
    }
  }, [shaderMode, viewer])

  return null
}
