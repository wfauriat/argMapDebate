"use client";

import { useState } from "react";
import WizardModal from "./WizardModal";

export default function WizardButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
      >
        Guided Build
      </button>
      {open && <WizardModal onClose={() => setOpen(false)} />}
    </>
  );
}
