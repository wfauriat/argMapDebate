"use client";

import { useState } from "react";
import AIGenerateModal from "./AIGenerateModal";

export default function AIGenerateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
      >
        AI Generate
      </button>
      {open && <AIGenerateModal onClose={() => setOpen(false)} />}
    </>
  );
}
