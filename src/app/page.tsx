'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChannelPanel from '@/components/ChannelPanel';
import FilePanel from '@/components/FilePanel';
import type { Channel, Member, RecentFile, Panel } from '@/types';

// ── Initial seed data ──────────────────────────────────────────────────────────

const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-general', name: 'General', color: '#f3e3ba', fileCount: 2, memberCount: 2 },
  { id: 'ch-sample', name: 'Sample', color: '#bcf3ba', fileCount: 2, memberCount: 3 },
  { id: 'ch-test', name: 'Test project', color: '#baf3f3', fileCount: 0, memberCount: 1 },
];

const WORKING_TASKS = [
  '데이터 분석', '문서 요약', '코드 리뷰', '보고서 작성', '논문 검색',
  '아이디어 정리', '이메일 초안 작성', '모델 학습', '버그 수정', '자료 수집',
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'me', name: 'Kisung(Me)', email: 'kisung@corca.ai', color: '#80d96f', initial: 'K', isMe: true, status: 'awake' },
  { id: 'tom', name: 'Tom', color: '#77b4da', initial: 'T', status: 'sleeping' },
  { id: 'grace', name: 'Grace', color: '#d3859e', initial: 'G', status: 'awake' },
  { id: 'max', name: 'Max', color: '#f3a87a', initial: 'M', status: 'working' },
];

const INITIAL_FILES: RecentFile[] = [
  { id: 'f1', name: 'checklist_pilot_motion.md', content: '# Checklist\n\n- [ ] Task 1\n- [ ] Task 2\n- [x] Task 3', updatedAt: new Date('2026-02-20') },
  { id: 'f2', name: 'research_notes.md', content: '# Research Notes\n\nSome important notes here.', updatedAt: new Date('2026-02-18') },
  { id: 'f3', name: 'agent_config.json', content: '{\n  "name": "Tom",\n  "model": "gpt-4",\n  "role": "researcher"\n}', updatedAt: new Date('2026-02-15') },
];

const CURRENT_USER = INITIAL_MEMBERS[0];

// ── Channel color palette for new channels ─────────────────────────────────────

const COLOR_PALETTE: Channel['color'][] = [
  '#f3e3ba', '#bcf3ba', '#baf3f3', '#f3baf3', '#f3bad3',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [recentFiles] = useState<RecentFile[]>(INITIAL_FILES);

  // Assign random workingTask on client only (avoid SSR hydration mismatch)
  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) =>
        m.status === 'working' && !m.workingTask
          ? { ...m, workingTask: WORKING_TASKS[Math.floor(Math.random() * WORKING_TASKS.length)] }
          : m
      )
    );
  }, []);
  const [openPanels, setOpenPanels] = useState<Panel[]>([
    {
      id: 'ch-general',
      type: 'channel',
      title: 'General',
      fileCount: 2,
      memberCount: 2,
      selectedMembers: [INITIAL_MEMBERS[1], INITIAL_MEMBERS[2]],
      messages: [],
    },
  ]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  // ── Panel helpers ────────────────────────────────────────────────────────────

  const openPanel = useCallback((panel: Panel) => {
    setOpenPanels((prev) => {
      if (prev.find((p) => p.id === panel.id)) return prev;
      return [...prev, panel];
    });
  }, []);

  const closePanel = useCallback((id: string) => {
    setOpenPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePanel = useCallback((id: string, updates: Partial<Panel>) => {
    setOpenPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  // ── Sidebar actions ──────────────────────────────────────────────────────────

  const handleOpenChannel = (ch: Channel) => {
    if (openPanels.find((p) => p.id === ch.id)) { closePanel(ch.id); return; }
    openPanel({
      id: ch.id,
      type: 'channel',
      title: ch.name,
      color: ch.color,
      fileCount: ch.fileCount,
      memberCount: ch.memberCount,
      selectedMembers: [],
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
    openPanel({
      id: '__file-browser__',
      type: 'file',
      title: '파일 탐색기',
    });
  };

  // ── Add channel modal ────────────────────────────────────────────────────────

  const handleAddChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    const color = COLOR_PALETTE[channels.length % COLOR_PALETTE.length];
    const newCh: Channel = {
      id: `ch-${Date.now()}`,
      name,
      color,
      fileCount: 0,
      memberCount: 0,
    };
    setChannels((prev) => [...prev, newCh]);
    setNewChannelName('');
    setShowAddChannel(false);
  };

  // ── Add member/agent modal ───────────────────────────────────────────────────

  const MEMBER_COLORS = ['#77b4da', '#d3859e', '#f3a87a', '#80d96f', '#a69db1'];

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      color,
      initial: name[0].toUpperCase(),
    };
    setMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setShowAddMember(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#507096' }}
    >
      {/* ── Global header ── */}
      <header
        className="flex h-[50px] items-center justify-between px-[20px] shrink-0"
        style={{ background: '#507096' }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo-craken.svg" alt="Craken" width={30} height={30} />
          <span className="text-white font-bold text-[16px] tracking-wide">CRAKEN</span>
        </div>
        <button className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer">
          <Image src="/icon-option.svg" alt="options" width={30} height={30} />
        </button>
      </header>

      {/* ── Main content (sidebar + panels) ── */}
      <div className="flex flex-1 gap-px overflow-hidden">
        {/* Left sidebar */}
        <Sidebar
          workspaceName="연구 프로젝트"
          channels={channels}
          members={members}
          recentFiles={recentFiles}
          currentUser={CURRENT_USER}
          openPanels={openPanels}
          onAddChannel={() => setShowAddChannel(true)}
          onAddMember={() => setShowAddMember(true)}
          onOpenChannel={handleOpenChannel}
          onOpenDM={handleOpenDM}
          onOpenFile={handleOpenFile}
          onOpenFileBrowser={handleOpenFileBrowser}
        />

        {/* Panels area */}
        <main className="flex flex-1 overflow-hidden min-w-0">
          {openPanels.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4 text-[#ccc]">
                <Image src="/logo-craken.svg" alt="Craken" width={60} height={60} style={{ opacity: 0.2 }} />
                <p className="text-[15px]">채널이나 멤버를 선택하세요</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {openPanels.map((panel, i) => (
                <div
                  key={panel.id}
                  className="flex-1 min-w-0 flex"
                  style={{
                    borderLeft: i > 0 ? '1px solid #507096' : undefined,
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
                      currentUser={CURRENT_USER}
                      onClose={closePanel}
                      onUpdatePanel={updatePanel}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Add Channel Modal ── */}
      {showAddChannel && (
        <Modal
          title="새 채널 추가"
          onClose={() => setShowAddChannel(false)}
          onConfirm={handleAddChannel}
        >
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

      {/* ── Add Member/Agent Modal ── */}
      {showAddMember && (
        <Modal
          title="새 에이전트 추가"
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
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#507096]"
          />
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal ─────────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
  onConfirm,
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
