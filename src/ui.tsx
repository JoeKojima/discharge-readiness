import { useEffect, useRef, useState, type ReactNode } from "react"

export type IconName =
  | "activity" | "alert" | "arrow" | "bed" | "building" | "calendar" | "check"
  | "chevron" | "clock" | "close" | "document" | "dollar" | "home" | "logout"
  | "menu" | "message" | "more" | "patients" | "plus" | "search" | "settings"
  | "shield" | "sparkles" | "stethoscope" | "user" | "trash" | "send" | "login"
  | "flag" | "refresh" | "mic" | "stop" | "bolt"

const paths: Record<IconName, ReactNode> = {
  activity: (
    <>
      <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  arrow: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  bed: (
    <>
      <path d="M3 4v16m0-5h18v5M6 8h5a3 3 0 0 1 3 3v4H3V11a3 3 0 0 1 3-3Zm8 3h3a4 4 0 0 1 4 4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5l8-3 8 3v16M2 21h20M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  document: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </>
  ),
  dollar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8.5c-.8-1-2-1.5-4-1.5-2.2 0-3.5 1-3.5 2.5 0 3.8 7 1.5 7 5.2 0 1.4-1.2 2.3-3.5 2.3-1.8 0-3.2-.5-4-1.6M12 5v14" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  patients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 7a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3 7.7 7.5 9.5 4.5-1.8 7.5-5 7.5-9.5V6z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7ZM5 14l.7 1.3L7 16l-1.3.7L5 18l-.7-1.3L3 16l1.3-.7Z" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a5 5 0 0 0 10 0V3M4 3h4M14 3h4M11 13v2a5 5 0 0 0 10 0v-1" />
      <circle cx="21" cy="12" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  login: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5M15 12H3" />
    </>
  ),
  flag: <path d="M4 22V4m0 0h12l-2 4 2 4H4" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
}

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function ProgressRing({
  value,
  size = 132,
  label = "READY",
}: {
  value: number
  size?: number
  label?: string
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const small = size < 100
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e8eeec" strokeWidth={small ? 11 : 8} />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={readinessColor(value)}
          strokeWidth={small ? 11 : 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="text-center">
        <div
          className={`font-semibold tracking-tight text-[#133c33] ${small ? "text-[13px]" : "text-[30px]"}`}
        >
          {value}%
        </div>
        {!small && (
          <div className="text-[11px] font-medium text-slate-500">{label}</div>
        )}
      </div>
    </div>
  )
}

export function readinessColor(value: number) {
  if (value >= 65) return "#167a5b"
  if (value >= 45) return "#c98a1c"
  return "#c2553f"
}

export function ReadinessBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-[60px] overflow-hidden rounded-full bg-[#e7edeb]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: readinessColor(value) }}
        />
      </div>
      <span className="w-8 text-right text-[11px] font-semibold text-[#29463f]">
        {value}%
      </span>
    </div>
  )
}

export function Avatar({
  initials,
  color,
  size = 32,
  className = "",
}: {
  initials: string
  color: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-lg font-bold text-[#234a40] ${className}`}
      style={{ background: color, width: size, height: size, fontSize: size < 34 ? 10 : 11 }}
    >
      {initials}
    </div>
  )
}

export function UrgencyBadge({ urgency }: { urgency: "High" | "Medium" | "Low" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
        urgency === "High"
          ? "bg-[#fde5df] text-[#b64f3c]"
          : urgency === "Medium"
            ? "bg-[#fff0d3] text-[#976216]"
            : "bg-[#e7f1ee] text-[#55746b]"
      }`}
    >
      {urgency}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Ready for discharge": "bg-[#def0e9] text-[#176b54]",
    "Likely discharge today": "bg-[#fff0d6] text-[#9a6217]",
    "Likely tomorrow": "bg-[#e6edf8] text-[#4b6486]",
    "Not ready": "bg-[#fde6df] text-[#aa4d3d]",
  }
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] ?? "bg-[#eef1f0] text-[#667873]"}`}
    >
      {status}
    </span>
  )
}

export function Modal({
  title,
  subtitle,
  icon = "sparkles",
  onClose,
  children,
  footer,
  width = 620,
}: {
  title: string
  subtitle?: string
  icon?: IconName
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#112d27]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e7ecea] p-6">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e1f1ec] text-[#147157]">
              <Icon name={icon} size={20} />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[#173d34]">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-[11px] text-[#7b8b87]">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[#7a8a86] hover:bg-[#f0f4f2]"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="space-y-5 p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#e7ecea] bg-[#fafcfb] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export type MenuItem = {
  label: string
  icon?: IconName
  onSelect: () => void
  danger?: boolean
}

export function DropdownMenu({
  items,
  label = "More actions",
  icon = "more",
  className = "",
  buttonClassName = "rounded-lg p-1.5 text-[#90a09c] hover:bg-[#edf2f0]",
}: {
  items: MenuItem[]
  label?: string
  icon?: IconName
  className?: string
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={buttonClassName}
      >
        <Icon name={icon} size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-[#dce5e2] bg-white p-1.5 shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onSelect()
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium ${
                item.danger
                  ? "text-[#b64f3c] hover:bg-[#fdf0ec]"
                  : "text-[#3d554f] hover:bg-[#f0f5f3]"
              }`}
            >
              {item.icon && <Icon name={item.icon} size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PageHeader({
  crumb,
  title,
  subtitle,
  actions,
}: {
  crumb: string
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#6e807b]">
          <a href="#/" className="hover:text-[#184f41]">Workspace</a>
          <Icon name="chevron" size={12} />
          <span className="text-[#184f41]">{crumb}</span>
        </div>
        <h2 className="text-[27px] font-semibold tracking-[-.04em] text-[#173b33]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-[#70807c]">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
  )
}

export const card = "rounded-[18px] border border-[#dbe4e1] bg-white"
export const primaryBtn =
  "flex items-center justify-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(21,109,83,.18)] transition hover:bg-[#105b45] disabled:opacity-60"
export const secondaryBtn =
  "flex items-center justify-center gap-2 rounded-xl border border-[#cfe1db] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#176b54] hover:bg-[#edf6f2]"
export const inputCls =
  "w-full rounded-xl border border-[#d9e3e0] bg-white px-3 py-2.5 text-[12px] text-[#29463f] outline-none transition focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"
export const labelCls = "mb-1.5 block text-[11px] font-semibold text-[#385149]"
