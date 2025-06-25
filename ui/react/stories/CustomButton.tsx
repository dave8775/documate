import React, { useState } from 'react'
import { Dialog } from '../src/components/Documate'

export const Documate = ({
  ...props
}) => {
  const [isOpen, setOpen] = useState(false);
  
  return (
    <>
      <button {...props} onClick={() => setOpen(true)}>Click me to Ask</button>
      <Dialog open={isOpen} endpoint='https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/ask' // TODO: Replace with actual GCF URL
      onClose={() => setOpen(false)}/>
    </>
  );
}