// pages/go-message.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureConversationAndGo } from '../lib/chat';

export default function GoMessage() {
  const router = useRouter();
  const { listingId, recipientId, to, userId } = router.query;
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const l = String(listingId || '');
    const other = String(recipientId || to || userId || '');
    if (!l || !other) { setErr('Missing listingId or recipient'); return; }

    (async () => {
      try {
        await ensureConversationAndGo(router, { listingId: l, otherUserId: other });
      } catch (e) {
        setErr(e?.message || 'Failed to open chat');
      }
    })();
  }, [router.isReady, listingId, recipientId, to, userId]); // run once when ready

  if (err) return <div style={{ padding: 20 }}>Couldn’t start chat: {err}</div>;
  return <div style={{ padding: 20 }}>Opening chat…</div>;
}
