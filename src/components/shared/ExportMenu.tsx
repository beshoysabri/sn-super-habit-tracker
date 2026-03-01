import { useState, useEffect, useRef } from 'react';
import type { HabitTrackerData } from '../../types/habit.ts';
import { exportCSV } from '../../lib/export-csv.ts';
import { exportMarkdown } from '../../lib/export-md.ts';
import { exportXlsx } from '../../lib/export-xlsx.ts';
import { exportPdf } from '../../lib/export-pdf.ts';

interface ExportMenuProps {
  data: HabitTrackerData;
}

export function ExportMenu({ data }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="export-menu" ref={ref}>
      <button
        className="ht-icon-btn"
        onClick={() => setOpen(!open)}
        title="Export"
      >
        ↓
      </button>
      {open && (
        <div className="export-dropdown">
          <button onClick={() => { exportCSV(data); setOpen(false); }}>
            📄 CSV
          </button>
          <button onClick={() => { exportMarkdown(data); setOpen(false); }}>
            📝 Markdown
          </button>
          <button onClick={() => { exportXlsx(data); setOpen(false); }}>
            📊 Excel
          </button>
          <button onClick={() => { exportPdf(data); setOpen(false); }}>
            📑 PDF
          </button>
        </div>
      )}
    </div>
  );
}
