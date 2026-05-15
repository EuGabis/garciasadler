"use client";

import { useEffect, useRef } from "react";
import { getPusherClient, workspaceChannel } from "@/lib/pusher-client";

const BASE_TITLE = "Garcia Sadler";

function playBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // áudio bloqueado (usuário ainda não interagiu) — sem problema
  }
}

export function Notifications({ workspaceId }: { workspaceId: string }) {
  const countRef = useRef(0);

  useEffect(() => {
    document.title = BASE_TITLE;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(workspaceChannel(workspaceId));

    const onNewMessage = () => {
      if (document.hidden) {
        countRef.current += 1;
        document.title = `(${countRef.current}) ${BASE_TITLE}`;
      }
      playBeep();
    };

    const onVisible = () => {
      if (!document.hidden) {
        countRef.current = 0;
        document.title = BASE_TITLE;
      }
    };

    channel.bind("message:new", onNewMessage);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      channel.unbind("message:new", onNewMessage);
      document.removeEventListener("visibilitychange", onVisible);
      pusher.unsubscribe(workspaceChannel(workspaceId));
    };
  }, [workspaceId]);

  return null;
}
