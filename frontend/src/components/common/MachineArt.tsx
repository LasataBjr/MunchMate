const colors = [
  '#e8553b', '#f2b632', '#3a9bd9', '#6bbf59',
  '#8e5bd6', '#e8553b', '#f28ab0', '#f2b632',
  '#3a9bd9', '#6bbf59', '#e8553b', '#8e5bd6',
]

function MachineArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 380" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="368" rx="105" ry="9" fill="#000" opacity=".18" />
      <rect width="240" height="360" rx="14" fill="#fff" />
      <rect x="16" y="16" width="150" height="270" rx="8" fill="#dbe4ea" />
      {[90, 170, 250].map((y) => (
        <rect key={y} x="22" y={y} width="138" height="4" rx="2" fill="#b8c2c9" />
      ))}
      {colors.map((color, i) => (
        <rect
          key={i}
          x={26 + (i % 4) * 35}
          y={34 + Math.floor(i / 4) * 80}
          width="31"
          height="56"
          rx="4"
          fill={color}
        />
      ))}
      <polygon points="16,16 80,16 16,120" fill="#fff" opacity=".4" />
      <rect x="178" y="16" width="46" height="270" rx="8" fill="#2a2a2e" />
      <rect x="184" y="26" width="34" height="22" rx="3" fill="#0d2a1a" />
      <rect x="188" y="34" width="26" height="3" rx="1.5" fill="#5dff9a" />
      <rect x="186" y="130" width="30" height="6" rx="3" fill="#0b0b0b" />
      <rect x="16" y="300" width="208" height="44" rx="8" fill="#2a2a2e" />
      <rect x="34" y="310" width="172" height="24" rx="5" fill="#0b0b0b" />
    </svg>
  )
}

export default MachineArt;