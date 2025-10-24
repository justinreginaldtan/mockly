"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { LucideIcon, LucideProps } from "lucide-react"

interface OpticallyCenteredIconProps extends LucideProps {
  icon: LucideIcon
}

const initialOffset = { x: 0, y: 0 }

export function OpticallyCenteredIcon({
  icon: Icon,
  style,
  ...rest
}: OpticallyCenteredIconProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [offset, setOffset] = useState(initialOffset)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const updateOffset = () => {
      const viewBox = svg.viewBox.baseVal
      const hasViewBox = viewBox && viewBox.width && viewBox.height
      if (!hasViewBox) {
        setOffset(initialOffset)
        return
      }

      const renderedBox = svg.getBoundingClientRect()
      if (!renderedBox.width || !renderedBox.height) {
        setOffset(initialOffset)
        return
      }

      let geometryBox: DOMRect
      try {
        geometryBox = svg.getBBox()
      } catch {
        setOffset(initialOffset)
        return
      }

      const svgCenterX = viewBox.x + viewBox.width / 2
      const svgCenterY = viewBox.y + viewBox.height / 2
      const geometryCenterX = geometryBox.x + geometryBox.width / 2
      const geometryCenterY = geometryBox.y + geometryBox.height / 2

      const scaleX = renderedBox.width / viewBox.width
      const scaleY = renderedBox.height / viewBox.height

      setOffset({
        x: (svgCenterX - geometryCenterX) * scaleX,
        y: (svgCenterY - geometryCenterY) * scaleY,
      })
    }

    updateOffset()

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateOffset)
        : null

    resizeObserver?.observe(svg)

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateOffset)
    }

    return () => {
      resizeObserver?.disconnect()
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateOffset)
      }
    }
  }, [Icon])

  const translate = `translate(${offset.x}px, ${offset.y}px)`
  const mergedStyle: CSSProperties = {
    ...style,
    transform: style?.transform
      ? `${translate} ${style.transform}`
      : translate,
  }

  return <Icon ref={svgRef} style={mergedStyle} {...rest} />
}

