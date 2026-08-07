// A row of evenly-spaced perforations between dashboard sections, styled
// after actual 35mm film stock sprocket holes rather than a generic
// gradient rule or numbered divider. Pure CSS background pattern — no
// per-hole DOM nodes, so it costs nothing extra to render between every
// section.
export function SprocketDivider() {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className="my-8 h-3 w-full sm:my-10"
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-line) 2px, transparent 2.3px)",
        backgroundSize: "22px 100%",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
    />
  );
}
