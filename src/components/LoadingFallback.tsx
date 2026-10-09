import React from 'react';

export interface LoadingFallbackProps {
  readonly label?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  label = 'Loading scene',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-fallback"
    >
      <span className="loading-fallback__indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};
