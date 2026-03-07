"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import JSZip from "jszip";

// ─── Types ───
type Tool = "unlock" | "merge" | "split" | "extract" | "rotate" | "info";

interface HistoryItem {
  time: string;
  action: string;
  file: string;
  ok: boolean;
}

interface PdfInfo {
  pages: number;
  title: string;
  author: string;
  creator: string;
  producer: string;
  encrypted: boolean;
}

// ─── Tool Config ───
const TOOLS: { id: Tool; icon: string; label: string; desc: string }[] = [
  { id: "unlock", icon: "🔓", label: "암호 해제", desc: "PDF 제한/암호를 제거합니다" },
  { id: "merge", icon: "📋", label: "PDF 병합", desc: "여러 PDF를 하나로 합칩니다" },
  { id: "split", icon: "✂️", label: "PDF 분할", desc: "페이지 범위별로 분할합니다" },
  { id: "extract", icon: "📄", label: "페이지 추출", desc: "원하는 페이지만 추출합니다" },
  { id: "rotate", icon: "🔄", label: "페이지 회전", desc: "원하는 각도로 회전합니다" },
  { id: "info", icon: "ℹ️", label: "PDF 정보", desc: "메타데이터를 확인합니다" },
];

// ─── Helpers ───
function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function fmtTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

function download(data: Uint8Array, filename: string, mime = "application/pdf") {
  const blob = new Blob([data.slice().buffer as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadZip(files: { name: string; data: Uint8Array }[]) {
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.data));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pdf_toolkit_output.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parsePageRanges(input: string, total: number): number[] {
  const pages: number[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [s, e] = trimmed.split("-");
      const start = Math.max(1, parseInt(s));
      const end = Math.min(total, parseInt(e));
      for (let i = start; i <= end; i++) pages.push(i);
    } else {
      const n = parseInt(trimmed);
      if (n >= 1 && n <= total) pages.push(n);
    }
  }
  return pages;
}

// ─── PDF Operations ───
async function unlockPDF(data: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  return doc.save();
}

async function mergePDFs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

async function splitPDF(
  data: ArrayBuffer,
  rangesStr: string
): Promise<{ name: string; data: Uint8Array }[]> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];

  for (const part of rangesStr.split(",")) {
    const trimmed = part.trim();
    let start: number, end: number;
    if (trimmed.includes("-")) {
      const [s, e] = trimmed.split("-");
      start = Math.max(1, parseInt(s));
      end = Math.min(total, parseInt(e));
    } else {
      start = end = Math.max(1, Math.min(total, parseInt(trimmed)));
    }
    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
    const pages = await newDoc.copyPages(doc, indices);
    pages.forEach((p) => newDoc.addPage(p));
    results.push({ name: `pages_${start}-${end}.pdf`, data: await newDoc.save() });
  }
  return results;
}

