const SENDER_STYLES = {
  ADMIN: { align: 'justify-end', bubble: 'bg-ink-900 text-white', label: 'You' },
  USER: { align: 'justify-start', bubble: 'bg-white border border-slate-200 text-slate-950', label: null },
  AI: { align: 'justify-start', bubble: 'bg-surface-muted text-slate-950', label: 'AI Assistant' },
  SYSTEM: { align: 'justify-center', bubble: 'bg-transparent text-slate-500 text-xs italic', label: null },
};

function formatTime(value) {
  if (!value) return '';
  const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const style = SENDER_STYLES[message.senderType] || SENDER_STYLES.USER;

  if (message.senderType === 'SYSTEM') {
    return <div className="flex justify-center py-1 text-xs italic text-slate-500">{message.message}</div>;
  }

  return (
    <div className={`flex ${style.align}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${style.bubble}`}>
        {style.label && <p className="mb-0.5 text-xs font-medium opacity-70">{style.label}</p>}
        <p className="whitespace-pre-wrap text-sm">{message.message}</p>
        <p className={`mt-1 text-right text-[10px] ${message.senderType === 'ADMIN' ? 'text-white/50' : 'text-slate-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
