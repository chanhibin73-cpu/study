// components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'ホーム', href: '/', icon: '🏠' },
    { label: 'チューターからの問題', href: '/questions', icon: '✏️' },
    { label: '復習・質問', href: '/review', icon: '🔄' },
    { label: '学習記録', href: '/records', icon: '📅' },
    { label: '設定', href: '/settings', icon: '⚙️' },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-lg font-bold text-gray-800">復習アプリ</h1>
        
        {/* ハンバーガーボタン */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none"
          aria-label="メニューを開く"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* サイドバーモーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* 背景オーバーレイ */}
          <div 
            className="fixed inset-0 bg-black/40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* ドロワーメニュー */}
          <div className="relative bg-white w-64 max-w-sm h-full shadow-xl ml-auto flex flex-col p-6 z-50">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-gray-700">メニュー</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