async function extractPages(data: ArrayBuffer, pageNums: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const newDoc = await PDFDocument.create();
  const valid = pageNums.filter((p) => p >= 1 && p <= total).map((p) => p - 1);
  const pages = await newDoc.copyPages(doc, valid);
  pages.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

async function rotatePages(
  data: ArrayBuffer,
  deg: number,
  pageNums?: number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const targets = pageNums || Array.from({ length: total }, (_, i) => i + 1);
  for (const p of targets) {
    if (p >= 1 && p <= total) {
      const page = doc.getPage(p - 1);
      const cur = page.getRotation().angle;
      page.setRotation(degrees((cur + deg) % 360));
    }
  }
  return doc.save();
}

async function getPdfInfo(data: ArrayBuffer): Promise<PdfInfo> {
  try {
    const doc = await PDFDocument.load(data, { ignoreEncryption: true });
    return {
      pages: doc.getPageCount(),
      title: doc.getTitle() || "—",
      author: doc.getAuthor() || "—",
      creator: doc.getCreator() || "—",
      producer: doc.getProducer() || "—",
      encrypted: false,
    };
  } catch {
    return { pages: 0, title: "", author: "", creator: "", producer: "", encrypted: true };
  }
}

// ─── Components ───
function Toast({ type, text }: { type: "success" | "error" | "warning"; text: string }) {
  const styles = {
    success: "bg-[#8cff2e]/[0.06] border-[#8cff2e]/[0.15] text-[#8cff2e]",
    error: "bg-red-500/[0.06] border-red-500/[0.15] text-red-400",
    warning: "bg-orange-400/[0.06] border-orange-400/[0.15] text-orange-400",
  };
  const icons = { success: "✓", error: "✕", warning: "⚠" };
  return (
    <div className={`${styles[type]} border rounded-xl px-4 py-3 flex items-center gap-3 animate-fadeIn text-sm font-medium`}>
      <span className="text-lg">{icons[type]}</span>
      <span>{text}</span>
    </div>
  );
}

function FileDropzone({
  files,
  onSelect,
  multiple = false,
}: {
  files: File[];
  onSelect: (f: File[]) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`border-[1.5px] border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
        ${dragging ? "border-accent/30 bg-[#0d0d0d]" : "border-[#2a2a2a] hover:border-[#8cff2e]/20 hover:bg-[#0a0a0a]"}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
        onSelect(multiple ? dropped : dropped.slice(0, 1));
      }}
    >
      <input
        ref={ref}
        type="file"
        accept=".pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => { onSelect(Array.from(e.target.files || [])); e.target.value = ""; }}
      />
      {files.length === 0 ? (
        <>
          <div className="text-4xl mb-3 opacity-20">📄</div>
          <p className="text-white/35 text-sm">PDF 파일을 드래그하거나 클릭하여 업로드</p>
          {multiple && <p className="text-white/15 text-xs mt-1">여러 파일 선택 가능</p>}
        </>
      ) : (
        <div className="text-left space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              {multiple && (
                <span className="w-6 h-6 rounded-md bg-accent text-[#050505] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
              )}
              <span className="text-white/80 text-sm font-medium flex-1 truncate">📄 {f.name}</span>
              <span className="text-white/25 text-xs font-mono flex-shrink-0">{fmtSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccentButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-bold text-sm tracking-tight transition-all duration-200
        ${disabled
          ? "bg-white/5 text-white/20 cursor-not-allowed"
          : "bg-accent text-[#050505] shadow-[0_0_25px_rgba(140,255,46,0.15)] hover:shadow-[0_0_40px_rgba(140,255,46,0.25)] hover:-translate-y-0.5 active:translate-y-0"
        }`}
    >
      {children}
    </button>
  );
}

function DownloadButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-[#050505] shadow-[0_0_25px_rgba(140,255,46,0.15)] hover:shadow-[0_0_40px_rgba(140,255,46,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      {children}
    </button>
  );
}

