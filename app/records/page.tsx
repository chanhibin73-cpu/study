// app/records/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface DayRecord {
  dateStr: string; // "8/4 (火)" などの表示用
  fullDate: string; // "YYYY-MM-DD" 判定用
  isLoggedIn: boolean;
  solvedCount: number;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [totalSolved, setTotalSolved] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchWeekRecords();
  }, []);

  const fetchWeekRecords = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. 直近7日間の日付配列を生成
      const days: DayRecord[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);

        const fullDate = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} (${dayOfWeek})`;

        days.push({
          dateStr,
          fullDate,
          isLoggedIn: false,
          solvedCount: 0,
        });
      }

      // 2. 解答履歴から該当期間のデータを取得
      const answersQuery = query(
        collection(db, 'userAnswers'),
        where('userId', '==', user.uid)
      );
      const answersSnap = await getDocs(answersQuery);

      let totalCount = 0;
      const countMap: { [key: string]: number } = {};

      answersSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.answeredAt) {
          const dateObj = data.answeredAt.toDate();
          const dateKey = dateObj.toISOString().split('T')[0];
          countMap[dateKey] = (countMap[dateKey] || 0) + 1;
          totalCount++;
        }
      });

      // 3. ユーザーの最終ログイン日時を取得して整合性を高める
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let lastLoginKey = '';
      if (userDoc.exists() && userDoc.data().lastLoginDate) {
        lastLoginKey = userDoc.data().lastLoginDate.toDate().toISOString().split('T')[0];
      }

      // 4. 配列にマージ
      const updatedDays = days.map((day) => {
        const solved = countMap[day.fullDate] || 0;
        // 問題を解いている、または最終ログイン日が一致していれば「ログイン済み」と判定
        const loggedIn = solved > 0 || lastLoginKey === day.fullDate;
        return {
          ...day,
          solvedCount: solved,
          isLoggedIn: loggedIn,
        };
      });

      setRecords(updatedDays);
      setTotalSolved(totalCount);
    } catch (error) {
      console.error('記録取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">記録を読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* 累計解答数カード */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
        <p className="text-xs font-medium opacity-80">これまでの努力の成果</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-extrabold">{totalSolved}</span>
          <span className="text-sm font-semibold">問 クリア！</span>
        </div>
      </div>

      {/* 1週間カレンダー記録 */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center justify-between">
          <span>直近1週間の学習記録</span>
          <span className="text-xs text-gray-400 font-normal">チューター共有中 🤝</span>
        </h2>

        <div className="space-y-3">
          {records.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                r.isLoggedIn ? 'bg-blue-50/40 border-blue-100' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    r.isLoggedIn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {r.isLoggedIn ? '✓' : '-'}
                </div>
                <span className="text-sm font-semibold text-gray-700">{r.dateStr}</span>
              </div>

              <div className="text-right">
                {r.solvedCount > 0 ? (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {r.solvedCount} 問解答
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">解答なし</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
