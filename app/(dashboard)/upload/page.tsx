// 'use client';

// import { useState, useRef } from 'react';

// type Confidence = 'high' | 'medium' | 'low' | null;

// interface DetectResponse {
//   status: 'mapping_needed';
//   columns: string[];
//   mapping: Record<string, string | null>;
//   totalRows: number;
//   sourceName: string;
//   savedAdapter: boolean;
// }

// type Step = 1 | 2 | 3;

// const STANDARD_OPTIONS = [
//   { value: '',                  label: 'Skip' },
//   { value: 'company_name',      label: 'company_name' },
//   { value: 'mobile_number',     label: 'mobile_number' },
//   { value: 'email',             label: 'email' },
//   { value: 'website_url',       label: 'website_url' },
//   { value: 'address',           label: 'address' },
//   { value: 'state',             label: 'state' },
//   { value: 'business_category', label: 'business_category' },
//   { value: 'google_rating',     label: 'google_rating' },
//   { value: 'source_file',       label: 'source_file' },
//   { value: 'quality_score',     label: 'quality_score' },
// ];

// function confidenceColor(c: Confidence) {
//   if (c === 'high')   return '#16a34a';
//   if (c === 'medium') return '#ea580c';
//   return '#dc2626';
// }
// function confidenceBg(c: Confidence) {
//   if (c === 'high')   return '#dcfce7';
//   if (c === 'medium') return '#ffedd5';
//   return '#fee2e2';
// }

// export default function UploadPage() {
//   const fileRef = useRef<HTMLInputElement>(null);

//   const [step, setStep]               = useState<Step>(1);
//   const [file, setFile]               = useState<File | null>(null);
//   const [loading, setLoading]         = useState(false);
//   const [error, setError]             = useState('');
//   const [columns, setColumns]         = useState<string[]>([]);
//   const [mapping, setMapping]         = useState<Record<string, string | null>>({});
//   const [confidence, setConfidence]   = useState<Record<string, Confidence>>({});
//   const [totalRows, setTotalRows]     = useState(0);
//   const [savedAdapter, setSavedAdapter] = useState(false);
//   const [result, setResult]           = useState<{ inserted: number; skipped: number; message: string } | null>(null);

//   const resetAll = () => {
//     setStep(1); setFile(null); setLoading(false); setError('');
//     setColumns([]); setMapping({}); setConfidence({});
//     setTotalRows(0); setSavedAdapter(false); setResult(null);
//     if (fileRef.current) fileRef.current.value = '';
//   };

//   const handleAutoUpload = async (selectedFile: File) => {
//     setError(''); 
//     setLoading(true);
//     setStep(2); // Show loading state
    
//     try {
//       // Step 1: Detect columns and get auto-mapping
//       const fd1 = new FormData();
//       fd1.append('file', selectedFile);
//       const res1 = await fetch('/api/upload', { method: 'POST', body: fd1 });
//       const data1: DetectResponse = await res1.json();
      
//       if (!res1.ok || data1.status !== 'mapping_needed') {
//         setError((data1 as any).error || 'Detection failed');
//         setStep(1);
//         return;
//       }

//       // Step 2: Immediately upload with auto-mapping
//       const fd2 = new FormData();
//       fd2.append('file', selectedFile);
//       fd2.append('mapping', JSON.stringify(data1.mapping));
//       const res2 = await fetch('/api/upload', { method: 'POST', body: fd2 });
//       const data2 = await res2.json();
      
//       if (!res2.ok || data2.status !== 'success') {
//         setError(data2.error || 'Upload failed');
//         setStep(1);
//         return;
//       }

//       setResult({ 
//         inserted: data2.inserted, 
//         skipped: data2.skipped, 
//         message: data2.message 
//       });
//       setStep(3);
//     } catch (e: any) {
//       setError(e.message || 'Network error');
//       setStep(1);
//     } finally { 
//       setLoading(false); 
//     }
//   };

