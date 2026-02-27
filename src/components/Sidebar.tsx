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
  onAddChannel: () => void;
  onAddMember: () => void;
  onOpenChannel: (channel: Channel) => void;
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
  onAddChannel,
  onAddMember,
  onOpenChannel,
  onOpenDM,
  onOpenFile,
  onOpenFileBrowser,
  openPanels,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
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
      <div className="flex h-[40px] items-center justify-center relative px-[10px] shrink-0 bg-[#f3f3f7]">
        <span className="text-[14px] font-semibold text-[#292929] whitespace-nowrap truncate">
          {workspaceName}
        </span>

      </div>

      {/* Scrollable menu area */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto scrollbar-thin py-2 min-h-0">
        {/* Channel section */}
        <section>
          <div className="flex h-[40px] items-center justify-between pl-0 pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <Image src="/icon-channel.svg" alt="channel" width={16} height={16} />
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
          <ul>
            {channels.map((ch) => {
              const isOpen = openPanels.some((p) => p.type === 'channel' && p.id === ch.id);
              return (
                <li key={ch.id}>
                  <button
                    onClick={() => onOpenChannel(ch)}
                    className={`flex h-[32px] items-center gap-[6px] px-[22px] w-full text-left hover:bg-[#f3f3f7] transition-colors cursor-pointer ${
                      isOpen ? 'bg-[#f3f3f7]' : ''
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
                </li>
              );
            })}
          </ul>
        </section>

        {/* Member section */}
        <section>
          <div className="flex h-[40px] items-center justify-between pl-0 pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <Image src="/icon-member.svg" alt="member" width={16} height={16} />
              <span className="text-[14px] font-semibold text-[#999]">Member</span>
            </div>
            <button
              onClick={onAddMember}
              className="w-[24px] h-[24px] flex items-center justify-center rounded hover:bg-black/5 transition-colors cursor-pointer"
              title="에이전트 추가"
            >
              <Image src="/icon-add.svg" alt="add" width={24} height={24} />
            </button>
          </div>
          <ul>
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
                    className={`flex h-[32px] items-center gap-[6px] px-[22px] w-full text-left transition-colors ${
                      member.isMe ? 'cursor-default' : 'hover:bg-[#f3f3f7] cursor-pointer'
                    } ${isOpen ? 'bg-[#f3f3f7]' : ''}`}
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
          <div className="flex h-[40px] items-center justify-between pl-0 pr-[10px]">
            <div className="flex gap-[6px] items-center">
              <Image src="/icon-recent-file.svg" alt="files" width={16} height={16} />
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
          <ul>
            {recentFiles.map((file) => {
              const isOpen = openPanels.some((p) => p.type === 'file' && p.id === file.id);
              return (
                <li key={file.id}>
                  <button
                    onClick={() => onOpenFile(file)}
                    className={`flex h-[24px] items-center px-[22px] w-full text-left hover:bg-[#f3f3f7] transition-colors cursor-pointer ${
                      isOpen ? 'bg-[#f3f3f7]' : ''
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
