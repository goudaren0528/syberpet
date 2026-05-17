import { useStore } from '../store/state'

const shell = {
  position: 'absolute' as const,
  left: '50%',
  top: 56,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderRadius: 999,
  background: 'rgba(20,20,30,0.48)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
  zIndex: 110,
  pointerEvents: 'none' as const
}

const item = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  color: '#f3f4f6',
  fontSize: 9,
  lineHeight: 1,
  whiteSpace: 'nowrap' as const
}

const value = {
  minWidth: 18,
  textAlign: 'right' as const,
  opacity: 0.86,
  fontVariantNumeric: 'tabular-nums'
}

function Stat({ icon, valueText }: { icon: string; valueText: number }) {
  return (
    <div style={item}>
      <span>{icon}</span>
      <span style={value}>{Math.round(valueText)}</span>
    </div>
  )
}

export default function PetNeedsHUD() {
  const petNeeds = useStore((s) => s.petNeeds)

  return (
    <div style={shell}>
      <Stat icon="🍖" valueText={petNeeds.hunger} />
      <Stat icon="💛" valueText={petNeeds.mood} />
      <Stat icon="⚡" valueText={petNeeds.energy} />
    </div>
  )
}
