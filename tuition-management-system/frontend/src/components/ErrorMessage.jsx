const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <p>{message || 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger-text)' }}>Try Again</button>
      )}
    </div>
  );
};

export default ErrorMessage;
