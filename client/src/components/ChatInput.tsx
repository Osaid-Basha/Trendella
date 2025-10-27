import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

interface ChatInputProps {
  onSend: (value: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, isDisabled = false, placeholder }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setValue("");
      resizeTextarea();
    },
    [onSend, resizeTextarea, value]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isDisabled) return;
      onSend(trimmed);
      setValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-brand dark:border-slate-800 dark:bg-slate-900"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Tell me about the recipient or refine the ideas..."}
        className="min-h-[44px] max-h-[160px] flex-1 resize-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        disabled={isDisabled}
        aria-label="Gift chat message"
      />
      <button
        type="submit"
        disabled={isDisabled || value.trim().length === 0}
        className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Send
      </button>
    </form>
  );
};
