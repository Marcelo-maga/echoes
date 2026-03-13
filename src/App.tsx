import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  PlayIcon,
  RotateClockwiseIcon,
  ArrowDown01Icon,
  TextFontIcon,
  LayoutLeftIcon,
} from "@hugeicons/core-free-icons";
import "./App.css";

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = "edit" | "present";

const PLACEHOLDER = `Escreva seu roteiro aqui...

Pode ser anotações soltas, tópicos, parágrafos completos — qualquer coisa que você queira ter como guia durante a gravação.

Pressione o botão ▶ para entrar no modo leitura.`;

// ─── Componente principal ────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>("edit");
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(15);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30); // px/s
  const [showControls, setShowControls] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto-scroll em Present mode ────────────────────────────────────────
  useEffect(() => {
    if (mode !== "present" || !autoScroll) {
      if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
      return;
    }

    // Base UI uses data-slot="scroll-area-viewport" instead of Radix's data attribute
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;

    if (!viewport) return;

    const pxPerTick = scrollSpeed / 60;

    scrollTimerRef.current = setInterval(() => {
      viewport.scrollTop += pxPerTick;
    }, 1000 / 60);

    return () => {
      if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    };
  }, [mode, autoScroll, scrollSpeed]);

  // ── Parar auto-scroll ao trocar de modo ───────────────────────────────
  useEffect(() => {
    if (mode === "edit") {
      setAutoScroll(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [mode]);

  // ── Snap de janela via Ctrl+Arrow ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const positions: Record<string, string> = {
          ArrowRight: "right",
          ArrowLeft: "left",
          ArrowUp: "top-right",
          ArrowDown: "bottom-right",
        };
        const pos = positions[e.key];
        if (pos) invoke("snap_window", { position: pos });
      }
      if (e.key === "Escape" && mode === "present") {
        setMode("edit");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

  const wordCount =
    text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  const handleReset = useCallback(() => {
    if (mode === "present") {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      if (viewport) viewport.scrollTop = 0;
    } else {
      setText("");
    }
  }, [mode]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delay={400}>
      <div
        className="h-screen flex flex-col rounded-[14px] border overflow-hidden select-none"
        style={{
          background: "rgba(9, 8, 6, 0.88)",
          borderColor: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          color: "#ede8df",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
          data-tauri-drag-region
        >
          {/* Logo + badge */}
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <span
              className="text-[11px] tracking-[0.14em] uppercase"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#e8b96a",
                opacity: 0.75,
              }}
            >
              echoes
            </span>
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] tracking-widest uppercase border-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background:
                  mode === "present"
                    ? "rgba(232,185,106,0.15)"
                    : "rgba(255,255,255,0.05)",
                color:
                  mode === "present"
                    ? "#e8b96a"
                    : "rgba(237,232,223,0.35)",
              }}
            >
              {mode === "edit" ? "edit" : "live"}
            </Badge>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1">
            {/* Controles (font size + auto-scroll) */}
            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center justify-center h-6 w-6 rounded-md transition-colors cursor-pointer"
                style={{
                  color: showControls
                    ? "#e8b96a"
                    : "rgba(237,232,223,0.3)",
                  background: showControls
                    ? "rgba(232,185,106,0.1)"
                    : "transparent",
                }}
                onClick={() => setShowControls((v) => !v)}
              >
                <HugeiconsIcon icon={LayoutLeftIcon} size={12} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Controles
              </TooltipContent>
            </Tooltip>

            {/* Reset */}
            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center justify-center h-6 w-6 rounded-md transition-colors cursor-pointer"
                style={{ color: "rgba(237,232,223,0.3)" }}
                onClick={handleReset}
              >
                <HugeiconsIcon icon={RotateClockwiseIcon} size={12} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {mode === "edit" ? "Limpar texto" : "Voltar ao topo"}
              </TooltipContent>
            </Tooltip>

            {/* Mode toggle */}
            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center justify-center h-6 w-6 rounded-md transition-all duration-150 cursor-pointer"
                style={{
                  background:
                    mode === "present"
                      ? "rgba(232,185,106,0.2)"
                      : "rgba(232,185,106,0.12)",
                  border: "1px solid rgba(232,185,106,0.2)",
                  color: "#e8b96a",
                }}
                onClick={() =>
                  setMode((m) => (m === "edit" ? "present" : "edit"))
                }
              >
                <HugeiconsIcon
                  icon={mode === "edit" ? PlayIcon : Edit01Icon}
                  size={11}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {mode === "edit"
                  ? "Modo leitura (▶)"
                  : "Modo edição (Esc)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Painel de controles (colapsável) ───────────────────────── */}
        {showControls && (
          <div
            className="px-3 py-2.5 border-b flex flex-col gap-3 mode-enter"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            {/* Tamanho da fonte */}
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={TextFontIcon}
                size={11}
                color="rgba(237,232,223,0.3)"
              />
              <span
                className="text-[10px] w-14 shrink-0"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(237,232,223,0.3)",
                }}
              >
                Fonte {fontSize}px
              </span>
              <Slider
                min={11}
                max={26}
                step={1}
                value={[fontSize]}
                onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
                className="flex-1"
              />
            </div>

            <Separator style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Auto-scroll */}
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={11}
                color="rgba(237,232,223,0.3)"
              />
              <span
                className="text-[10px] w-14 shrink-0"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(237,232,223,0.3)",
                }}
              >
                Auto-scroll
              </span>
              <Switch
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
                disabled={mode !== "present"}
                className="scale-75 origin-left"
              />
              {autoScroll && (
                <Slider
                  min={5}
                  max={80}
                  step={5}
                  value={[scrollSpeed]}
                  onValueChange={(v) => setScrollSpeed(Array.isArray(v) ? v[0] : v)}
                  className="flex-1"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Área principal ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {/* EDIT MODE */}
          {mode === "edit" && (
            <div className="h-full p-3 mode-enter">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                className="echoes-editor border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full"
                style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
              />
            </div>
          )}

          {/* PRESENT MODE */}
          {mode === "present" && (
            <ScrollArea ref={scrollAreaRef} className="h-full mode-enter">
              <div className="p-4 pb-16">
                {text.trim() === "" ? (
                  <p
                    className="text-center italic"
                    style={{
                      color: "rgba(237,232,223,0.2)",
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: `${fontSize}px`,
                      marginTop: "30%",
                    }}
                  >
                    Nenhum texto ainda.
                    <br />
                    <span
                      className="text-[11px] not-italic"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Pressione Esc para editar.
                    </span>
                  </p>
                ) : (
                  <p
                    className="present-text"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {text}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-3 py-1.5 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <span
            className="text-[9px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(237,232,223,0.2)",
            }}
          >
            {mode === "edit"
              ? `${wordCount} palavra${wordCount !== 1 ? "s" : ""}`
              : "esc \u2192 editar \u00b7 ctrl+\u2191\u2193\u2190\u2192 mover"}
          </span>
          {autoScroll && mode === "present" && (
            <span
              className="text-[9px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(232,185,106,0.5)",
              }}
            >
              ● scroll {scrollSpeed}px/s
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
