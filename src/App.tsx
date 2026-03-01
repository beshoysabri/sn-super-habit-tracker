import { useState, useEffect, useCallback, useRef } from 'react';
import { HabitTracker } from './components/HabitTracker.tsx';
import { YearSetup } from './components/YearSetup.tsx';
import { parseNoteText, serializeToNoteText, createEmpty, generatePreview } from './lib/data.ts';
import { snApi } from './lib/sn-api.ts';
import type { HabitTrackerData } from './types/habit.ts';

function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (visible) setLog(snApi.getDebugLog());
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible((v) => !v);
        setLog(snApi.getDebugLog());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      maxHeight: '40vh', overflow: 'auto', background: '#000', color: '#0f0',
      fontFamily: 'monospace', fontSize: '11px', padding: '8px', lineHeight: 1.4,
      borderTop: '2px solid #0f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <strong>SN Debug Log (Ctrl+Shift+D to close)</strong>
        <span>{log.length} entries</span>
      </div>
      {log.map((line, i) => <div key={i}>{line}</div>)}
      {log.length === 0 && <div style={{ opacity: 0.5 }}>No messages yet...</div>}
    </div>
  );
}

function App() {
  const [data, setData] = useState<HabitTrackerData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showYearSetup, setShowYearSetup] = useState(false);
  const isInsideSN = useRef(window.parent !== window);
  const dataReceived = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInsideSN.current) {
      document.body.classList.add('sn-embedded');

      const timeout = setTimeout(() => {
        if (!dataReceived.current) {
          setShowYearSetup(true);
          setLoaded(true);
        }
      }, 4000);

      snApi.initialize((text: string) => {
        dataReceived.current = true;
        clearTimeout(timeout);
        if (text.trim()) {
          const { data: parsed, isNew } = parseNoteText(text);
          if (isNew) {
            setShowYearSetup(true);
          } else {
            setData(parsed);
          }
        } else {
          setShowYearSetup(true);
        }
        setLoaded(true);
      });

      return () => {
        clearTimeout(timeout);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        document.body.classList.remove('sn-embedded');
        snApi.destroy();
      };
    } else {
      const saved = localStorage.getItem('sn-habit-tracker');
      if (saved) {
        try {
          const { data: parsed, isNew } = parseNoteText(saved);
          if (isNew) {
            setShowYearSetup(true);
          } else {
            setData(parsed);
          }
        } catch {
          setShowYearSetup(true);
        }
      } else {
        setShowYearSetup(true);
      }
      setLoaded(true);
    }
  }, []);

  const handleChange = useCallback(
    (newData: HabitTrackerData) => {
      setData(newData);
      const noteText = serializeToNoteText(newData);
      const preview = generatePreview(newData);
      if (isInsideSN.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          snApi.saveText(noteText, preview);
          saveTimeoutRef.current = null;
        }, 300);
      } else {
        localStorage.setItem('sn-habit-tracker', noteText);
      }
    },
    []
  );

  const handleYearConfirm = useCallback(
    (year: number) => {
      const newData = createEmpty(year);
      setData(newData);
      setShowYearSetup(false);
      handleChange(newData);
    },
    [handleChange]
  );

  if (!loaded) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (showYearSetup || !data) {
    return (
      <>
        <YearSetup onConfirm={handleYearConfirm} />
        <DebugPanel />
      </>
    );
  }

  return (
    <div className="app">
      <HabitTracker data={data} onChange={handleChange} />
      <DebugPanel />
    </div>
  );
}

export default App;
