'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { Panel, Member, Message } from '@/types';

interface ChannelPanelProps {
  panel: Panel;
  allMembers: Member[];
  currentUser: Member;
  onClose?: (id: string) => void;
  onUpdatePanel: (id: string, updates: Partial<Panel>) => void;
  onCopyUrl?: (panelId: string) => void;
}

export default function ChannelPanel({
  panel,
  allMembers,
  currentUser,
  onClose,
  onUpdatePanel,
  onCopyUrl,
}: ChannelPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'channel' | 'files' | 'members'>('channel');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedMembers: Member[] = panel.selectedMembers ?? [];
  const messages: Message[] = panel.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, panel.isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderColor: currentUser.color,
      senderInitial: currentUser.initial,
      content: text,
      createdAt: new Date(),
    };
    const updatedMessages = [...messages, newMessage];
    onUpdatePanel(panel.id, { messages: updatedMessages, isTyping: true });
    setInputText('');

    // @mention parsing: @name targets specific members, otherwise all selected respond
    const mentionMatches = [...text.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase());
    const allAgents = selectedMembers.filter((m) => !m.isMe);
    const agents = mentionMatches.length > 0
      ? allAgents.filter((m) => mentionMatches.includes(m.name.toLowerCase()))
      : allAgents;
    if (agents.length === 0) {
      onUpdatePanel(panel.id, { isTyping: false });
      return;
    }

    let currentMessages = updatedMessages;
    for (const agent of agents) {
      // Build history: only include messages from currentUser (user) and this specific agent (assistant).
      // Messages from other agents are skipped to avoid a history ending with 'assistant' role.
      const history = currentMessages
        .slice(-40)
        .filter((m) => m.senderId === currentUser.id || m.senderId === agent.id)
        .slice(-20)
        .map((m) => ({
          role: m.senderId === currentUser.id ? 'user' : 'assistant' as 'user' | 'assistant',
          content: m.content,
        }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            agentId: agent.id,
            agentName: agent.name,
            workingTask: agent.workingTask,
          }),
        });
        const data = await res.json() as { content?: string; error?: string };
        const content = res.ok
          ? (data.content ?? '(응답 없음)')
          : (data.error ?? `오류 (${res.status})`);
        const reply: Message = {
          id: `msg-${Date.now()}-${agent.id}`,
          senderId: agent.id,
          senderName: agent.name,
          senderColor: agent.color,
          senderInitial: agent.initial,
          content,
          createdAt: new Date(),
        };
        currentMessages = [...currentMessages, reply];
        onUpdatePanel(panel.id, { messages: currentMessages, isTyping: false });
      } catch {
        // continue to next agent on error
      }
    }
    onUpdatePanel(panel.id, { isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMember = (member: Member) => {
    const exists = selectedMembers.find((m) => m.id === member.id);
    if (exists) {
      onUpdatePanel(panel.id, {
        selectedMembers: selectedMembers.filter((m) => m.id !== member.id),
      });
    } else {
      onUpdatePanel(panel.id, { selectedMembers: [...selectedMembers, member] });
    }
    setShowMemberPicker(false);
  };

  const removeMember = (memberId: string) => {
    onUpdatePanel(panel.id, {
      selectedMembers: selectedMembers.filter((m) => m.id !== memberId),
    });
  };

  const isChannel = panel.type === 'channel';
  const titlePrefix = isChannel ? '# ' : '';

  const handleCopyUrl = () => {
    onCopyUrl?.(panel.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col h-full min-w-0 flex-1"
      style={{ background: isChannel && panel.color ? `color-mix(in srgb, ${panel.color} 15%, white)` : '#ffffff' }}
    >
      {/* Panel header */}
      <div className="flex h-[50px] items-center px-[15px] shrink-0 relative" style={{ background: 'rgba(51,51,51,0.05)' }}>
        {/* Left: title */}
        <span className="text-[14px] font-semibold text-[#292929] whitespace-nowrap shrink-0">
          {titlePrefix}{panel.title}
        </span>

        {/* Center: tabs */}
        {isChannel && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex">
            {(['channel', 'files', 'members'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'channel' ? '채널' : tab === 'files' ? '파일' : '멤버';
              const count = tab === 'files'
                ? (panel.attachedFiles?.length ?? 0)
                : tab === 'members'
                ? selectedMembers.length
                : null;
              const inactiveTabs = (['channel', 'files', 'members'] as const).filter((t) => t !== activeTab);
              const inactiveIdx = inactiveTabs.indexOf(tab);
              const bg = isActive
                ? (panel.color ? `color-mix(in srgb, ${panel.color} 15%, white)` : 'rgba(255,255,255,0.9)')
                : inactiveIdx === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-1 h-[40px] px-5 text-[13px] text-[#333] cursor-pointer"
                  style={{ background: bg, fontWeight: 500 }}
                >
                  <span>{label}</span>
                  {count !== null && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Right: share + close */}
        <div className="flex items-center gap-1 ml-auto">
          {isChannel && (
            <div className="relative">
              <button
                type="button"
                onClick={handleCopyUrl}
                title="채널 링크 복사"
                className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-black/10 transition-colors cursor-pointer text-[#666]"
              >
                {copied ? <CheckIcon /> : <Image src="/icon-share.svg" alt="share" width={28} height={28} />}
              </button>
              {copied && (
                <span className="absolute right-0 top-full mt-1 bg-[#333] text-white text-[11px] rounded-md px-2 py-1 whitespace-nowrap shadow-md pointer-events-none z-50">
                  링크 복사됨!
                </span>
              )}
            </div>
          )}
          {onClose && (
            <button
              type="button"
              title="닫기"
              onClick={() => onClose(panel.id)}
              className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
            >
              <Image src="/icon-close.svg" alt="close" width={30} height={30} />
            </button>
          )}
        </div>
      </div>

      {/* Members tab view */}
      {activeTab === 'members' ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-2 min-h-0">
          {selectedMembers.map((m) => {
            const statusLabel =
              m.status === 'sleeping' ? '휴식 중'
              : m.status === 'awake' ? '깨어 있음'
              : m.status === 'working' ? (m.workingTask ? `${m.workingTask} 중` : '작업 중')
              : '';
            const statusColor =
              m.status === 'sleeping' ? '#bbb'
              : m.status === 'awake' ? '#555'
              : '#4ade80';
            return (
              <div key={m.id} className="flex items-center gap-3 px-2 py-2 border-b border-[#ddd]">
                <span className="relative shrink-0">
                  <span
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-semibold text-white"
                    style={{ background: m.color }}
                  >
                    {m.initial}
                  </span>
                  <span
                    className="absolute -bottom-[2px] -right-[2px] w-[9px] h-[9px] rounded-full border-2 border-white"
                    style={{ background: statusColor }}
                  />
                </span>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[14px] font-semibold text-[#292929]">{m.name}</span>
                  <span className="text-[12px] text-[#999]">{statusLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Messages area */
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-3 min-h-0">
          {messages.length === 0 && activeTab === 'channel' && (
            <div className="flex-1 flex items-center justify-center text-[#ccc] text-[13px]">
              대화를 시작해보세요
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <span
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold text-white mt-0.5"
                  style={{ background: msg.senderColor }}
                >
                  {msg.senderInitial}
                </span>
                <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-[#999]">{msg.senderName}</span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-[14px] text-[#292929] whitespace-pre-wrap break-words ${
                      isMe ? 'bg-[#507096] text-white rounded-tr-sm' : 'bg-[#f3f3f6] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {panel.isTyping && (
            <div className="flex gap-2 flex-row">
              <span className="w-[32px] h-[32px] rounded-full bg-[#ddd] flex items-center justify-center shrink-0 text-[11px] font-semibold text-white mt-0.5">
                ···
              </span>
              <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm bg-[rgba(51,51,51,0.07)] h-[36px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#aaa] animate-bounce [animation-delay:0ms]" />
                <span className="w-[6px] h-[6px] rounded-full bg-[#aaa] animate-bounce [animation-delay:150ms]" />
                <span className="w-[6px] h-[6px] rounded-full bg-[#aaa] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {activeTab === 'channel' && <div className="flex flex-col gap-[6px] p-[15px] shrink-0">
        {/* Selected members chips + add button */}
        <div className="flex flex-wrap gap-[4px]">
          {selectedMembers.map((m) => (
            <div
              key={m.id}
              className="flex h-[32px] items-center px-[5px] rounded-[30px]"
              style={{ background: 'rgba(51,51,51,0.05)' }}
            >
              <div className="flex gap-[4px] items-center">
                <span
                  className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                  style={{ background: m.color }}
                >
                  {m.initial}
                </span>
                <span className="text-[14px] font-semibold text-[#292929]">{m.name}</span>
                <button
                  type="button"
                  title="멤버 제거"
                  onClick={() => removeMember(m.id)}
                  className="w-[16px] h-[16px] flex items-center justify-center ml-1 cursor-pointer"
                >
                  <Image src="/icon-close.svg" alt="remove" width={20} height={20} />
                </button>
              </div>
            </div>
          ))}
          {/* Add member to conversation */}
          <div className="relative">
            <button
              onClick={() => setShowMemberPicker((v) => !v)}
              className="flex h-[32px] items-center gap-[6px] px-[10px] rounded-full transition-colors cursor-pointer"
              style={{ background: 'rgba(51,51,51,0.05)' }}
            >
              <Image src="/icon-add.svg" alt="add" width={24} height={24} />
              <span className="text-[13px] font-semibold text-[#666] whitespace-nowrap pr-[4px]">멤버 추가</span>
            </button>
            {showMemberPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-[#eee] py-1 z-10 min-w-[140px]">
                {allMembers
                  .filter((m) => !selectedMembers.find((s) => s.id === m.id) && !m.isMe)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m)}
                      className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-[#f3f3f7] text-left cursor-pointer"
                    >
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
                        style={{ background: m.color }}
                      >
                        {m.initial}
                      </span>
                      <span className="text-[13px] text-[#292929]">{m.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Text input box */}
        <div className="flex flex-col h-[100px] p-[15px] rounded-[16px] relative" style={{ background: 'rgba(51,51,51,0.05)' }}>
          <div className="flex flex-1 gap-[10px] items-start">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter message"
              className="flex-1 bg-transparent text-[14px] text-[#292929] placeholder-[#aaa] resize-none outline-none leading-normal h-full"
            />
            <button
              onClick={handleSend}
              className="w-[36px] h-[36px] shrink-0 flex items-center justify-center cursor-pointer"
              title="전송"
            >
              <Image src="/icon-send-message.svg" alt="send" width={36} height={36} />
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}


function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7L5.5 10.5L12 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
