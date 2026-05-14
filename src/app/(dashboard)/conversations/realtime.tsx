"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient, workspaceChannel } from "@/lib/pusher-client";

export function ConversationsRealtime({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(workspaceChannel(workspaceId));

    const handler = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 400) return;
      lastRefreshRef.current = now;
      router.refresh();
    };

    channel.bind("message:new", handler);
    channel.bind("conversation:updated", handler);

    return () => {
      channel.unbind("message:new", handler);
      channel.unbind("conversation:updated", handler);
      pusher.unsubscribe(workspaceChannel(workspaceId));
    };
  }, [workspaceId, router]);

  return null;
}
