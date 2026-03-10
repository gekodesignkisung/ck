'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChannelPanel from '@/components/ChannelPanel';
import type { Member, Message, Panel, RecentFile } from '@/types';
import { WORKING_TASKS, AI_AGENTS } from '@/lib/constants';

const CHANNEL_INFO: Record<string, { name: string; color: string; defaultMembers: Member[] }> = {
  'ch-general': { name: 'General', color: '#f3e3ba', defaultMembers: [] },
  'ch-sample':  { name: 'Sample',  color: '#bcf3ba', defaultMembers: [AI_AGENTS[0], AI_AGENTS[1], AI_AGENTS[2]] },
  'ch-test':    { name: 'Test project', color: '#baf3f3', defaultMembers: [AI_AGENTS[0]] },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializePanel(p: any): Panel {
  return {
    ...p,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: p.messages?.map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachedFiles: p.attachedFiles?.map((f: any) => ({ ...f, updatedAt: new Date(f.updatedAt) })),
  };
}

function serializePanel(p: Panel): object {
  return {
    ...p,
    messages: p.messages?.map((m) => ({ ...m, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt })),
    attachedFiles: p.attachedFiles?.map((f) => ({ ...f, updatedAt: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : f.updatedAt })),
  };
}

export default function StandaloneChannelPage() {
  const params = useParams();
  const wsId = params.id as string;
  const chId = params.chId as string;
  const chInfo = CHANNEL_INFO[chId];

  const isLoaded = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 전체 워크스페이스 데이터 캐시 (채널 저장 시 병합용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsDataRef = useRef<any>(null);
  // 사용자가 직접 메시지를 보낼 때만 저장 (폴링 업데이트 시 저장 방지)
  const locallyModified = useRef(false);

  const [currentUser] = useState<Member>({
    id: 'me',
    name: 'User Name',
    email: 'Username@company.com',
    color: '#80d96f',
    initial: 'U',
    isMe: true,
    status: 'awake',
  });
  const [members, setMembers] = useState<Member[]>([currentUser, ...AI_AGENTS]);
  const [panel, setPanel] = useState<Panel>({
    id: chId,
    type: 'channel',
    title: chInfo?.name ?? chId,
    color: chInfo?.color,
    selectedMembers: chInfo?.defaultMembers ?? [],
    attachedFiles: [],
    messages: [],
  });

  // 로드: Blob → localStorage 순으로 채널 패널 데이터 복원
  useEffect(() => {
    async function loadData() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let wsData: any = null;

      // 1) Blob에서 로드
      try {
        const res = await fetch(`/api/ws-data?id=${wsId}`);
        if (res.ok) wsData = await res.json();
      } catch { /* 무시 */ }

      // 2) localStorage 폴백
      if (!wsData) {
        const stored = localStorage.getItem(`craken_ws_data_${wsId}`);
        if (stored) {
          try { wsData = JSON.parse(stored); } catch { /* 무시 */ }
        }
      }

      if (wsData) {
        wsDataRef.current = wsData;
        // openPanels 또는 closedPanels에서 채널 패널 찾기
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allPanels: any[] = [
          ...(wsData.openPanels ?? []),
          ...Object.values(wsData.closedPanels ?? {}),
        ];
        const found = allPanels.find((p) => p.id === chId);
        if (found) {
          setPanel(deserializePanel(found));
        }
        // 멤버 복원
        if (wsData.members) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const others = (wsData.members as any[]).filter((m: any) => !m.isMe) as Member[];
          setMembers([currentUser, ...others]);
        }
      }

      isLoaded.current = true;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, chId]);

  // workingTask 랜덤 배정
  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) =>
        m.status === 'working' && !m.workingTask
          ? { ...m, workingTask: WORKING_TASKS[Math.floor(Math.random() * WORKING_TASKS.length)] }
          : m
      )
    );
  }, []);

  // 사용자가 직접 메시지를 보낼 때만 Blob 저장 (폴링 업데이트 시 저장 안 함)
  useEffect(() => {
    if (!isLoaded.current || !locallyModified.current) return;
    locallyModified.current = false;

    const wsData = wsDataRef.current ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openPanels: any[] = [...(wsData.openPanels ?? [])];
    const idx = openPanels.findIndex((p) => p.id === chId);
    const serialized = serializePanel(panel);
    if (idx >= 0) openPanels[idx] = serialized;
    else openPanels.push(serialized);

    const newWsData = { ...wsData, openPanels, members };
    wsDataRef.current = newWsData;

    localStorage.setItem(`craken_ws_data_${wsId}`, JSON.stringify(newWsData));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/ws-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wsId, data: newWsData }),
      }).catch(() => {});
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // 8초마다 Blob 폴링 → 다른 창에서 추가된 메시지 반영
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!isLoaded.current) return;
      try {
        const res = await fetch(`/api/ws-data?id=${wsId}`);
        if (!res.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wsData: any = await res.json();
        if (!wsData) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allPanels: any[] = [...(wsData.openPanels ?? []), ...Object.values(wsData.closedPanels ?? {})];
        const found = allPanels.find((p) => p.id === chId);
        if (found) {
          // wsDataRef를 최신 서버 데이터로 갱신
          wsDataRef.current = wsData;
          setPanel((prev) => {
            const sp = deserializePanel(found);
            const pMsgs = prev.messages ?? [];
            const sMsgs = sp.messages ?? [];
            // ID 기준 합집합 병합 → 어느 쪽도 메시지를 잃지 않음
            const mergedMap = new Map<string, Message>();
            for (const m of pMsgs) mergedMap.set(m.id, m);
            for (const m of sMsgs) if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return merged.length > pMsgs.length ? { ...prev, messages: merged } : prev;
          });
        }
      } catch { /* 무시 */ }
    }, 8000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, chId]);

  const updatePanel = useCallback((_id: string, updates: Partial<Panel>) => {
    locallyModified.current = true;
    setPanel((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="h-screen">
      <ChannelPanel
        panel={panel}
        allMembers={members}
        currentUser={currentUser}
        onUpdatePanel={updatePanel}
      />
    </div>
  );
}
