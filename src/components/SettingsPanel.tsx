'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Panel } from '@/types';

interface SettingsPanelProps {
  panel: Panel;
  onClose: (panelId: string) => void;
}

export default function SettingsPanel({ panel, onClose }: SettingsPanelProps) {
  const [language, setLanguage] = useState('한국어');
  const [customDomain, setCustomDomain] = useState('corca.ai');
  const [networkAccess, setNetworkAccess] = useState('0.0.0.0/0');
  const [allowMemberCreate, setAllowMemberCreate] = useState(true);

  return (
    <div className="flex flex-col h-full w-[360px] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex h-[50px] items-center justify-between px-[15px] shrink-0" style={{ background: 'rgba(51,51,51,0.05)' }}>
        <span className="text-[14px] font-semibold text-[#292929]">{panel.title}</span>
        <button
          onClick={() => onClose(panel.id)}
          className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
        >
          <Image src="/icon-close.svg" alt="close" width={30} height={30} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-8 max-w-[400px]">
          {/* 언어 */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] mb-2 block">언어</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-[#e0e0e0] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#507096] transition-colors appearance-none bg-white cursor-pointer"
            >
              <option>한국어</option>
              <option>English</option>
              <option>日本語</option>
            </select>
          </div>

          {/* 커스텀 도메인 */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">커스텀 도메인</h3>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="w-full border-2 border-[#e0e0e0] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#507096] transition-colors"
            />
          </div>

          {/* 네트워크 접근 */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">네트워크 접근</h3>
            <p className="text-[12px] text-[#666] mb-3">
              이 워크스페이스의 속한 에이전트의 외부 네트워크 접근. 비워 두면 접근 자격없습니다. 접근 중에 하나싹: IP, CIDR
            </p>
            <textarea
              value={networkAccess}
              onChange={(e) => setNetworkAccess(e.target.value)}
              className="w-full border-2 border-[#e0e0e0] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#507096] transition-colors min-h-[100px] resize-none font-mono"
            />
          </div>

          {/* 권한 */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">권한</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMemberCreate}
                onChange={(e) => setAllowMemberCreate(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[13px] text-[#333]">엠버 채널 생성 허용</span>
            </label>
            <p className="text-[12px] text-[#666] mt-2">
              일란 멤버와 자신: 노드도 채널을 만들 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-6 py-4 shrink-0">
        <button
          className="px-6 py-2 rounded-lg text-[14px] font-semibold text-white transition-all cursor-pointer"
          style={{ background: '#1a1a1a' }}
          onClick={() => {
            // 저장 로직
            alert('설정이 저장되었습니다.');
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
}