//   const detectColumns = async () => {
//     if (!file) { setError('Please select a file first'); return; }
//     setError(''); setLoading(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', file);
//       const res  = await fetch('/api/upload', { method: 'POST', body: fd });
//       const data: DetectResponse = await res.json();
//       if (!res.ok || data.status !== 'mapping_needed') {
//         setError((data as any).error || 'Detection failed');
//         return;
//       }
//       const confMap: Record<string, Confidence> = {};
//       for (const col of data.columns) {
//         confMap[col] = data.savedAdapter ? 'high' : (data.mapping[col] ? 'medium' : 'low');
//       }
//       setColumns(data.columns); setMapping(data.mapping);
//       setConfidence(confMap);   setTotalRows(data.totalRows);
//       setSavedAdapter(data.savedAdapter);
      
//       // Auto-upload if saved adapter found
//       if (data.savedAdapter) {
//         await autoInsertData(file, data.mapping);
//       } else {
//         setStep(2);
//       }
//     } catch (e: any) {
//       setError(e.message || 'Network error');
//     } finally { setLoading(false); }
//   };

//   const autoInsertData = async (uploadFile: File, autoMapping: Record<string, string | null>) => {
//     setError(''); setLoading(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', uploadFile);
//       fd.append('mapping', JSON.stringify(autoMapping));
//       const res  = await fetch('/api/upload', { method: 'POST', body: fd });
//       const data = await res.json();
//       if (!res.ok || data.status !== 'success') {
//         setError(data.error || 'Insert failed'); return;
//       }
//       setResult({ inserted: data.inserted, skipped: data.skipped, message: data.message });
//       setStep(3);
//     } catch (e: any) {
//       setError(e.message || 'Network error');
//     } finally { setLoading(false); }
//   };

//   const insertData = async () => {
//     if (!file) return;
//     setError(''); setLoading(true);
//     try {
//       const fd = new FormData();
//       fd.append('file', file);
//       fd.append('mapping', JSON.stringify(mapping));
//       const res  = await fetch('/api/upload', { method: 'POST', body: fd });
//       const data = await res.json();
//       if (!res.ok || data.status !== 'success') {
//         setError(data.error || 'Insert failed'); return;
//       }
//       setResult({ inserted: data.inserted, skipped: data.skipped, message: data.message });
//       setStep(3);
//     } catch (e: any) {
//       setError(e.message || 'Network error');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div style={s.page}>
//       <div style={s.card}>

//         {/* Header */}
//         <div style={s.header}>
//           <div style={s.logoWrap}>
//             <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//             </svg>
//           </div>
//           <div>
//             <h1 style={s.title}>Company Data Upload</h1>
//             <p style={s.subtitle}>Excel / CSV → raw_records → staging_businesses → company_master</p>
//           </div>
//         </div>

//         {/* Step indicator */}
//         <div style={s.stepRow}>
//           {[1, 2, 3].map((n, i) => {
//             const active = step === n;
//             const done   = step > n;
//             return (
//               <div key={n} style={s.stepItem}>
//                 <div style={{ ...s.stepCircle,
//                   background: done ? '#16a34a' : active ? '#2563eb' : '#e5e7eb',
//                   color: done || active ? '#fff' : '#6b7280' }}>
//                   {done ? '✓' : n}
//                 </div>
//                 <span style={{ ...s.stepLabel, color: active ? '#2563eb' : '#6b7280' }}>
//                   {['File Select', 'Mapping', 'Result'][i]}
//                 </span>
//                 {i < 2 && <div style={s.stepLine} />}
//               </div>
//             );
//           })}
//         </div>

//         {/* ── STEP 1 ── */}
//         {step === 1 && (
//           <div style={s.section}>
//             <label style={s.label}>Upload File (.xlsx or .csv)</label>
//             <div style={s.dropZone} onClick={() => fileRef.current?.click()}>
//               <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                   d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//               </svg>
//               <p style={s.dropText}>{file ? file.name : 'Click to choose file'}</p>
//               <p style={s.dropHint}>File will upload automatically after selection</p>
//               <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }}
//                 onChange={(e) => { 
//                   const selectedFile = e.target.files?.[0] ?? null;
//                   setFile(selectedFile); 
//                   setError('');
//                   // Auto-upload on file selection
//                   if (selectedFile) {
//                     handleAutoUpload(selectedFile);
//                   }
//                 }} />
//             </div>

