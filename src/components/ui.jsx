const iconPaths = {
  dashboard: ['M4 13h6V4H4v9Z', 'M14 20h6v-7h-6v7Z', 'M14 10h6V4h-6v6Z', 'M4 20h6v-3H4v3Z'],
  tags: ['M20 13.5 13.5 20 4 10.5V4h6.5L20 13.5Z', 'M8 8h.01'],
  receipt: ['M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8v-17Z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  wallet: ['M4 6.5h15a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V6.5A2.5 2.5 0 0 1 6 4h10', 'M16 12h4.5', 'M16.5 12h.01'],
  activity: ['M3 12h4l2.2-6 4.1 12 2.2-6H21'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  logout: ['M10 5H5v14h5', 'M14 8l4 4-4 4', 'M18 12H9'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M4 17.5V20h2.5L18.8 7.7l-2.5-2.5L4 17.5Z', 'm14.8 6.2 2.5 2.5'],
  trash: ['M5 7h14', 'M10 11v5', 'M14 11v5', 'm7 7 .7 13h8.6L17 7', 'M9 7V4h6v3'],
  chevron: ['m7 10 5 5 5-5'],
  arrow: ['M5 12h13', 'm13 6 6 6-6 6'],
  calendar: ['M5 4v3', 'M19 4v3', 'M4 8h16', 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z'],
  search: ['m20 20-4.5-4.5', 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z'],
  alert: ['M12 4 21 20H3L12 4Z', 'M12 9v5', 'M12 17h.01'],
  check: ['m5 12 4 4L19 6'],
  copy: ['M8 8h10v12H8z', 'M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1'],
  settings: ['M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z', 'M19 13.5v-3l-2-.6a5.4 5.4 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a5.4 5.4 0 0 0-1.7-.7L11 2.5H8l-.6 2a5.4 5.4 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a5.4 5.4 0 0 0-.7 1.7l-2 .6v3l2 .6c.2.6.4 1.2.7 1.7l-.9 1.9 2.1 2.1 1.9-.9c.5.3 1.1.6 1.7.7l.6 2h3l.6-2a5.4 5.4 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9c.3-.5.6-1.1.7-1.7l2-.6Z'],
}

export function Icon({ name, size = 18, className = '' }) {
  const paths = iconPaths[name] ?? iconPaths.activity
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((path) => <path key={path} d={path} />)}
    </svg>
  )
}

export function PageHeader({ eyebrow, title, description, actions, meta, className = '' }) {
  return (
    <header className={`page-header ${className}`}>
      <div className="page-header-copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {(actions || meta) && <div className="page-header-actions">{meta}{actions}</div>}
    </header>
  )
}

export function AlertBanner({ title, children, action, tone = 'error' }) {
  return (
    <div className={`alert-banner alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon"><Icon name={tone === 'success' ? 'check' : tone === 'warning' ? 'alert' : 'alert'} size={17} /></span>
      <div className="alert-content">
        {title && <strong>{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon = 'receipt', title, children, action, className = '' }) {
  return (
    <section className={`empty-state ${className}`}>
      <span className="empty-state-icon"><Icon name={icon} size={22} /></span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  )
}

export function LoadingState({ label = 'Loading...' }) {
  return <div className="loading-state" role="status"><span className="loading-spinner" />{label}</div>
}
