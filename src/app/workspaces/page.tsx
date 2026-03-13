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

const FIXED_USER: StoredUser = { name: 'User Name', email: 'Username@company.com' };

export default function WorkspacesPage() {
  const router = useRouter();
  const user = FIXED_USER;
  const [workspaces, setWorkspaces] = useState<StoredWorkspace[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<StoredWorkspace | null>(null);

  useEffect(() => {
    const storedWs = localStorage.getItem('craken_workspaces');
    if (storedWs) setWorkspaces(JSON.parse(storedWs));
  }, []);

  const handleDeleteWorkspace = (ws: StoredWorkspace) => {
    const updated = workspaces.filter((w) => w.id !== ws.id);
    setWorkspaces(updated);
    localStorage.setItem('craken_workspaces', JSON.stringify(updated));
    setDeleteTarget(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('craken_user');
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Header */}
      <header className="flex h-[50px] items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
         
            <Image src="/icon-profile.svg" alt="Craken" width={30} height={30} />
         
          <span className="text-[14px] font-semibold text-[#1a1a1a]">{user.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-[#1a1a1a] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
        >
          <Image src="/icon-logout.svg" alt="Craken" width={24} height={24} />
          로그아웃
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-8 py-10">
        <div className="max-w-[900px] mx-auto flex flex-col gap-8">
          <h1 className="text-[26px] font-bold text-[#1a1a1a]">{user.name}님, 환영합니다</h1>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl text-left cursor-pointer transition-all border-2 border-[#ccccdd] bg-white hover:border-[#507096] hover:bg-[#f0f4f8]"
                style={{ minHeight: 160 }}
                onClick={() => router.push(`/ws/${ws.id}`)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[24px] font-semibold" style={{ color: '#333333' }}>{ws.name}</span>
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
                {/* 삭제 버튼 - 호버 시 표시 */}
                <button
                  className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ffe0e0]"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(ws); }}
                >
                  <Image src="/icon-delete.svg" alt="삭제" width={20} height={20} />
                </button>
              </div>
            ))}

            {/* New workspace card */}
            <button
              onClick={() => router.push('/workspaces/new')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d5d5d5] bg-white hover:border-[#507096] hover:bg-[#f0f4f8] transition-all cursor-pointer"
              style={{ minHeight: 160 }}
            >
              <span className="text-[28px] leading-none text-[#bbb] font-light">+</span>
              <span className="text-[13px] text-[#aaa] font-medium">새 워크스페이스</span>
            </button>
          </div>
        </div>
      </main>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-[320px] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] text-[#292929] leading-relaxed">
              <span className="font-semibold">{deleteTarget.name}</span> 워크스페이스를 삭제합니다.<br />삭제한 워크스페이스는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-[14px] text-[#666] hover:bg-[#f3f3f7] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteWorkspace(deleteTarget)}
                className="px-4 py-2 rounded-lg text-[14px] text-white font-semibold bg-[#e05555] hover:bg-[#c94444] transition-colors cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

