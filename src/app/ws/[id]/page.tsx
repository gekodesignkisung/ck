'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChannelPanel from '@/components/ChannelPanel';
import FilePanel from '@/components/FilePanel';
import type { Channel, Member, RecentFile, Panel, Message } from '@/types';
import { WORKING_TASKS, AI_AGENTS, INITIAL_FILES } from '@/lib/constants';

// ── Static seed data ─────────────────────────────────────────────────────────

const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-general', name: 'General', color: '#f3e3ba', fileCount: 2, memberCount: 2 },
  { id: 'ch-sample', name: 'Sample', color: '#bcf3ba', fileCount: 2, memberCount: 3 },
  { id: 'ch-test', name: 'Test project', color: '#baf3f3', fileCount: 0, memberCount: 1 },
];

const COLOR_PALETTE: Channel['color'][] = [
  '#f3e3ba', '#bcf3ba', '#baf3f3', '#f3baf3', '#f3bad3',
];

// ── Persistence helpers ────────────────────────────────────────────────────────

function serializePanel(p: Panel): object {
  return {
    ...p,
    messages: p.messages?.map((m) => ({ ...m, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt })),
    attachedFiles: p.attachedFiles?.map((f) => ({ ...f, updatedAt: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : f.updatedAt })),
  };
}

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

