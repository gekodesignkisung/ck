'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StoredWorkspace {
  id: string;
  name: string;
  myNodeName: string;
  allowedDomain?: string;
  createdAt: string;
}

interface StoredUser {
  name: string;
  email: string;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [workspaces, setWorkspaces] = useState<StoredWorkspace[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [wsName, setWsName] = useState('');
  const [wsId, setWsId] = useState('');
  const [wsIdManual, setWsIdManual] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [allowedDomain, setAllowedDomain] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('craken_user');
    if (!stored) { router.push('/'); return; }
    setUser(JSON.parse(stored));
    const storedWs = localStorage.getItem('craken_workspaces');
    if (storedWs) setWorkspaces(JSON.parse(storedWs));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('craken_user');
    router.push('/');
  };

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
    const updated = [...workspaces, ws];
    setWorkspaces(updated);
    localStorage.setItem('craken_workspaces', JSON.stringify(updated));
    closeCreate();
    router.push(`/ws/${id}`);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setStep(1);
    setWsName('');
    setWsId('');
    setWsIdManual(false);
    setNodeName('');
    setAllowedDomain('');
  };

  const canNext1 = wsName.trim() && wsId.trim();
  const canNext2 = nodeName.trim();

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="flex h-[56px] items-center justify-between px-6 border-b border-[#f0f0f0] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#e8f5e9] flex items-center justify-center overflow-hidden">
            <Image src="/logo-craken.svg" alt="Craken" width={22} height={22} />
          </div>
          <span className="text-[14px] font-semibold text-[#1a1a1a]">{user.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#1a1a1a] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
        >
          <LogoutIcon />
          로그아웃
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-8 py-10">
        <div className="max-w-[900px] mx-auto flex flex-col gap-8">
          <h1 className="text-[26px] font-bold text-[#1a1a1a]">{user.name}님, 환영합니다</h1>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(`/ws/${ws.id}`)}
                className="flex flex-col justify-between p-5 rounded-2xl text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-[1px]"
                style={{ background: '#f5f5f7', minHeight: 160 }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-bold text-[#1a1a1a]">{ws.name}</span>
                  <span className="text-[12px] text-[#888]">/ws/{ws.id}</span>
                </div>
                <div className="flex flex-col gap-[3px] mt-4">
                  <span className="text-[12px] text-[#888]">
                    개설일: {new Date(ws.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[#555]">관리자: {ws.myNodeName}</span>
                    <span className="w-[7px] h-[7px] rounded-full bg-[#4caf50] shrink-0" />
                  </div>
                </div>
              </button>
            ))}

            {/* New workspace card */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d5d5d5] hover:border-[#507096] hover:bg-[#f0f4f8] transition-all cursor-pointer"
              style={{ minHeight: 160 }}
            >
              <span className="text-[28px] leading-none text-[#bbb] font-light">+</span>
              <span className="text-[13px] text-[#aaa] font-medium">새 워크스페이스</span>
            </button>
          </div>
        </div>
      </main>

      {/* Create workspace — full screen */}
      {showCreate && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Close button */}
          <button
            onClick={closeCreate}
            className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors z-10"
          >
            <Image src="/icon-close.svg" alt="close" width={24} height={24} />
          </button>

          <div className="max-w-[560px] mx-auto px-6 pt-[72px] pb-16">
            {/* Step indicator */}
            <div className="flex flex-col gap-2 mb-10">
              <div className="flex items-center">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center" style={{ flex: s < 3 ? '1' : 'none' }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all"
                      style={{
                        background: s < step ? '#22c55e' : s === step ? '#1a1a1a' : '#e0e0e0',
                        color: s <= step ? 'white' : '#aaa',
                      }}
                    >
                      {s < step ? <CheckIcon /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className="flex-1 h-[2px] transition-all"
                        style={{ background: s < step ? '#22c55e' : '#e0e0e0' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-[#888]">{step} / 3 단계</span>
            </div>

            {/* Step 1 — 워크스페이스 이름 */}
            {step === 1 && (
              <div className="flex flex-col gap-7">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[28px] font-bold text-[#1a1a1a]">워크스페이스 이름 정하기</h2>
                  <p className="text-[14px] text-[#666] leading-relaxed">
                    워크스페이스는 팀과 AI 에이전트가 함께 협업하는 공간입니다. 채널, DM, 파일을 통해 소통할 수 있어요.
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
                      className="w-full border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
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
                      className="w-full border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors font-mono"
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
                  <h2 className="text-[28px] font-bold text-[#1a1a1a]">나의 정체성</h2>
                  <p className="text-[14px] text-[#666] leading-relaxed">
                    Craken에서 모든 참여자(사람 또는 AI)는 노드입니다. 노드 이름은 나의 핸들로, 메시지·@멘션·DM에서 사용됩니다.
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
                    className="w-full border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
                  />
                  <p className="text-[12px] text-[#999]">영문, 숫자, 하이픈, 밑줄 사용 가능. 최대 32자.</p>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 text-[14px] text-[#555] hover:text-[#1a1a1a] transition-colors cursor-pointer"
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
                  <h2 className="text-[28px] font-bold text-[#1a1a1a]">팀 접근 설정</h2>
                  <p className="text-[14px] text-[#666] leading-relaxed">
                    지정한 이메일 도메인을 가진 사람은 초대 없이 자동으로 참여할 수 있습니다. 나중에 설정에서 언제든 변경할 수 있어요.
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
                    className="w-full border-2 border-[#e0e0e0] focus:border-[#507096] rounded-lg px-4 py-3 text-[14px] outline-none transition-colors"
                  />
                  <p className="text-[12px] text-[#999]">쉼표로 구분. 비워두면 명시적 초대만 허용합니다.</p>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-3 text-[14px] text-[#555] hover:text-[#1a1a1a] transition-colors cursor-pointer"
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
        </div>
      )}
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

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M5.5 13H3a1 1 0 01-1-1V3a1 1 0 011-1h2.5M10 10.5l3-3-3-3M13 7.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
