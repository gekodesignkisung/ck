'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StoredWorkspace {
  id: string;
  name: string;
  myNodeName: string;
  allowedDomain?: string;
  createdAt: string;
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [wsName, setWsName] = useState('');
  const [wsId, setWsId] = useState('');
  const [wsIdManual, setWsIdManual] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [allowedDomain, setAllowedDomain] = useState('');

  const handleNameChange = (val: string) => {
    setWsName(val);
    if (!wsIdManual) {
      setWsId(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleIdChange = (val: string) => {
    setWsIdManual(true);
    setWsId(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleCreate = () => {
    const id = wsId.trim() || `ws-${Date.now()}`;
    const ws: StoredWorkspace = {
      id,
      name: wsName.trim(),
      myNodeName: nodeName.trim(),
      allowedDomain: allowedDomain.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const stored = localStorage.getItem('craken_workspaces');
    const workspaces = stored ? JSON.parse(stored) : [];
    const updated = [...workspaces, ws];
    localStorage.setItem('craken_workspaces', JSON.stringify(updated));
    router.push(`/ws/${id}`);
  };

  const canNext1 = wsName.trim() && wsId.trim();
  const canNext2 = nodeName.trim();

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Header */}
      <header className="flex h-[50px] items-center justify-between px-6 bg-white shrink-0">
        <button
          onClick={() => router.push('/workspaces')}
          className="flex items-center gap-1.5 text-[14px] text-[#666] hover:text-[#1a1a1a] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          돌아가기
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-[520px]" style={{ paddingTop: '30px' }}>
          {/* Step indicator */}
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center w-[160px]">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center" style={{ flex: s < 3 ? '1' : 'none' }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all"
                    style={{
                      background: s < step ? '#1a1a1a' : s === step ? '#1a1a1a' : '#e0e0e0',
                      color: s <= step ? 'white' : '#aaa',
                    }}
                  >
                    {s < step ? <CheckIcon /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className="flex-1 h-[2px] transition-all"
                      style={{ background: s < step ? '#1a1a1a' : '#e0e0e0' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1 — 워크스페이스 이름 */}
          {step === 1 && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <h1 className="text-[32px] font-bold text-[#1a1a1a]">워크스페이스 만들기</h1>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  워크스페이스는 팀과 AI 에이전트가 함께 협업하는 공간입니다.<br /> 채널, DM, 파일을 통해 소통할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#333]">워크스페이스 이름</label>
                  <input
                    autoFocus
                    type="text"
                    value={wsName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="예: 연구 프로젝트"
                    className="w-full bg-white border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
                  />
                  <p className="text-[12px] text-[#999]">대시보드와 사이드바 상단에 표시됩니다.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#333]">워크스페이스 ID</label>
                  <input
                    type="text"
                    value={wsId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    placeholder="예: my-research"
                    className="w-full bg-white border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors font-mono"
                  />
                  <p className="text-[12px] text-[#999]">URL에 사용됩니다: /ws/.... 생성 후 변경할 수 없습니다.</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canNext1}
                  className="px-7 py-3 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: '#1a1a1a' }}
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — 나의 정체성 */}
          {step === 2 && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <h1 className="text-[32px] font-bold text-[#1a1a1a]">나의 정체성 Node</h1>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  Craken에서 모든 참여자(사람 또는 AI)는 노드입니다.<br /> 노드 이름은 나의 핸들로, 메시지·@멘션·DM에서 사용됩니다.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#333]">노드 이름</label>
                <input
                  autoFocus
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value.slice(0, 32))}
                  placeholder="예: kisung"
                  className="w-full bg-white border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
                />
                <p className="text-[12px] text-[#999]">영문, 숫자, 하이픈, 밑줄 사용 가능. 최대 32자.</p>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl text-[14px] text-[#555] hover:text-[#1a1a1a] transition-colors cursor-pointer bg-[#eee] hover:bg-[#e0e0e0]"
                >
                  이전
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canNext2}
                  className="px-7 py-3 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: '#1a1a1a' }}
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — 팀 접근 설정 */}
          {step === 3 && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <h1 className="text-[32px] font-bold text-[#1a1a1a]">팀 접근 설정</h1>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  지정한 이메일 도메인을 가진 사람은 초대 없이 자동으로 참여할 수 있습니다.<br /> 나중에 설정에서 언제든 변경할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#333]">허용 이메일 도메인</label>
                <input
                  autoFocus
                  type="text"
                  value={allowedDomain}
                  onChange={(e) => setAllowedDomain(e.target.value)}
                  placeholder="예: corca.ai"
                  className="w-full bg-white border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
                />
                <p className="text-[12px] text-[#999]">쉼표로 구분. 비워두면 명시적 초대만 허용합니다.</p>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl text-[14px] text-[#555] hover:text-[#1a1a1a] transition-colors cursor-pointer bg-[#eee] hover:bg-[#e0e0e0]"
                >
                  이전
                </button>
                <button
                  onClick={handleCreate}
                  className="px-7 py-3 rounded-xl text-[14px] font-semibold text-white transition-all cursor-pointer"
                  style={{ background: '#1a1a1a' }}
                >
                  워크스페이스 만들기
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7L5.5 10.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
