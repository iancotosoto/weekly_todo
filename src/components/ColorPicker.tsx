import { useState } from 'react'
import { BASIC_COLORS } from '../lib/colors'
import { useStore } from '../lib/store'

interface Props {
  value: string
  onChange: (hex: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  const customColors = useStore((s) => s.customColors)
  const addCustomColor = useStore((s) => s.addCustomColor)
  const removeCustomColor = useStore((s) => s.removeCustomColor)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [pending, setPending] = useState('#6366f1')

  const swatch = (hex: string, custom: boolean) => (
    <button
      key={hex}
      className={'sw' + (value.toLowerCase() === hex ? ' on' : '')}
      style={{ background: hex }}
      aria-label={hex}
      onClick={() => (custom && removing ? removeCustomColor(hex) : onChange(hex))}
    >
      {custom && removing && <span className="sw-x">×</span>}
    </button>
  )

  return (
    <div className="picker">
      <div className="swatches">{BASIC_COLORS.map((c) => swatch(c, false))}</div>

      <div className="picker-head">
        <span>Mis colores</span>
        {customColors.length > 0 && (
          <button className="link" onClick={() => setRemoving(!removing)}>
            {removing ? 'Listo' : 'Quitar'}
          </button>
        )}
      </div>
      <div className="swatches">
        {customColors.map((c) => swatch(c, true))}
        <button className="sw plus" aria-label="Agregar color" onClick={() => setAdding(!adding)}>+</button>
      </div>

      {adding && (
        <div className="inline picker-add">
          <input type="color" className="colorin" value={pending} onChange={(e) => setPending(e.target.value)} />
          <button
            className="btn"
            onClick={() => {
              addCustomColor(pending)
              onChange(pending.toLowerCase())
              setAdding(false)
            }}
          >
            Guardar y usar
          </button>
        </div>
      )}
    </div>
  )
}
