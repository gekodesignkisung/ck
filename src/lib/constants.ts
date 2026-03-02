import type { Member, RecentFile } from '@/types';

export const WORKING_TASKS = [
  '데이터 분석', '문서 요약', '코드 리뷰', '보고서 작성', '논문 검색',
  '아이디어 정리', '이메일 초안 작성', '모델 학습', '버그 수정', '자료 수집',
];

export const AI_AGENTS: Member[] = [
  { id: 'tom', name: 'Tom', color: '#77b4da', initial: 'T', status: 'sleeping' },
  { id: 'grace', name: 'Grace', color: '#d3859e', initial: 'G', status: 'awake' },
  { id: 'max', name: 'Max', color: '#f3a87a', initial: 'M', status: 'working' },
];

export const INITIAL_FILES: RecentFile[] = [
  { id: 'f1', name: 'checklist_pilot_motion.md', content: '# Checklist\n\n- [ ] Task 1\n- [ ] Task 2\n- [x] Task 3', updatedAt: new Date('2026-02-20') },
  { id: 'f2', name: 'research_notes.md', content: '# Research Notes\n\nSome important notes here.', updatedAt: new Date('2026-02-18') },
  { id: 'f3', name: 'agent_config.json', content: '{\n  "name": "Tom",\n  "model": "gpt-4",\n  "role": "researcher"\n}', updatedAt: new Date('2026-02-15') },
];
