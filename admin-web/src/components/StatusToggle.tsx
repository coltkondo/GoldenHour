import { useState } from 'react';

interface StatusToggleProps {
  active: boolean;
  onToggle: () => Promise<void>;
}

export default function StatusToggle({ active, onToggle }: StatusToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`status-toggle ${active ? 'active' : 'inactive'}`}
      onClick={handleClick}
      disabled={loading}
      title={active ? 'Click to deactivate' : 'Click to activate'}
    >
      {loading ? '...' : active ? 'Active' : 'Inactive'}
    </button>
  );
}