//             {error && <div style={s.errorBox}>{error}</div>}

//             {/* Pipeline info */}
//             <div style={s.pipelineInfo}>
//               <p style={s.pipelineTitle}>Data will automatically flow to:</p>
//               <div style={s.pipelineSteps}>
//                 <div style={s.pipelineStep}>
//                   <span style={{ ...s.pipelineDot, background: '#6366f1' }} />
//                   <span><strong>raw_records</strong> — complete raw data as-is</span>
//                 </div>
//                 <div style={s.pipelineArrow}>↓</div>
//                 <div style={s.pipelineStep}>
//                   <span style={{ ...s.pipelineDot, background: '#0891b2' }} />
//                   <span><strong>staging_businesses</strong> — mapped fields, all rows</span>
//                 </div>
//                 <div style={s.pipelineArrow}>↓</div>
//                 <div style={s.pipelineStep}>
//                   <span style={{ ...s.pipelineDot, background: '#16a34a' }} />
//                   <span><strong>company_master</strong> — only valid rows (company_name required)</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── STEP 2 ── Loading State */}
//         {step === 2 && (
//           <div style={s.section}>
//             <div style={{ textAlign: 'center', padding: '60px 20px' }}>
//               <div style={{ ...s.spinner, width: 48, height: 48, margin: '0 auto 20px', borderWidth: 4 }} />
//               <h2 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
//                 Uploading your file...
//               </h2>
//               <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
//                 Processing and inserting data into all tables
//               </p>
//             </div>
//           </div>
//         )}

//         {/* ── STEP 3 ── */}
//         {step === 3 && (
//           <div style={s.section}>
//             {error ? (
//               <div style={s.resultError}>
//                 <div style={s.resultIcon}>❌</div>
//                 <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>Error!</h2>
//                 <p style={{ color: '#7f1d1d', margin: 0 }}>{error}</p>
//               </div>
//             ) : result ? (
//               <div style={s.resultSuccess}>
//                 <div style={s.resultIcon}>✅</div>
//                 <h2 style={{ color: '#15803d', margin: '0 0 4px' }}>Upload Successful!</h2>
//                 <p style={{ color: '#166534', margin: '0 0 20px' }}>{result.message}</p>

//                 {/* Stats */}
//                 <div style={s.statsRow}>
//                   <div style={s.statBox}>
//                     <div style={{ fontSize: 32, fontWeight: 700, color: '#15803d' }}>{result.inserted}</div>
//                     <div style={{ fontSize: 13, color: '#166534' }}>Rows Inserted</div>
//                   </div>
//                   <div style={s.statBox}>
//                     <div style={{ fontSize: 32, fontWeight: 700, color: '#ea580c' }}>{result.skipped}</div>
//                     <div style={{ fontSize: 13, color: '#9a3412' }}>Rows Skipped</div>
//                   </div>
//                 </div>

