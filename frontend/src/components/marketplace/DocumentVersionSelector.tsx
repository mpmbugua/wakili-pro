import React from 'react';

interface DocumentVersion {
  id: string;
  version: number;
  isActive: boolean;
}

interface DocumentVersionSelectorProps {
  versions: DocumentVersion[];
  onSelect: (version: DocumentVersion) => void;
}

export const DocumentVersionSelector: React.FC<DocumentVersionSelectorProps> = ({ versions, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  React.useEffect(() => {
    if (versions.length > 0) onSelect(versions[selectedIndex]);
  }, [selectedIndex, versions, onSelect]);
  return (
    <div className="mt-4">
      <label htmlFor="version-select" className="block font-semibold mb-1">Select Version:</label>
      <select
        id="version-select"
        className="border rounded px-2 py-1"
        value={selectedIndex}
        onChange={e => {
          const idx = parseInt(e.target.value);
          setSelectedIndex(idx);
          onSelect(versions[idx]);
        }}
      >
        {versions.map((v, i) => (
          <option key={v.id} value={i}>
            v{v.version} {v.isActive ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
