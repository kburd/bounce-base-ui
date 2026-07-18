type Props = { onRetry: () => void }
export function ErrorState({ onRetry }: Props) {
  return <section className="state-card error-state" role="alert"><h2>Inventory could not be loaded</h2><p>Please check the Supabase configuration and try again.</p><button onClick={onRetry}>Retry</button></section>
}
