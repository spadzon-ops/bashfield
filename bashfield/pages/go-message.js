import { ensureConversation } from "../lib/chat";

export default function GoMessage() {
  // This page exists only to trigger creation of a conversation
  // and then redirect to the chat page handled by router logic.
  return null;
}

export async function getServerSideProps(context) {
  const { listingId } = context.query || {};
  if (!listingId) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  const convo = await ensureConversation({ listingId, context });

  return {
    redirect: {
      destination: `/chat/${encodeURIComponent(listingId)}?c=${encodeURIComponent(
        convo?.id || ""
      )}`,
      permanent: false,
    },
  };
}