//                 {/* Pipeline success breakdown */}
//                 <div style={s.pipelineResult}>
//                   <p style={s.pipelineResultTitle}>Data inserted into all tables:</p>
//                   <div style={s.pipelineResultSteps}>
//                     <div style={s.pipelineResultStep}>
//                       <span style={s.checkIcon}>✓</span>
//                       <div>
//                         <strong>raw_records</strong>
//                         <span style={s.pipelineResultNote}> — {result.inserted + result.skipped} rows (complete raw data)</span>
//                       </div>
//                     </div>
//                     <div style={s.pipelineResultStep}>
//                       <span style={s.checkIcon}>✓</span>
//                       <div>
//                         <strong>staging_businesses</strong>
//                         <span style={s.pipelineResultNote}> — {result.inserted + result.skipped} rows (mapped fields)</span>
//                       </div>
//                     </div>
//                     <div style={s.pipelineResultStep}>
//                       <span style={s.checkIcon}>✓</span>
//                       <div>
//                         <strong>company_master</strong>
//                         <span style={s.pipelineResultNote}> — {result.inserted} rows (valid rows only)</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : null}
//             <button onClick={resetAll} style={{ ...s.btnPrimary, marginTop: 24 }}>
//               📂 Upload Another File
//             </button>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// const s: Record<string, React.CSSProperties> = {
//   page:        { padding: '28px', background: '#f1f5f9', minHeight: '100%' },
//   card:        { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 760, margin: '0 auto', overflow: 'hidden' },
//   header:      { background: 'linear-gradient(135deg,#1e40af,#7c3aed)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14 },
//   logoWrap:    { width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   title:       { margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' },
//   subtitle:    { margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
//   stepRow:     { display: 'flex', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #f1f5f9' },
//   stepItem:    { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
//   stepCircle:  { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
//   stepLabel:   { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
//   stepLine:    { flex: 1, height: 2, background: '#e5e7eb', margin: '0 8px' },
//   section:     { padding: '28px' },
//   label:       { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 },
//   dropZone:    { border: '2px dashed #d1d5db', borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: 12 },
//   dropText:    { margin: '10px 0 4px', fontSize: 15, color: '#374151', fontWeight: 500 },
//   dropHint:    { margin: 0, fontSize: 12, color: '#9ca3af' },
//   fileInfo:    { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, marginBottom: 16, border: '1px solid #bfdbfe' },
//   errorBox:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16 },
//   btnPrimary:  { width: '100%', padding: '12px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
//   btnSecondary:{ padding: '12px 24px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
//   btnRow:      { display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' },
//   savedNotice: { display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 500, marginBottom: 16 },
//   summaryRow:  { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
//   chip:        { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 14px', fontSize: 13, color: '#475569' },
//   tableWrap:   { overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 4 },
//   table:       { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
//   th:          { background: '#f8fafc', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' },
//   tr:          { borderBottom: '1px solid #f1f5f9' },
//   td:          { padding: '10px 16px', verticalAlign: 'middle' },
//   colName:     { fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 5, fontSize: 13, color: '#1e293b' },
//   select:      { padding: '7px 10px', border: '1.5px solid #d1d5db', borderRadius: 7, fontSize: 13, color: '#111827', background: '#fff', cursor: 'pointer', minWidth: 160, outline: 'none' },
//   badge:       { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
//   resultSuccess:{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '28px', textAlign: 'center' },
//   resultError: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '28px', textAlign: 'center' },
//   resultIcon:  { fontSize: 40, marginBottom: 12 },
//   statsRow:    { display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 },
//   statBox:     { background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '16px 32px', textAlign: 'center' },
//   spinnerWrap: { display: 'flex', alignItems: 'center', gap: 8 },
//   spinner:     { display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

//   // Pipeline info (step 1)
//   pipelineInfo:       { marginTop: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' },
//   pipelineTitle:      { margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#475569' },
//   pipelineSteps:      { display: 'flex', flexDirection: 'column', gap: 4 },
//   pipelineStep:       { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155', padding: '4px 0' },
//   pipelineDot:        { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
//   pipelineArrow:      { paddingLeft: 9, fontSize: 12, color: '#94a3b8' },

//   // Pipeline result (step 3)
//   pipelineResult:      { background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '16px 20px', textAlign: 'left' },
//   pipelineResultTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#166534' },
//   pipelineResultSteps: { display: 'flex', flexDirection: 'column', gap: 10 },
//   pipelineResultStep:  { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#166534' },
//   pipelineResultNote:  { color: '#4b7a5c', fontWeight: 400 },
//   checkIcon:           { color: '#16a34a', fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 },
// };


'use client';

import { useState, useRef } from 'react';

type Confidence = 'high' | 'medium' | 'low' | null;

interface DetectResponse {
  status: 'mapping_needed';
  columns: string[];
  mapping: Record<string, string | null>;
  totalRows: number;
  sourceName: string;
  savedAdapter: boolean;
}

type Step = 1 | 2 | 3;

