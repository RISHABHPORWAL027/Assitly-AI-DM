import React from 'react';

/** Ambient background orbs for workspace — Apple/Meta-style depth */
export function WorkspaceMesh() {
  return (
    <div className="workspace-mesh pointer-events-none" aria-hidden="true">
      <div className="workspace-orb workspace-orb-1" />
      <div className="workspace-orb workspace-orb-2" />
      <div className="workspace-orb workspace-orb-3" />
    </div>
  );
}
