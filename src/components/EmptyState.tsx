type Props = { title: string; message?: string; actionLabel?: string; onAction?: () => void }
export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return <section className="state-card"><h2>{title}</h2>{message && <p>{message}</p>}{actionLabel && onAction && <button onClick={onAction}>{actionLabel}</button>}</section>
}
