import { useMemo } from "react";
import { GradientBackground as RGA } from "react-gradient-animation";

export function GradientBackground() {
  const content = useMemo(() => (
    <RGA
      skew={0}
      blending="overlay"
      colors={{
        background: "blue",
        particles: ["#00897b", "#7f00ff", "#3b82f6"],
      }}
      speed={{ x: { min: 0.5, max: 2 }, y: { min: 0.5, max: 2 } }}
    />
  ), []);

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      opacity: 0,
      animation: "bgFadeIn 1.5s ease forwards",
      zIndex: 0,
    }}>
      {content}
      <style>{`
        @keyframes bgFadeIn {
          to { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