const STANDARD_OPTIONS = [
  { value: '',                  label: 'Skip' },
  { value: 'company_name',      label: 'company_name' },
  { value: 'mobile_number',     label: 'mobile_number' },
  { value: 'email',             label: 'email' },
  { value: 'website_url',       label: 'website_url' },
  { value: 'address',           label: 'address' },
  { value: 'state',             label: 'state' },
  { value: 'business_category', label: 'business_category' },
  { value: 'google_rating',     label: 'google_rating' },
  { value: 'source_file',       label: 'source_file' },
  { value: 'quality_score',     label: 'quality_score' },
];

function confidenceColor(c: Confidence) {
  if (c === 'high')   return '#16a34a';
  if (c === 'medium') return '#ea580c';
  return '#dc2626';
}
function confidenceBg(c: Confidence) {
  if (c === 'high')   return '#dcfce7';
  if (c === 'medium') return '#ffedd5';
  return '#fee2e2';
}

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]               = useState<Step>(1);
  const [file, setFile]               = useState<File | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [columns, setColumns]         = useState<string[]>([]);
  const [mapping, setMapping]         = useState<Record<string, string | null>>({});
  const [confidence, setConfidence]   = useState<Record<string, Confidence>>({});
  const [totalRows, setTotalRows]     = useState(0);
  const [savedAdapter, setSavedAdapter] = useState(false);
  const [result, setResult]           = useState<{ 
    inserted: number; 
    skipped: number; 
    duplicates: number;
    message: string 
  } | null>(null);

  const resetAll = () => {
    setStep(1); setFile(null); setLoading(false); setError('');
    setColumns([]); setMapping({}); setConfidence({});
    setTotalRows(0); setSavedAdapter(false); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAutoUpload = async (selectedFile: File) => {
    setError(''); 
    setLoading(true);
    setStep(2);
    
    try {
      const fd1 = new FormData();
      fd1.append('file', selectedFile);
      const res1 = await fetch('/api/upload', { method: 'POST', body: fd1 });
      const data1: DetectResponse = await res1.json();
      
      if (!res1.ok || data1.status !== 'mapping_needed') {
        setError((data1 as any).error || 'Detection failed');
        setStep(1);
        return;
      }

      const fd2 = new FormData();
      fd2.append('file', selectedFile);
      fd2.append('mapping', JSON.stringify(data1.mapping));
      const res2 = await fetch('/api/upload', { method: 'POST', body: fd2 });
      const data2 = await res2.json();
      
      if (!res2.ok || data2.status !== 'success') {
        setError(data2.error || 'Upload failed');
        setStep(1);
        return;
      }

      setResult({ 
        inserted: data2.inserted, 
        skipped: data2.skipped,
        duplicates: data2.duplicates || 0,
        message: data2.message 
      });
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Network error');
      setStep(1);
    } finally { 
      setLoading(false); 
    }
  };

  const detectColumns = async () => {
    if (!file) { setError('Please select a file first'); return; }
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data: DetectResponse = await res.json();
      if (!res.ok || data.status !== 'mapping_needed') {
        setError((data as any).error || 'Detection failed');
        return;
      }
      const confMap: Record<string, Confidence> = {};
      for (const col of data.columns) {
        confMap[col] = data.savedAdapter ? 'high' : (data.mapping[col] ? 'medium' : 'low');
      }
      setColumns(data.columns); setMapping(data.mapping);
      setConfidence(confMap);   setTotalRows(data.totalRows);
      setSavedAdapter(data.savedAdapter);
      
      if (data.savedAdapter) {
        await autoInsertData(file, data.mapping);
      } else {
        setStep(2);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally { setLoading(false); }
  };

  const autoInsertData = async (uploadFile: File, autoMapping: Record<string, string | null>) => {
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('mapping', JSON.stringify(autoMapping));
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Insert failed'); return;
      }
      setResult({ 
        inserted: data.inserted, 
        skipped: data.skipped,
        duplicates: data.duplicates || 0,
        message: data.message 
      });
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally { setLoading(false); }
  };

  const insertData = async () => {
    if (!file) return;
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mapping', JSON.stringify(mapping));
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.error || 'Insert failed'); return;
      }
      setResult({ 
        inserted: data.inserted, 
        skipped: data.skipped,
        duplicates: data.duplicates || 0,
        message: data.message 
      });
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoWrap}>
            <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h1 style={s.title}>Company Data Upload</h1>
            <p style={s.subtitle}>Excel / CSV → raw_records → staging_businesses → company_master</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={s.stepRow}>
          {[1, 2, 3].map((n, i) => {
            const active = step === n;
            const done   = step > n;
            return (
              <div key={n} style={s.stepItem}>
                <div style={{ ...s.stepCircle,
                  background: done ? '#16a34a' : active ? '#2563eb' : '#e5e7eb',
                  color: done || active ? '#fff' : '#6b7280' }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ ...s.stepLabel, color: active ? '#2563eb' : '#6b7280' }}>
                  {['File Select', 'Processing', 'Result'][i]}
                </span>
                {i < 2 && <div style={s.stepLine} />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={s.section}>
            <label style={s.label}>Upload File (.xlsx or .csv)</label>
            <div style={s.dropZone} onClick={() => fileRef.current?.click()}>
              <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p style={s.dropText}>{file ? file.name : 'Click to choose file'}</p>
              <p style={s.dropHint}>File will upload automatically after selection</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }}
                onChange={(e) => { 
                  const selectedFile = e.target.files?.[0] ?? null;
                  setFile(selectedFile); 
                  setError('');
                  if (selectedFile) {
                    handleAutoUpload(selectedFile);
                  }
                }} />
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.pipelineInfo}>
              <p style={s.pipelineTitle}>Data will automatically flow to:</p>
              <div style={s.pipelineSteps}>
                <div style={s.pipelineStep}>
                  <span style={{ ...s.pipelineDot, background: '#6366f1' }} />
                  <span><strong>raw_records</strong> — complete raw data as-is</span>
                </div>
                <div style={s.pipelineArrow}>↓</div>
                <div style={s.pipelineStep}>
                  <span style={{ ...s.pipelineDot, background: '#0891b2' }} />
                  <span><strong>staging_businesses</strong> — mapped fields, all rows</span>
                </div>
                <div style={s.pipelineArrow}>↓</div>
                <div style={s.pipelineStep}>
                  <span style={{ ...s.pipelineDot, background: '#16a34a' }} />
                  <span><strong>company_master</strong> — only valid rows (company_name required)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Processing ── */}
        {step === 2 && (
          <div style={s.section}>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ 
                width: 48, height: 48, margin: '0 auto 20px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
                Processing your file...
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Detecting columns, checking duplicates & inserting data
              </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── STEP 3 — Result ── */}
        {step === 3 && (
          <div style={s.section}>
            {error ? (
              <div style={s.resultError}>
                <div style={s.resultIcon}>❌</div>
                <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>Error!</h2>
                <p style={{ color: '#7f1d1d', margin: 0 }}>{error}</p>
              </div>
            ) : result ? (
              <div style={s.resultSuccess}>
                <div style={s.resultIcon}>✅</div>
                <h2 style={{ color: '#15803d', margin: '0 0 4px' }}>Upload Successful!</h2>
                <p style={{ color: '#166534', margin: '0 0 20px' }}>{result.message}</p>

                {/* Stats — 4 boxes */}
                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1d4ed8' }}>
                      {result.inserted + result.skipped + result.duplicates}
                    </div>
                    <div style={{ fontSize: 12, color: '#1e40af' }}>Total Rows</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#15803d' }}>
                      {result.inserted}
                    </div>
                    <div style={{ fontSize: 12, color: '#166534' }}>Inserted ✅</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
                      {result.duplicates}
                    </div>
                    <div style={{ fontSize: 12, color: '#5b21b6' }}>Duplicates 🔄</div>
                  </div>
                  <div style={s.statBox}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c' }}>
                      {result.skipped}
                    </div>
                    <div style={{ fontSize: 12, color: '#9a3412' }}>Skipped ⚠️</div>
                  </div>
                </div>

                {/* Pipeline breakdown */}
                <div style={s.pipelineResult}>
                  <p style={s.pipelineResultTitle}>Pipeline Status:</p>
                  <div style={s.pipelineResultSteps}>
                    <div style={s.pipelineResultStep}>
                      <span style={s.checkIcon}>✓</span>
                      <div>
                        <strong>raw_records</strong>
                        <span style={s.pipelineResultNote}> — {result.inserted} new rows inserted</span>
                      </div>
                    </div>
                    <div style={s.pipelineResultStep}>
                      <span style={s.checkIcon}>✓</span>
                      <div>
                        <strong>staging_businesses</strong>
                        <span style={s.pipelineResultNote}> — trigger se auto-populate</span>
                      </div>
                    </div>
                    <div style={s.pipelineResultStep}>
                      <span style={s.checkIcon}>✓</span>
                      <div>
                        <strong>company_master</strong>
                        <span style={s.pipelineResultNote}> — trigger se auto-populate (valid rows only)</span>
                      </div>
                    </div>
                    {result.duplicates > 0 && (
                      <div style={s.pipelineResultStep}>
                        <span style={{ ...s.checkIcon, color: '#7c3aed' }}>⊘</span>
                        <div>
                          <strong style={{ color: '#5b21b6' }}>{result.duplicates} duplicates skipped</strong>
                          <span style={s.pipelineResultNote}> — same company+phone+email already exists</span>
                        </div>
                      </div>
                    )}
                    {result.skipped > 0 && (
                      <div style={s.pipelineResultStep}>
                        <span style={{ ...s.checkIcon, color: '#ea580c' }}>⚠</span>
                        <div>
                          <strong style={{ color: '#9a3412' }}>{result.skipped} rows skipped</strong>
                          <span style={s.pipelineResultNote}> — missing company_name</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            <button onClick={resetAll} style={{ ...s.btnPrimary, marginTop: 24 }}>
              📂 Upload Another File
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '28px', background: '#f1f5f9', minHeight: '100%' },
  card:        { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 760, margin: '0 auto', overflow: 'hidden' },
  header:      { background: 'linear-gradient(135deg,#1e40af,#7c3aed)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14 },
  logoWrap:    { width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' },
  subtitle:    { margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  stepRow:     { display: 'flex', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #f1f5f9' },
  stepItem:    { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  stepCircle:  { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  stepLabel:   { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' },
  stepLine:    { flex: 1, height: 2, background: '#e5e7eb', margin: '0 8px' },
  section:     { padding: '28px' },
  label:       { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 },
  dropZone:    { border: '2px dashed #d1d5db', borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: 12 },
  dropText:    { margin: '10px 0 4px', fontSize: 15, color: '#374151', fontWeight: 500 },
  dropHint:    { margin: 0, fontSize: 12, color: '#9ca3af' },
  errorBox:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16 },
  btnPrimary:  { width: '100%', padding: '12px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSecondary:{ padding: '12px 24px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnRow:      { display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' },
  statsRow:    { display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' },
  statBox:     { background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '14px 24px', textAlign: 'center', minWidth: 100 },
  resultSuccess:{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '28px', textAlign: 'center' },
  resultError: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '28px', textAlign: 'center' },
  resultIcon:  { fontSize: 40, marginBottom: 12 },
  pipelineInfo:       { marginTop: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' },
  pipelineTitle:      { margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#475569' },
  pipelineSteps:      { display: 'flex', flexDirection: 'column', gap: 4 },
  pipelineStep:       { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155', padding: '4px 0' },
  pipelineDot:        { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  pipelineArrow:      { paddingLeft: 9, fontSize: 12, color: '#94a3b8' },
  pipelineResult:      { background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: '16px 20px', textAlign: 'left' },
  pipelineResultTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#166534' },
  pipelineResultSteps: { display: 'flex', flexDirection: 'column', gap: 10 },
  pipelineResultStep:  { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#166534' },
  pipelineResultNote:  { color: '#4b7a5c', fontWeight: 400 },
  checkIcon:           { color: '#16a34a', fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 },
};