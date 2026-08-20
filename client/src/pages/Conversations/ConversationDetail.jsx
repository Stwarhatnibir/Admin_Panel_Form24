import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import conversationService from '../../services/conversationService';
import applicationService from '../../services/applicationService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import { SkeletonBlock } from '../../components/common/Skeleton';
import StatusBadge from '../../components/applications/StatusBadge';
import MessageBubble from '../../components/conversations/MessageBubble';
import { CONVERSATION_STATE_LABELS, CONVERSATION_STATE_TONES } from '../../constants/conversationStates';

// Polling interval for "near real-time" updates. See PHASES.md for why
// this project polls rather than using Firestore client-side listeners -
// short version: listeners would require minting Firebase custom auth
// tokens from this JWT-based backend, which is a real architectural
// addition, not a small tweak. Polling is an explicitly permitted
// "equivalent real-time mechanism" per spec Section 46, and is simple and
// honest about what it does.
const POLL_INTERVAL_MS = 4000;

function toIsoString(timestamp) {
  if (!timestamp) return null;
  const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
  return date.toISOString();
}

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [notes, setNotes] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const scrollRef = useRef(null);
  const latestMessageTimeRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  const loadInitial = useCallback(async () => {
    setLoadState('loading');
    try {
      const conv = await conversationService.getConversation(id);
      const msgs = await conversationService.listMessages(id);
      setConversation(conv);
      setMessages(msgs);
      if (msgs.length > 0) {
        latestMessageTimeRef.current = toIsoString(msgs[msgs.length - 1].createdAt);
      }
      setLoadState('loaded');
      scrollToBottom();

      applicationService
        .listNotes(conv.applicationId)
        .then(setNotes)
        .catch(() => setNotes([]));
    } catch (err) {
      setError(err.message || 'Unable to load this conversation.');
      setLoadState('error');
    }
  }, [id, scrollToBottom]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Poll for new messages while this page is open.
  useEffect(() => {
    if (loadState !== 'loaded') return undefined;

    pollRef.current = setInterval(async () => {
      try {
        const newMessages = await conversationService.listMessages(id, {
          since: latestMessageTimeRef.current || undefined,
        });
        if (newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const toAppend = newMessages.filter((m) => !existingIds.has(m.id));
            return toAppend.length > 0 ? [...prev, ...toAppend] : prev;
          });
          latestMessageTimeRef.current = toIsoString(newMessages[newMessages.length - 1].createdAt);
          scrollToBottom();
        }
      } catch {
        // Silent - a single missed poll isn't worth surfacing an error toast for.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [id, loadState, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const sent = await conversationService.sendMessage(id, text);
      setMessages((prev) => [...prev, sent]);
      latestMessageTimeRef.current = toIsoString(sent.createdAt);
      setDraft('');
      scrollToBottom();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to send message.' });
    } finally {
      setSending(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !conversation) return;
    setAddingNote(true);
    try {
      await applicationService.addNote(conversation.applicationId, noteText.trim());
      setNoteText('');
      const updated = await applicationService.listNotes(conversation.applicationId);
      setNotes(updated);
      setToast({ type: 'success', message: 'Note added.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to add note.' });
    } finally {
      setAddingNote(false);
    }
  };

  if (loadState === 'error') return <ErrorState message={error} onRetry={loadInitial} />;
  if (loadState === 'loading') {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-[28rem] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/conversations')}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft size={15} /> Back to Conversations
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chat panel */}
        <div className="card flex h-[32rem] flex-col lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-slate-950">{conversation.userName}</p>
              <p className="text-xs text-slate-500">{conversation.schemeName}</p>
            </div>
            <StatusBadge
              label={CONVERSATION_STATE_LABELS[conversation.state] || conversation.state}
              tone={CONVERSATION_STATE_TONES[conversation.state] || 'bg-slate-100 text-slate-700'}
            />
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <EmptyState title="No messages yet." />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Reply to the user…"
              className="input-field flex-1"
            />
            <button type="submit" disabled={sending || !draft.trim()} className="btn-primary">
              <Send size={15} />
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="font-display text-sm font-semibold text-slate-950">Quick links</p>
            <div className="mt-3 space-y-2">
              <Link to={`/users/${conversation.userId}`} className="block text-sm font-medium text-accent-dark hover:underline">
                View user profile →
              </Link>
              <Link to={`/applications/${conversation.applicationId}`} className="block text-sm font-medium text-accent-dark hover:underline">
                View application →
              </Link>
            </div>
            <div className="mt-3 rounded-lg bg-surface-muted p-3">
              <p className="text-xs text-slate-500">
                Request information, request document, and request OTP are available from the Overview and
                Documents tabs on the application page linked above.
              </p>
            </div>
          </div>

          <div className="card p-4">
            <p className="font-display text-sm font-semibold text-slate-950">Internal notes</p>
            <p className="mt-0.5 text-xs text-slate-500">Never sent to the user.</p>
            <div className="mt-3 flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="input-field flex-1 resize-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              className="btn-secondary mt-2 w-full"
            >
              {addingNote ? 'Adding…' : 'Add note'}
            </button>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {notes === null ? (
                <SkeletonBlock className="h-12 w-full" />
              ) : notes.length === 0 ? (
                <p className="text-xs text-slate-500">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="rounded-lg bg-surface-muted p-2.5">
                    <p className="text-xs text-slate-950">{n.note}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{n.createdByName}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
