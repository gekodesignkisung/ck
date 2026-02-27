'use client';

import Image from 'next/image';
import type { Panel, RecentFile } from '@/types';

interface FilePanelProps {
  panel: Panel;
  allFiles: RecentFile[];
  onClose: (id: string) => void;
  onOpenFile: (file: RecentFile) => void;
}

/** Renders a file viewer OR a full file-browser panel */
export default function FilePanel({ panel, allFiles, onClose, onOpenFile }: FilePanelProps) {
  const isBrowser = panel.id === '__file-browser__';

  return (
    <div className="flex flex-col h-full bg-white min-w-0 flex-1">
      {/* Header */}
      <div className="flex h-[40px] items-center px-[15px] shrink-0 bg-[#f3f3f7] gap-2">
        <div className="flex items-center gap-0 min-w-0 flex-1">
          {isBrowser && (
            <Image src="/icon-folder.svg" alt="folder" width={30} height={30} />
          )}
          <span className="text-[14px] font-semibold text-[#292929] truncate">
            {panel.title}
          </span>
        </div>
        <button
          onClick={() => onClose(panel.id)}
          className="w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer translate-x-[10px]"
        >
          <Image src="/icon-close.svg" alt="close" width={30} height={30} />
        </button>
      </div>

      {/* Content */}
      {isBrowser ? (
        <FileBrowserContent files={allFiles} onOpenFile={onOpenFile} />
      ) : (
        <FileViewerContent content={panel.fileContent} fileName={panel.title} />
      )}
    </div>
  );
}

function FileBrowserContent({
  files,
  onOpenFile,
}: {
  files: RecentFile[];
  onOpenFile: (file: RecentFile) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 min-h-0">
      <p className="text-[12px] text-[#999] mb-3 font-semibold uppercase tracking-wider">
        전체 파일
      </p>
      {files.length === 0 && (
        <p className="text-[13px] text-[#ccc]">파일이 없습니다.</p>
      )}
      <ul className="flex flex-col gap-1">
        {files.map((file) => (
          <li key={file.id}>
            <button
              onClick={() => onOpenFile(file)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#f3f3f7] text-left transition-colors cursor-pointer"
            >
              <Image src="/file.svg" alt="file" width={20} height={20} />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] text-[#292929] truncate">{file.name}</span>
                <span className="text-[11px] text-[#999]">
                  {file.updatedAt.toLocaleDateString('ko-KR')}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FileViewerContent({
  content,
  fileName,
}: {
  content?: string;
  fileName: string;
}) {
  const isMarkdown = fileName.endsWith('.md');

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6 min-h-0">
      {content ? (
        isMarkdown ? (
          <pre className="text-[13px] text-[#292929] whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        ) : (
          <pre className="text-[13px] text-[#292929] whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-[#ccc]">
          <Image src="/file.svg" alt="file" width={40} height={40} />
          <p className="text-[13px]">파일 내용이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
