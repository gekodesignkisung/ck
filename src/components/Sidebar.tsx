'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import type { Channel, Member, RecentFile, Panel } from '@/types';

interface SidebarProps {
  workspaceName: string;
  channels: Channel[];
  members: Member[];
  recentFiles: RecentFile[];
  currentUser: Member;
  openPanels: Panel[];
  onGoHome: () => void;
  onAddChannel: () => void;
  onAddMember: () => void;
  onOpenChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;
  onOpenDM: (member: Member) => void;
  onOpenFile: (file: RecentFile) => void;
  onOpenFileBrowser: () => void;
}

export default function Sidebar({
  workspaceName,
  channels,
  members,
  recentFiles,
  currentUser,
  onGoHome,
  onAddChannel,
  onAddMember,
  onOpenChannel,
  onDeleteChannel,
  onOpenDM,
  onOpenFile,
  onOpenFileBrowser,
  openPanels,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const memberMenuRef = useRef<HTMLDivElement>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = (text: string, e: React.MouseEvent) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip({ text, x: e.clientX + 12, y: e.clientY });
  };

  const hideTooltip = () => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 80);
  };

  return (
    <aside
      className="flex flex-col h-full bg-white shrink-0 transition-all duration-200"
      style={{ width: collapsed ? 0 : 240, minWidth: collapsed ? 0 : 240, overflow: collapsed ? 'hidden' : 'visible' }}
    >
      {tooltip && (
        <span
          className="fixed z-[9999] bg-[#333] text-white text-[11px] rounded-md px-2 py-1 whitespace-nowrap shadow-md pointer-events-none -translate-y-1/2"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </span>
      )}
      {/* Workspace title bar */}
      <div className="flex h-[50px] items-center px-[6px] shrink-0 bg-[#f3f3f7] relative">
        <button
          type="button"
          onClick={onGoHome}
          title="워크스페이스 목록"
          className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer shrink-0"
        >
          <Image src="/icon-craken-3.svg" alt="Craken" width={30} height={30} />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold text-[#292929] whitespace-nowrap truncate max-w-[140px]">
          {workspaceName}
        </span>
        <button
          type="button"
          title="옵션"
          className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-black/5 transition-colors shrink-0 cursor-pointer ml-auto"
        >
          <Image src="/icon-option.svg" alt="options" width={24} height={24} />
        </button>
      </div>

      {/* Scrollable menu area */}
      {showInvitePopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowInvitePopup(false)}>
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-[340px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-bold text-[#292929]">사람 초대</h2>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="이메일 주소"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowInvitePopup(false); setInviteEmail(''); }}
                className="px-4 py-2 rounded-lg text-[14px] text-[#666] hover:bg-[#f3f3f7] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  console.log('invite', inviteEmail);
                  setShowInvitePopup(false);
                  setInviteEmail('');
                }}
                className="px-4 py-2 rounded-lg text-[14px] text-white font-semibold transition-colors cursor-pointer"
                style={{ background: '#507096' }}
              >
                초대하기
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto scrollbar-thin py-2 min-h-0">
        {/* Channel section */}
        <section>
          <div className="flex h-[40px] items-center justify-between pl-[12px] pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <span className="text-[14px] font-semibold text-[#999]">Channel</span>
            </div>
            <button
              onClick={onAddChannel}
              className="w-[24px] h-[24px] flex items-center justify-center rounded hover:bg-black/5 transition-colors cursor-pointer"
              title="채널 추가"
            >
              <Image src="/icon-add.svg" alt="add" width={24} height={24} />
            </button>
          </div>
          <ul className="flex flex-col gap-px">
            {channels.map((ch) => {
              const isOpen = openPanels.some((p) => p.type === 'channel' && p.id === ch.id);
              return (
                <li key={ch.id} className="group relative">
                  <button
                    onClick={() => onOpenChannel(ch)}
                    className={`flex h-[32px] items-center gap-[6px] px-[18px] w-full text-left transition-colors cursor-pointer hover:bg-gradient-to-r hover:from-transparent hover:to-[#f3f3f7] ${
                      isOpen ? 'bg-gradient-to-r from-transparent to-[#f3f3f7]' : ''
                    }`}
                  >
                    <span
                      className="w-[20px] h-[20px] rounded-[4px] shrink-0"
                      style={{ background: ch.color }}
                    />
                    <span className="text-[13px] font-semibold text-[#292929] truncate">
                      {ch.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    title="채널 삭제"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ch.id); }}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity cursor-pointer"
                  >
                    <Image src="/icon-delete.svg" alt="삭제" width={20} height={20} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Member section */}
        <section>
          <div className="flex h-[40px] items-center justify-between pl-[12px] pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <span className="text-[14px] font-semibold text-[#999]">Member</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMemberMenu((v) => !v)}
                className="w-[24px] h-[24px] flex items-center justify-center rounded hover:bg-black/5 transition-colors cursor-pointer"
                title="더보기"
              >
                <Image src="/icon-add.svg" alt="add" width={24} height={24} />
              </button>
              {showMemberMenu && (
                <div
                  ref={memberMenuRef}
                  className="absolute right-0 mt-1 w-[120px] bg-white border border-[#ccc] rounded shadow-lg z-50"
                >
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-[#f0f0f0]"
                    onClick={() => { setShowMemberMenu(false); onAddMember(); }}
                  >
                    에이전트 추가
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-[#f0f0f0]"
                    onClick={() => { setShowMemberMenu(false); setShowInvitePopup(true); }}
                  >
                    사람 초대
                  </button>
                </div>
              )}
            </div>
          </div>
          <ul className="flex flex-col gap-px">
            {members.map((member) => {
              const isOpen = openPanels.some((p) => p.type === 'dm' && p.id === member.id);
              return (
                <li key={member.id}>
                  <button
                    onClick={() => !member.isMe && onOpenDM(member)}
                    onMouseEnter={(e) => {
                      const text =
                        member.status === 'sleeping' ? '휴식 중입니다'
                        : member.status === 'awake' ? '깨어 있습니다.'
                        : member.status === 'working' ? `현재 ${member.workingTask ?? '작업'} 을 하고 있습니다.`
                        : null;
                      if (text) showTooltip(text, e);
                    }}
                    onMouseLeave={hideTooltip}
                    className={`flex h-[32px] items-center gap-[6px] px-[18px] w-full text-left transition-colors ${
                      member.isMe ? 'cursor-default' : 'hover:bg-gradient-to-r hover:from-transparent hover:to-[#f3f3f7] cursor-pointer'
                    } ${isOpen ? 'bg-gradient-to-r from-transparent to-[#f3f3f7]' : ''}`}
                  >
                    <span className="relative shrink-0">
                      <span
                        className="w-[20px] h-[20px] rounded-full flex items-center justify-center"
                        style={{ background: member.color }}
                      >
                        <span className="text-[10px] font-semibold text-white leading-none">
                          {member.initial}
                        </span>
                      </span>
                      {member.status && (
                        <span
                          className={`absolute -bottom-[2px] -right-[2px] w-[7px] h-[7px] rounded-full border border-white ${
                            member.status === 'sleeping' ? 'bg-[#bbb]'
                            : member.status === 'awake' ? 'bg-[#555]'
                            : 'status-working'
                          }`}
                        />
                      )}
                    </span>
                    <span className="text-[13px] font-semibold text-[#292929] truncate">
                      {member.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recent File section */}
        <section>
          <div className="flex h-[40px] items-center justify-between pl-[12px] pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <span className="text-[14px] font-semibold text-[#999]">Recent File</span>
            </div>
            <button
              onClick={onOpenFileBrowser}
              className="w-[24px] h-[24px] flex items-center justify-center rounded hover:bg-black/5 transition-colors cursor-pointer"
              title="파일 탐색기"
            >
              <Image src="/icon-folder.svg" alt="folder" width={24} height={24} />
            </button>
          </div>
          <ul className="flex flex-col gap-px">
            {recentFiles.map((file) => {
              const isOpen = openPanels.some((p) => p.type === 'file' && p.id === file.id);
              return (
                <li key={file.id}>
                  <button
                    onClick={() => onOpenFile(file)}
                    className={`flex h-[24px] items-center px-[18px] w-full text-left transition-colors cursor-pointer hover:bg-gradient-to-r hover:from-transparent hover:to-[#f3f3f7] ${
                      isOpen ? 'bg-gradient-to-r from-transparent to-[#f3f3f7]' : ''
                    }`}
                  >
                    <span className="text-[13px] text-[#292929] truncate">{file.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-[320px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] text-[#292929] leading-relaxed">
              삭제한 채널은 복구할 수 없습니다.<br />정말 삭제하시겠습니끼?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg text-[14px] text-[#666] hover:bg-[#f3f3f7] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => { onDeleteChannel(confirmDeleteId); setConfirmDeleteId(null); }}
                className="px-4 py-2 rounded-lg text-[14px] text-white font-semibold bg-[#e05555] hover:bg-[#c94444] transition-colors cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom user profile */}
      <div className="flex items-center justify-between px-[15px] py-[15px] shrink-0 border-t border-[#f0f0f0]">
        <div className="flex gap-[10px] items-center min-w-0">
          <span
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: currentUser.color }}
          >
            <Image src="/icon-profile.svg" alt="profile" width={40} height={40} />
          </span>
          <div className="flex flex-col gap-[2px] min-w-0">
            <span className="text-[14px] font-bold text-[#292929] truncate">{currentUser.name}</span>
            {currentUser.email && (
              <span className="text-[13px] text-[#696969] truncate">{currentUser.email}</span>
            )}
          </div>
        </div>
        <button className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-black/5 transition-colors shrink-0 cursor-pointer">
          <Image src="/icon-option.svg" alt="options" width={30} height={30} />
        </button>
      </div>
    </aside>
  );
}

