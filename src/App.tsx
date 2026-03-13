import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RotateCw01Icon, Cancel01Icon, Add01Icon } from "hugeicons-react";

interface Topic {
  id: number;
  text: string;
  done: boolean;
}

const INITIAL_TOPICS: Topic[] = [
  { id: 1, text: "Introdução e contexto", done: false },
  { id: 2, text: "Problema que será resolvido", done: false },
  { id: 3, text: "Metodologia utilizada", done: false },
  { id: 4, text: "Resultados obtidos", done: false },
  { id: 5, text: "Conclusão e próximos passos", done: false },
];

export default function App() {
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [current, setCurrent] = useState(0);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, topics.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        markDone(current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [topics, current]);

  function markDone(index: number) {
    setTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    );
    const next = topics.findIndex((t, i) => i > index && !t.done);
    if (next !== -1) setCurrent(next);
  }

  function addTopic() {
    const text = newText.trim();
    if (!text) return;
    setTopics((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setNewText("");
    inputRef.current?.focus();
  }

  function removeTopic(id: number) {
    setTopics((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (current >= next.length) setCurrent(Math.max(0, next.length - 1));
      return next;
    });
  }

  function resetAll() {
    setTopics((prev) => prev.map((t) => ({ ...t, done: false })));
    setCurrent(0);
  }

  const doneCount = topics.filter((t) => t.done).length;
  const progress = topics.length > 0 ? (doneCount / topics.length) * 100 : 0;

  return (
    <div className="h-screen flex flex-col bg-[rgba(10,10,14,0.82)] backdrop-blur-xl border border-white/[0.08] rounded-xl text-[#e8e8e8] overflow-hidden select-none">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.08] cursor-grab active:cursor-grabbing"
        data-tauri-drag-region
      >
        <span className="font-['IBM_Plex_Mono'] text-[11px] tracking-[0.12em] uppercase text-[#7ee8a2] opacity-80">
          ◉ echoes
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-[26px] w-[26px] text-white/30 border border-white/[0.08] rounded-md hover:text-[#e8e8e8] hover:border-white/20 hover:bg-white/[0.04] text-[13px] cursor-pointer"
          onClick={resetAll}
          title="Reiniciar"
        >
          <RotateCw01Icon size={13} color="currentColor" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.08] mx-3.5">
        <div
          className="h-full bg-[#7ee8a2] transition-[width] duration-300 rounded-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-2 text-white/30 text-xs text-center p-5">
            <div className="text-3xl opacity-40">📋</div>
            <span>Adicione seus tópicos abaixo</span>
          </div>
        ) : (
          topics.map((topic, index) => (
            <div
              key={topic.id}
              ref={index === current ? activeRef : null}
              className={cn(
                "group flex items-start gap-2 px-2.5 py-2 rounded-lg border border-transparent cursor-pointer transition-all duration-150",
                index === current
                  ? "bg-[rgba(126,232,162,0.15)] border-[rgba(126,232,162,0.25)]"
                  : "hover:bg-white/[0.04] hover:border-white/[0.08]",
                topic.done && "opacity-35"
              )}
              onClick={() => setCurrent(index)}
              onDoubleClick={() => markDone(index)}
            >
              <span
                className={cn(
                  "font-['IBM_Plex_Mono'] text-[10px] text-white/30 min-w-[16px] pt-0.5",
                  index === current && "text-[#7ee8a2]"
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] leading-relaxed flex-1 break-words",
                  index === current && "text-white font-semibold"
                )}
              >
                {topic.text}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 bg-transparent border-none text-[rgba(255,100,100,0.7)] cursor-pointer text-sm px-0.5 transition-opacity duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTopic(topic.id);
                }}
              >
                <Cancel01Icon size={13} color="currentColor" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Keyboard hint */}
      <div className="text-center font-['IBM_Plex_Mono'] text-[9px] text-white/30 py-1 tracking-[0.05em]">
        ↑↓ navegar · space marcar · duplo clique marcar
      </div>

      {/* Add area */}
      <div className="px-2.5 pt-2.5 pb-3 border-t border-white/[0.08] flex gap-1.5">
        <Input
          ref={inputRef}
          className="flex-1 bg-white/[0.04] border-white/[0.08] rounded-lg text-[#e8e8e8] text-xs placeholder:text-white/30 focus-visible:border-[rgba(126,232,162,0.4)] focus-visible:ring-0 h-8 px-2.5"
          placeholder="Novo tópico..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTopic()}
        />
        <Button
          className="bg-[rgba(126,232,162,0.15)] border border-[rgba(126,232,162,0.25)] rounded-lg text-[#7ee8a2] text-lg w-8 h-8 flex-shrink-0 p-0 hover:bg-[rgba(126,232,162,0.25)] cursor-pointer"
          onClick={addTopic}
        >
          <Add01Icon size={16} color="currentColor" />
        </Button>
      </div>
    </div>
  );
}
