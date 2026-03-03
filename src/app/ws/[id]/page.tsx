'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChannelPanel from '@/components/ChannelPanel';
import FilePanel from '@/components/FilePanel';
import type { Channel, Member, RecentFile, Panel } from '@/types';
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

// 채널별 초기 파일 (대화 중 업로드/생성된 파일 시드)
const CHANNEL_SEED_FILES: Record<string, RecentFile[]> = {
  'ch-general': [],
  'ch-sample':  [],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const panelScrollRef = useRef<HTMLDivElement>(null);
  // 닫힌 패널 상태 보존 (key: panelId)
  const panelStore = useRef<Record<string, Panel>>({});

  const [workspaceName, setWorkspaceName] = useState('워크스페이스');
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
  const [openPanels, setOpenPanels] = useState<Panel[]>([
    {
      id: 'ch-general',
      type: 'channel',
      title: 'General',
      selectedMembers: [],
      attachedFiles: CHANNEL_SEED_FILES['ch-general'] ?? [],
      messages: [],
    },
  ]);
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

  // Load workspace data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('craken_user');
    const storedWs = localStorage.getItem('craken_workspaces');
    let myName = 'Me';
    let myEmail = '';

    if (storedUser) {
      const u = JSON.parse(storedUser) as { name: string; email: string };
      myEmail = u.email ?? '';
    }

    if (storedWs) {
      const wsList = JSON.parse(storedWs) as Array<{ id: string; name: string; myNodeName: string }>;
      const ws = wsList.find((w) => w.id === id);
      if (ws) {
        setWorkspaceName(ws.name);
        myName = ws.myNodeName;
      }
    }

    const me: Member = {
      id: 'me',
      name: `${myName}(Me)`,
      email: myEmail,
      color: '#80d96f',
      initial: myName[0]?.toUpperCase() ?? 'M',
      isMe: true,
      status: 'awake',
    };

    setCurrentUser(me);
    setMembers([me, ...AI_AGENTS]);

    // URL ?ch= 파라미터로 특정 채널 바로 오픈
    const params = new URLSearchParams(window.location.search);
    const chParam = params.get('ch');
    if (chParam && chParam !== 'ch-general') {
      const ch = INITIAL_CHANNELS.find((c) => c.id === chParam);
      if (ch) {
        setOpenPanels([{
          id: ch.id,
          type: 'channel',
          title: ch.name,
          color: ch.color,
          selectedMembers: [],
          attachedFiles: CHANNEL_SEED_FILES[ch.id] ?? [],
          messages: [],
        }]);
      }
    }
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

  // ── URL copy ──────────────────────────────────────────────────────────────

  const handleCopyChannelUrl = useCallback((panelId: string) => {
    const url = `${window.location.origin}/ws/${id}/ch/${panelId}`;
    navigator.clipboard.writeText(url);
  }, [id]);

  // ── Panel helpers ─────────────────────────────────────────────────────────

  const openPanel = useCallback((panel: Panel) => {
    setOpenPanels((prev) => {
      if (prev.find((p) => p.id === panel.id)) return prev;
      // 이전에 저장된 상태가 있으면 복원
      const saved = panelStore.current[panel.id];
      return [...prev, saved ?? panel];
    });
  }, []);

  const closePanel = useCallback((panelId: string) => {
    setOpenPanels((prev) => {
      const target = prev.find((p) => p.id === panelId);
      if (target) panelStore.current[panelId] = target;
      return prev.filter((p) => p.id !== panelId);
    });
  }, []);

  const updatePanel = useCallback((panelId: string, updates: Partial<Panel>) => {
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
      attachedFiles: CHANNEL_SEED_FILES[ch.id] ?? [],
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

  const handleDeleteChannel = (channelId: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    closePanel(channelId);
  };

  const handleAddChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    const color = COLOR_PALETTE[channels.length % COLOR_PALETTE.length];
    setChannels((prev) => [...prev, { id: `ch-${Date.now()}`, name, color, fileCount: 0, memberCount: 0 }]);
    setNewChannelName('');
    setShowAddChannel(false);
  };

  const MEMBER_COLORS = ['#77b4da', '#d3859e', '#f3a87a', '#80d96f', '#a69db1'];

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
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
          recentFiles={recentFiles}
          currentUser={currentUser}
          openPanels={openPanels}
          onGoHome={() => router.push('/workspaces')}
          onAddChannel={() => setShowAddChannel(true)}
          onAddMember={() => setShowAddMember(true)}
          onOpenChannel={handleOpenChannel}
          onDeleteChannel={handleDeleteChannel}
          onOpenDM={handleOpenDM}
          onOpenFile={handleOpenFile}
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
        <Modal title="새 에이전트 추가" onClose={() => setShowAddMember(false)} onConfirm={handleAddMember}>
          <input
            autoFocus
            type="text"
            placeholder="에이전트 이름"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#507096]"
          />
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal ────────────────────────────────────────────────────────────

function Modal({
  title, children, onClose, onConfirm,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-[340px] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-[#292929]">{title}</h2>
        {children}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[14px] text-[#666] hover:bg-[#f3f3f7] transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-[14px] text-white font-semibold transition-colors cursor-pointer"
            style={{ background: '#507096' }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
