'use client';

import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  return (
    <>
      <MusicPlayer />
      <div className="disclaimer">音乐文件仅供开发测试，不涉及盈利目的。</div>
    </>
  );
}
