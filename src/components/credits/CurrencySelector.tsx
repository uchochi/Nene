import { useState, useRef, useEffect } from 'react'

interface CurrencyOption {
  code: string
  symbol: string
  name: string
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$',    name: 'US Dollar' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso' },
  { code: 'COP', symbol: 'COL$',name: 'Colombian Peso' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩',   name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
]

interface CurrencySelectorProps {
  selected: string
  onChange: (code: string) => void
}

export function CurrencySelector({ selected, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = CURRENCIES.find(c => c.code === selected) || CURRENCIES[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="currency-wrapper" ref={ref}>
      <span className="currency-label">CURRENCY</span>
      <div
        className="currency-selector"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open) } }}
      >
        <div className="currency-icon">{current.symbol}</div>
        <span className="currency-text">{current.name}</span>
        <div className="dropdown-arrow" />
      </div>

      {open && (
        <div className="currency-dropdown">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              className={`currency-option ${c.code === selected ? 'active' : ''}`}
              onClick={() => { onChange(c.code); setOpen(false) }}
            >
              <span className="currency-option-symbol">{c.symbol}</span>
              <span className="currency-option-text">
                <span className="currency-option-name">{c.name}</span>
                <span className="currency-option-code">{c.code}</span>
              </span>
              {c.code === selected && <span className="currency-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