// ─── Main Page ───
export default function Home() {
  const [tool, setTool] = useState<Tool>("unlock");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tool-specific state
  const [rangeInput, setRangeInput] = useState("");
  const [pagesInput, setPagesInput] = useState("");
  const [rotateDeg, setRotateDeg] = useState(90);
  const [rotateScope, setRotateScope] = useState<"all" | "specific">("all");
  const [rotatePagesInput, setRotatePagesInput] = useState("");
  const [splitMode, setSplitMode] = useState<"range" | "all">("range");

  // Result state
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultMulti, setResultMulti] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [pdfInfoResult, setPdfInfoResult] = useState<PdfInfo | null>(null);

  const addHistory = useCallback((action: string, file: string, ok: boolean) => {
    setHistory((prev) => [{ time: fmtTime(), action, file, ok }, ...prev].slice(0, 20));
  }, []);

  const switchTool = (t: Tool) => {
    setTool(t);
    setFiles([]);
    setMessage(null);
    setResultData(null);
    setResultMulti([]);
    setPdfInfoResult(null);
    setRangeInput("");
    setPagesInput("");
    setRotatePagesInput("");
    setSidebarOpen(false);
  };

  // ─── Execute ───
  const execute = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setMessage(null);
    setResultData(null);
    setResultMulti([]);

    try {
      switch (tool) {
        case "unlock": {
          const buf = await files[0].arrayBuffer();
          const data = await unlockPDF(buf);
          const name = files[0].name.replace(".pdf", "_unlocked.pdf");
          setResultData(data);
          setResultName(name);
          setMessage({ type: "success", text: "암호 해제 완료!" });
          addHistory("암호 해제", files[0].name, true);
          break;
        }

        case "merge": {
          const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
          const data = await mergePDFs(buffers);
          setResultData(data);
          setResultName("merged.pdf");
          const info = await getPdfInfo(data.buffer as ArrayBuffer);
          setMessage({ type: "success", text: `병합 완료! 총 ${info.pages}페이지` });
          addHistory("PDF 병합", `${files.length}개 파일`, true);
          break;
        }

        case "split": {
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf);
          const ranges = splitMode === "all"
            ? Array.from({ length: info.pages }, (_, i) => String(i + 1)).join(", ")
            : rangeInput;
          const results = await splitPDF(buf, ranges);
          setResultMulti(results);
          setMessage({ type: "success", text: `${results.length}개로 분할 완료!` });
          addHistory("PDF 분할", files[0].name, true);
          break;
        }

        case "extract": {
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf);
          const pages = parsePageRanges(pagesInput, info.pages);
          const data = await extractPages(buf, pages);
          setResultData(data);
          setResultName(files[0].name.replace(".pdf", "_extracted.pdf"));
          setMessage({ type: "success", text: `${pages.length}페이지 추출 완료!` });
          addHistory("페이지 추출", files[0].name, true);
          break;
        }

        case "rotate": {
          const buf = await files[0].arrayBuffer();
          let pageNums: number[] | undefined;
          if (rotateScope === "specific" && rotatePagesInput) {
            pageNums = rotatePagesInput.split(",").map((p) => parseInt(p.trim())).filter((n) => !isNaN(n));
          }
          const data = await rotatePages(buf, rotateDeg, pageNums);
          setResultData(data);
          setResultName(files[0].name.replace(".pdf", `_rot${rotateDeg}.pdf`));
          setMessage({ type: "success", text: "회전 완료!" });
          addHistory("페이지 회전", files[0].name, true);
          break;
        }

        case "info": {
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf);
          setPdfInfoResult(info);
          break;
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "처리 중 오류가 발생했습니다." });
      if (files[0]) addHistory(TOOLS.find((t) => t.id === tool)!.label, files[0].name, false);
    } finally {
      setProcessing(false);
    }
  };

  // Auto-execute for info tool
  const handleFiles = async (newFiles: File[]) => {
    setFiles(newFiles);
    setResultData(null);
    setResultMulti([]);
    setMessage(null);
    setPdfInfoResult(null);

    if (tool === "info" && newFiles.length > 0) {
      try {
        const buf = await newFiles[0].arrayBuffer();
        const info = await getPdfInfo(buf);
        setPdfInfoResult(info);
      } catch {
        setMessage({ type: "error", text: "PDF 정보를 읽을 수 없습니다." });
      }
    }
  };

  const activeTool = TOOLS.find((t) => t.id === tool)!;
  const canExecute = (() => {
    if (files.length === 0 || processing) return false;
    if (tool === "merge" && files.length < 2) return false;
    if (tool === "split" && splitMode === "range" && !rangeInput) return false;
    if (tool === "extract" && !pagesInput) return false;
    if (tool === "info") return false;
    return true;
  })();

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-white/60"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col z-40
          transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="px-6 py-6 text-center">
          <div className="text-2xl mb-1">🔐</div>
          <div className="text-base font-extrabold tracking-tight">
            PDF Toolkit <span className="text-accent">Pro</span>
          </div>
          <div className="text-[10px] text-white/15 tracking-[3px] uppercase mt-0.5">v2.0</div>
        </div>

        <div className="h-px bg-white/[0.04] mx-4" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTool(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${tool === t.id
                  ? "bg-accent/[0.08] text-accent border border-accent/[0.15]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent"
                }`}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="h-px bg-white/[0.04] mx-4" />

        {/* History */}
        {history.length > 0 && (
          <div className="px-4 py-4 max-h-60 overflow-y-auto">
            <div className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-2">작업 기록</div>
            {history.slice(0, 6).map((h, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${h.ok ? "bg-accent shadow-[0_0_6px_rgba(140,255,46,0.4)]" : "bg-red-400 shadow-[0_0_6px_rgba(255,100,100,0.4)]"}`} />
                <div>
                  <div className="text-[11px] text-white/40 leading-tight">
                    <span className="text-white/60 font-medium">{h.action}</span>
                    <br />
                    {h.file}
                  </div>
                  <div className="text-[9px] text-white/15 font-mono mt-0.5">{h.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-4">
          <div className="text-[10px] text-white/10 text-center">Built with Next.js & pdf-lib</div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-8 lg:py-12">
          {/* Hero */}
          <div className="relative text-center mb-10">
            <div className="hero-glow" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 bg-accent/[0.06] border border-accent/[0.1] text-accent text-[10px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-[1.5px] mb-5">
                <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_#8cff2e]" />
                All-in-One PDF Solution
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter leading-none">
                PDF Toolkit <span className="text-accent">Pro</span>
              </h1>
              <p className="text-white/35 text-sm mt-3 font-normal">
                암호 해제부터 병합, 분할, 추출까지 — 브라우저에서 바로 처리
              </p>
              <div className="flex justify-center gap-6 mt-5 flex-wrap">
                {["클라이언트 처리", "서버 저장 없음", "무료 사용"].map((f) => (
                  <span key={f} className="flex items-center gap-2 text-white/25 text-xs">
                    <span className="w-1 h-1 bg-accent rounded-full" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center gap-3.5 mb-1">
            <div className="w-11 h-11 rounded-xl bg-accent/[0.08] border border-accent/[0.1] flex items-center justify-center text-lg">
              {activeTool.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{activeTool.label}</h2>
              <p className="text-white/35 text-sm">{activeTool.desc}</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-5" />

          {/* Tool Content */}
          <div className="space-y-4">
            {/* File Upload */}
            <FileDropzone
              files={files}
              onSelect={handleFiles}
              multiple={tool === "merge" || tool === "unlock"}
            />

            {/* Tool-specific options */}
            {tool === "merge" && files.length > 0 && files.length < 2 && (
              <Toast type="warning" text="2개 이상의 파일을 업로드해주세요." />
            )}

            {tool === "split" && files.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["range", "all"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSplitMode(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                        ${splitMode === m
                          ? "bg-accent/[0.08] border-accent/[0.15] text-accent"
                          : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60"
                        }`}
                    >
                      {m === "range" ? "범위 지정" : "모든 페이지 개별"}
                    </button>
                  ))}
                </div>
                {splitMode === "range" && (
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="예: 1-3, 4-6, 7-10"
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15
                      focus:outline-none focus:border-accent/40 focus:shadow-[0_0_0_2px_rgba(140,255,46,0.06)] transition-all"
                  />
                )}
              </div>
            )}

            {tool === "extract" && files.length > 0 && (
              <input
                type="text"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder="예: 1, 3, 5, 7-10"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15
                  focus:outline-none focus:border-accent/40 focus:shadow-[0_0_0_2px_rgba(140,255,46,0.06)] transition-all"
              />
            )}

            {tool === "rotate" && files.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-white/30 mb-1.5 block">회전 각도</label>
                    <select
                      value={rotateDeg}
                      onChange={(e) => setRotateDeg(Number(e.target.value))}
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white
                        focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer"
                    >
                      <option value={90}>↻ 90°</option>
                      <option value={180}>↻ 180°</option>
                      <option value={270}>↻ 270°</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-white/30 mb-1.5 block">적용 범위</label>
                    <div className="flex gap-2">
                      {(["all", "specific"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setRotateScope(s)}
                          className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium border transition-all
                            ${rotateScope === s
                              ? "bg-accent/[0.08] border-accent/[0.15] text-accent"
                              : "bg-[#111] border-[#2a2a2a] text-white/40 hover:text-white/60"
                            }`}
                        >
                          {s === "all" ? "전체" : "특정"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {rotateScope === "specific" && (
                  <input
                    type="text"
                    value={rotatePagesInput}
                    onChange={(e) => setRotatePagesInput(e.target.value)}
                    placeholder="예: 1, 3, 5"
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15
                      focus:outline-none focus:border-accent/40 focus:shadow-[0_0_0_2px_rgba(140,255,46,0.06)] transition-all"
                  />
                )}
              </div>
            )}

            {/* Execute Button */}
            {tool !== "info" && files.length > 0 && (
              <AccentButton onClick={execute} disabled={!canExecute}>
                {processing ? "처리 중..." : `${activeTool.label} 실행`}
              </AccentButton>
            )}

            {/* Messages */}
            {message && <Toast type={message.type} text={message.text} />}

            {/* Results: Single file */}
            {resultData && (
              <DownloadButton onClick={() => download(resultData, resultName)}>
                📥 {resultName} 다운로드
              </DownloadButton>
            )}

            {/* Results: Multiple files */}
            {resultMulti.length > 0 && (
              <div className="space-y-2">
                {resultMulti.length > 1 && (
                  <DownloadButton onClick={() => downloadZip(resultMulti)}>
                    📥 {resultMulti.length}개 파일 다운로드 (ZIP)
                  </DownloadButton>
                )}
                {resultMulti.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => download(r.data, r.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]
                      hover:border-accent/20 hover:bg-white/[0.04] transition-all text-left"
                  >
                    <span className="text-white/80 text-sm font-medium flex-1">{r.name}</span>
                    <span className="text-accent text-xs font-medium">다운로드</span>
                  </button>
                ))}
              </div>
            )}

            {/* PDF Info Result */}
            {tool === "info" && pdfInfoResult && (
              <div className="space-y-4 animate-fadeIn">
                {pdfInfoResult.encrypted ? (
                  <Toast type="warning" text="이 PDF는 암호로 보호되어 있습니다." />
                ) : (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { icon: "📑", val: String(pdfInfoResult.pages), label: "Pages" },
                        { icon: "💾", val: files[0] ? fmtSize(files[0].size) : "—", label: "Size" },
                        { icon: "🔐", val: "No", label: "Encrypted" },
                        {
                          icon: "📊",
                          val: files[0] ? fmtSize(Math.round(files[0].size / Math.max(pdfInfoResult.pages, 1))) : "—",
                          label: "Per Page",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 text-center
                            hover:border-accent/[0.1] hover:-translate-y-0.5 transition-all"
                        >
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="text-lg font-extrabold font-mono text-white">{s.val}</div>
                          <div className="text-[10px] text-white/25 uppercase tracking-wider mt-1 font-semibold">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Metadata Table */}
                    <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden">
                      <div className="px-4 py-3 bg-white/[0.02] border-b border-[#1e1e1e]">
                        <h3 className="text-sm font-semibold text-white/60">메타데이터</h3>
                      </div>
                      {[
                        ["제목", pdfInfoResult.title],
                        ["저자", pdfInfoResult.author],
                        ["생성 프로그램", pdfInfoResult.creator],
                        ["프로듀서", pdfInfoResult.producer],
                      ].map(([k, v], i) => (
                        <div
                          key={i}
                          className={`flex px-4 py-3 text-sm hover:bg-white/[0.02] transition-colors
                            ${i < 3 ? "border-b border-[#1a1a1a]" : ""}`}
                        >
                          <span className="w-32 text-white/30 font-medium flex-shrink-0">{k}</span>
                          <span className="text-white/80">{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 text-center relative">
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <p className="text-[11px] text-white/10 leading-relaxed">
              <span className="font-bold text-accent/40">PDF Toolkit Pro</span> — 모든 처리는 브라우저에서 이루어지며 서버에 저장되지 않습니다
              <br />
              Built with Next.js & pdf-lib
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
