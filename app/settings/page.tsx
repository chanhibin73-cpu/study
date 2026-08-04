// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// カラーテーマの選択肢
const COLOR_OPTIONS = [
  { name: 'ブルー', value: '#3B82F6', bgClass: 'bg-blue-500' },
  { name: 'エメラルド', value: '#10B981', bgClass: 'bg-emerald-500' },
  { name: 'パープル', value: '#8B5CF6', bgClass: 'bg-purple-500' },
  { name: 'ローズ', value: '#F43F5E', bgClass: 'bg-rose-500' },
];

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchUserSettings();
  }, []);

  // 登録済みの設定を読み込む
  const fetchUserSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || '');
        setThemeColor(data.themeColor || '#3B82F6');
      }
    } catch (error) {
      console.error('設定取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 設定の更新保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !name.trim()) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        themeColor,
      });
      setStatusMessage('設定を更新しました！');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('設定保存エラー:', error);
      setStatusMessage('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">設定を読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">設定</h1>

      {/* 名前・テーマ色変更フォーム */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">お名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">テーマカラー</label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setThemeColor(color.value)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                  themeColor === color.value ? 'border-gray-800 ring-2 ring-gray-800' : 'border-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full ${color.bgClass}`} />
                <span className="text-[10px] font-medium text-gray-600">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow text-sm disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>

        {statusMessage && (
          <p className="text-xs font-bold text-center text-green-600">{statusMessage}</p>
        )}
      </form>

      {/* お知らせ・更新情報 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <h2 className="font-bold text-gray-800 text-sm">更新情報</h2>
        <ul className="space-y-3 text-xs text-gray-600">
          <li className="border-b border-gray-100 pb-2">
            <span className="text-gray-400 block mb-0.5">2026/08/01</span>
            <p className="font-medium text-gray-700">1週間学習記録カレンダー機能を追加しました。</p>
          </li>
          <li className="border-b border-gray-100 pb-2">
            <span className="text-gray-400 block mb-0.5">2026/07/20</span>
            <p className="font-medium text-gray-700">復習機能およびチューターへの質問機能を追加しました。</p>
          </li>
          <li>
            <span className="text-gray-400 block mb-0.5">2026/07/01</span>
            <p className="font-medium text-gray-700">アプリを公開しました！</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
