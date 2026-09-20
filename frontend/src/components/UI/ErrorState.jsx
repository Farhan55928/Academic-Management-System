export default function ErrorState({ title = "Couldn't load this", description, onRetry, retrying }) {
  return (
    <div className="error-state">
      <div className="error-icon">!</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onRetry} disabled={retrying}>
            {retrying ? 'Retrying…' : 'Try Again'}
          </button>
        </div>
      )}
    </div>
  );
}
