'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChannelPanel from '@/components/ChannelPanel';
import type { Member, Panel, RecentFile } from '@/types';
import { WORKING_TASKS, AI_AGENTS, INITIAL_FILES } from '@/lib/constants';

// 채널 메타데이터 (id → 이름, 색상, 초기 파일/멤버)
const CHANNEL_INFO: Record<string, {
  name: string;
  color: string;
  fileSeeds: RecentFile[];
  defaultMembers: Member[];
}> = {
  'ch-general': {
    name: 'General',
    color: '#f3e3ba',
    fileSeeds: [],
    defaultMembers: [AI_AGENTS[0], AI_AGENTS[1]],
  },
  'ch-sample': {
    name: 'Sample',
    color: '#bcf3ba',
    fileSeeds: [],
    defaultMembers: [AI_AGENTS[0], AI_AGENTS[1], AI_AGENTS[2]],
  },
  'ch-test': {
    name: 'Test project',
    color: '#baf3f3',
    fileSeeds: [],
    defaultMembers: [AI_AGENTS[0]],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandaloneChannelPage() {
  const params = useParams();
  const wsId = params.id as string;
  const chId = params.chId as string;

  const chInfo = CHANNEL_INFO[chId];

  const [currentUser, setCurrentUser] = useState<Member>({
    id: 'me',
    name: 'Me',
    email: '',
    color: '#80d96f',
    initial: 'M',
    isMe: true,
    status: 'awake',
  });
  const [members, setMembers] = useState<Member[]>([...AI_AGENTS]);
  const [panel, setPanel] = useState<Panel>({
    id: chId,
    type: 'channel',
    title: chInfo?.name ?? chId,
    color: chInfo?.color,
    selectedMembers: chInfo?.defaultMembers ?? [],
    attachedFiles: chInfo?.fileSeeds ?? [],
    messages: [],
  });

  // 워크스페이스 / 유저 데이터 로드
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
      const wsList = JSON.parse(storedWs) as Array<{ id: string; myNodeName: string }>;
      const ws = wsList.find((w) => w.id === wsId);
      if (ws) myName = ws.myNodeName;
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
  }, [wsId]);

  // workingTask 랜덤 배정
  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) =>
        m.status === 'working' && !m.workingTask
          ? { ...m, workingTask: WORKING_TASKS[Math.floor(Math.random() * WORKING_TASKS.length)] }
          : m
      )
    );
  }, []);

  const updatePanel = useCallback((_id: string, updates: Partial<Panel>) => {
    setPanel((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="h-screen">
      <ChannelPanel
        panel={panel}
        allMembers={members}
        currentUser={currentUser}
        onUpdatePanel={updatePanel}
      />
    </div>
  );
}