function wsStorageKey(wsId: string) {
  return `craken_ws_data_${wsId}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const panelScrollRef = useRef<HTMLDivElement>(null);
  // 닫힌 패널 상태 보존 (key: panelId)
  const panelStore = useRef<Record<string, Panel>>({});
  // 초기 로드 완료 전에는 저장하지 않음
  const isLoaded = useRef(false);
  // 사용자 직접 변경 시에만 Blob 저장 (폴링 업데이트 시 저장 방지)
  const locallyModified = useRef(false);
  // 서버 저장 디바운스 타이머
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [workspaceName, setWorkspaceName] = useState('');
  const [currentUser, setCurrentUser] = useState<Member>({
    id: 'me',
    name: 'Me',
    email: '',
    color: '#80d96f',
    initial: 'M',
    isMe: true,
    status: 'awake',
  });
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [members, setMembers] = useState<Member[]>([...AI_AGENTS]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(INITIAL_FILES);
  const [openPanels, setOpenPanels] = useState<Panel[]>([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const el = panelScrollRef.current;
      if (!el) return;
      const panelWidth = el.clientWidth / Math.min(openPanels.length, 3);
      if (e.key === 'ArrowRight') el.scrollBy({ left: panelWidth, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -panelWidth, behavior: 'smooth' });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPanels.length]);

  // Load workspace data (server-first, localStorage fallback)
  useEffect(() => {
    const me: Member = {
      id: 'me',
      name: 'User Name',
      email: 'Username@company.com',
      color: '#80d96f',
      initial: 'U',
      isMe: true,
      status: 'awake',
    };
    setCurrentUser(me);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyData(parsed: any, me: Member) {
      if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
      if (parsed.channels) setChannels(parsed.channels);
      if (parsed.members) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const others = (parsed.members as any[]).filter((m: any) => !m.isMe) as Member[];
        setMembers([me, ...others]);
      } else {
        setMembers([me, ...AI_AGENTS]);
      }
      if (parsed.recentFiles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRecentFiles((parsed.recentFiles as any[]).map((f: any) => ({ ...f, updatedAt: new Date(f.updatedAt) })));
      }
      if (parsed.openPanels && parsed.openPanels.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOpenPanels((parsed.openPanels as any[]).map(deserializePanel));
      } else {
        setOpenPanels([{ id: 'ch-general', type: 'channel', title: 'General', selectedMembers: [], attachedFiles: [], messages: [] }]);
      }
      if (parsed.closedPanels) {
        panelStore.current = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.entries(parsed.closedPanels).map(([k, v]) => [k, deserializePanel(v as any)])
        );
      }
    }

    async function loadData() {
      // 1) 서버(KV)에서 먼저 로드 시도
      try {
        const res = await fetch(`/api/ws-data?id=${id}`);
        if (res.ok) {
          const serverData = await res.json();
          if (serverData) {
            applyData(serverData, me);
            isLoaded.current = true;
            return;
          }
        }
      } catch { /* KV 미설정 시 무시 */ }

      // 2) localStorage 폴백
      const storedWs = localStorage.getItem('craken_workspaces');
      if (storedWs) {
        const wsList = JSON.parse(storedWs) as Array<{ id: string; name: string }>;
        const ws = wsList.find((w) => w.id === id);
        if (ws) setWorkspaceName(ws.name);
      }
      const storedData = localStorage.getItem(wsStorageKey(id));
      if (storedData) {
        try { applyData(JSON.parse(storedData), me); } catch { setMembers([me, ...AI_AGENTS]); }
      } else {
        setMembers([me, ...AI_AGENTS]);
        setOpenPanels([{ id: 'ch-general', type: 'channel', title: 'General', selectedMembers: [], attachedFiles: [], messages: [] }]);
      }
      isLoaded.current = true;
    }

    loadData();
  }, [id]);

  // Assign random workingTask (client-only to avoid SSR mismatch)
  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) =>
        m.status === 'working' && !m.workingTask
          ? { ...m, workingTask: WORKING_TASKS[Math.floor(Math.random() * WORKING_TASKS.length)] }
          : m
      )
    );
  }, []);

  // 사용자가 직접 변경한 경우에만 localStorage + 서버(Blob)에 저장
  useEffect(() => {
    if (!isLoaded.current || !locallyModified.current) return;
    locallyModified.current = false;
    const data = {
      workspaceName,
      channels,
      members,
      recentFiles: recentFiles.map((f) => ({ ...f, updatedAt: f.updatedAt.toISOString() })),
      openPanels: openPanels.map(serializePanel),
      closedPanels: Object.fromEntries(
        Object.entries(panelStore.current).map(([k, v]) => [k, serializePanel(v)])
      ),
    };
    localStorage.setItem(wsStorageKey(id), JSON.stringify(data));
    // 서버에 디바운스 저장 (2초)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/ws-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      }).catch(() => {});
    }, 2000);
  }, [workspaceName, channels, members, recentFiles, openPanels, id]);

  // 8초마다 Blob 폴링 → 다른 창에서 추가된 메시지 반영 (ID 기반 병합)
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!isLoaded.current) return;
      try {
        const res = await fetch(`/api/ws-data?id=${id}`);
        if (!res.ok) return;
        const serverData = await res.json();
        if (!serverData?.openPanels) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serverPanels: Panel[] = (serverData.openPanels as any[]).map(deserializePanel);
        setOpenPanels((prev) =>
          prev.map((p) => {
            const sp = serverPanels.find((s) => s.id === p.id);
            if (!sp) return p;
            const pMsgs = p.messages ?? [];
            const sMsgs = sp.messages ?? [];
            // ID 기준 합집합 병합 → 어느 쪽도 메시지를 잃지 않음
            const mergedMap = new Map<string, Message>();
            for (const m of pMsgs) mergedMap.set(m.id, m);
            for (const m of sMsgs) if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return merged.length > pMsgs.length ? { ...p, messages: merged } : p;
          })
        );
      } catch { /* 무시 */ }
    }, 8000);
    return () => clearInterval(timer);
  }, [id]);

  // ── URL copy ──────────────────────────────────────────────────────────────

  const handleCopyChannelUrl = useCallback((panelId: string) => {
    const url = `${window.location.origin}/ws/${id}/ch/${panelId}`;
    navigator.clipboard.writeText(url);
  }, [id]);

  // ── Panel helpers ─────────────────────────────────────────────────────────

  const openPanel = useCallback((panel: Panel) => {
    locallyModified.current = true;
    setOpenPanels((prev) => {
      if (prev.find((p) => p.id === panel.id)) return prev;
      // 이전에 저장된 상태가 있으면 복원
      const saved = panelStore.current[panel.id];
      return [...prev, saved ?? panel];
    });
  }, []);

  const closePanel = useCallback((panelId: string) => {
    locallyModified.current = true;
    setOpenPanels((prev) => {
      const target = prev.find((p) => p.id === panelId);
      if (target) panelStore.current[panelId] = target;
      return prev.filter((p) => p.id !== panelId);
    });
  }, []);

  const updatePanel = useCallback((panelId: string, updates: Partial<Panel>) => {
    locallyModified.current = true;
    setOpenPanels((prev) =>
      prev.map((p) => {
        if (p.id !== panelId) return p;
        const updated = { ...p, ...updates };
        panelStore.current[panelId] = updated; // 실시간으로 store도 동기화
        return updated;
      })
    );
  }, []);

  const handleAddFile = useCallback((file: RecentFile) => {
    locallyModified.current = true;
    setRecentFiles((prev) => {
      if (prev.find((f) => f.id === file.id)) return prev;
      return [...prev, file];
    });
  }, []);

  // ── Sidebar actions ───────────────────────────────────────────────────────

  const handleOpenChannel = (ch: Channel) => {
    if (openPanels.find((p) => p.id === ch.id)) { closePanel(ch.id); return; }
    openPanel({
      id: ch.id,
      type: 'channel',
      title: ch.name,
      color: ch.color,
      selectedMembers: [],
      attachedFiles: [],
      messages: [],
    });
  };

  const handleOpenDM = (member: Member) => {
    if (openPanels.find((p) => p.id === member.id)) { closePanel(member.id); return; }
    openPanel({
      id: member.id,
      type: 'dm',
      title: member.name,
      member,
      selectedMembers: [member],
      messages: [],
    });
  };

  const handleOpenFile = (file: RecentFile) => {
    if (openPanels.find((p) => p.id === file.id)) { closePanel(file.id); return; }
    openPanel({
      id: file.id,
      type: 'file',
      title: file.name,
      fileContent: file.content,
    });
  };

  const handleOpenFileBrowser = () => {
    if (openPanels.find((p) => p.id === '__file-browser__')) { closePanel('__file-browser__'); return; }
    openPanel({ id: '__file-browser__', type: 'file', title: '파일 탐색기' });
  };

  const handleOpenWikiHome = () => {
    if (openPanels.find((p) => p.id === '__wiki-home__')) { closePanel('__wiki-home__'); return; }
    openPanel({ id: '__wiki-home__', type: 'file', title: 'Wiki home' });
  };

  const handleDeleteChannel = (channelId: string) => {
    locallyModified.current = true;
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    closePanel(channelId);
  };

  const handleAddChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    locallyModified.current = true;
    const color = COLOR_PALETTE[channels.length % COLOR_PALETTE.length];
    setChannels((prev) => [...prev, { id: `ch-${Date.now()}`, name, color, fileCount: 0, memberCount: 0 }]);
    setNewChannelName('');
    setShowAddChannel(false);
  };

  const MEMBER_COLORS = ['#77b4da', '#d3859e', '#f3a87a', '#80d96f', '#a69db1'];

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    locallyModified.current = true;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    setMembers((prev) => [...prev, { id: `member-${Date.now()}`, name, color, initial: name[0].toUpperCase() }]);
    setNewMemberName('');
    setShowAddMember(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#999' }}>
      {/* Main content */}
      <div className="flex flex-1 gap-px overflow-hidden">
        <Sidebar
          workspaceName={workspaceName}
          channels={channels}
          members={members}
          currentUser={currentUser}
          openPanels={openPanels}
          onGoHome={() => router.push('/workspaces')}
          onAddChannel={() => setShowAddChannel(true)}
          onAddMember={() => setShowAddMember(true)}
          onOpenChannel={handleOpenChannel}
          onDeleteChannel={handleDeleteChannel}
          onOpenDM={handleOpenDM}
          onOpenWikiHome={handleOpenWikiHome}
          onOpenFileBrowser={handleOpenFileBrowser}
        />

        <main className="flex flex-1 overflow-hidden min-w-0">
          {openPanels.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4 text-[#ccc]">
                <Image src="/logo-craken.svg" alt="Craken" width={60} height={60} style={{ opacity: 0.2 }} />
                <p className="text-[15px]">채널이나 멤버를 선택하세요</p>
              </div>
            </div>
          ) : (
            <div ref={panelScrollRef} className="flex flex-1 overflow-x-auto">
              {openPanels.map((panel, i) => (
                <div
                  key={panel.id}
                  className="flex shrink-0 flex-col"
                  style={{
                    width: `${100 / Math.min(openPanels.length, 3)}%`,
                    minWidth: `${100 / 3}%`,
                    borderLeft: i > 0 ? '1px solid #999' : undefined,
                  }}
                >
                  {panel.type === 'file' ? (
                    <FilePanel
                      panel={panel}
                      allFiles={recentFiles}
                      onClose={closePanel}
                      onOpenFile={handleOpenFile}
                    />
                  ) : (
                    <ChannelPanel
                      panel={panel}
                      allMembers={members}
                      currentUser={currentUser}
                      onClose={closePanel}
                      onUpdatePanel={updatePanel}
                      onCopyUrl={handleCopyChannelUrl}
                      onAddFile={handleAddFile}
                      onOpenFile={handleOpenFile}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Channel Modal */}
      {showAddChannel && (
        <Modal title="새 채널 추가" onClose={() => setShowAddChannel(false)} onConfirm={handleAddChannel}>
          <input
            autoFocus
            type="text"
            placeholder="채널 이름"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#507096]"
          />
        </Modal>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal
          title="새 에이전트 추가"
          small
          onClose={() => setShowAddMember(false)}
          onConfirm={handleAddMember}
        >
          <input
            autoFocus
            type="text"
            placeholder="에이전트 이름"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#507096]"
          />
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal ────────────────────────────────────────────────────────────

function Modal({
  title, children, onClose, onConfirm, small,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  small?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl p-6 ${small ? 'w-[280px]' : 'w-[340px]'} flex flex-col gap-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`${small ? 'text-[14px]' : 'text-[16px]'} font-bold text-[#292929]`}>{title}</h2>
        {children}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${small ? 'text-[13px]' : 'text-[14px]'} text-[#666] hover:bg-[#f3f3f7] transition-colors cursor-pointer`}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${small ? 'text-[13px]' : 'text-[14px]'} text-white font-semibold transition-colors cursor-pointer`}
            style={{ background: '#507096' }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
