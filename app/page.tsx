'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [inputName, setInputName] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [needsNameRegistration, setNeedsNameRegistration] = useState<boolean>(false);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    // 匿名認証の監視・実行
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserProfileAndStatus(currentUser.uid);
      } else {
        try {
          const res = await signInAnonymously(auth);
          setUser(res.user);
          await checkUserProfileAndStatus(res.user.uid);
        } catch (error) {
          console.error("匿名ログインエラー:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ユーザープロファイルの判定とログイン記録
  const checkUserProfileAndStatus = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      // 名前がまだ登録されていない場合
      if (!userSnap.exists() || !userSnap.data().name) {
        setNeedsNameRegistration(true);
        setLoading(false);
        return;
      }

      // 登録済みの名前を取得
      const userData = userSnap.data();
      setUserName(userData.name);

      // ログイン日時の記録更新
      await updateDoc(userDocRef, {
        lastLoginDate: serverTimestamp(),
      });

      // 未解答問題の判定
      await checkUnansweredQuestions(uid);

    } catch (error) {
      console.error("ステータス確認エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 未解答問題が存在するかチェック
  const checkUnansweredQuestions = async (uid: string) => {
    // 全問題のIDを取得
    const questionsSnap = await getDocs(collection(db, 'questions'));
    const totalQuestionIds = questionsSnap.docs.map(doc => doc.id);

    // 生徒が既に解答した問題のIDを取得
    const answersQuery = query(collection(db, 'userAnswers'), where('userId', '==', uid));
    const answersSnap = await getDocs(answersQuery);
    const answeredIds = new Set(answersSnap.docs.map(doc => doc.data().questionId));

    // 未解答問題の算出
    const unanswered = totalQuestionIds.filter(qId => !answeredIds.has(qId));

    if (unanswered.length > 0) {
      setUnansweredCount(unanswered.length);
      setShowPopup(true); // ポップアップを表示
    }
  };

  // 初回の名前登録ハンドラー
  const handleRegisterName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name: inputName.trim(),
        themeColor: '#3B82F6', // デフォルトテーマ色
        createdAt: serverTimestamp(),
        lastLoginDate: serverTimestamp(),
      });

      setUserName(inputName.trim());
      setNeedsNameRegistration(false);

      // 登録完了後に未解答問題を判定
      await checkUnansweredQuestions(user.uid);
    } catch (error) {
      console.error("名前登録エラー:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">データを読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 text-gray-800">
      {/* 1. 初回用：名前登録モーダル */}
      {needsNameRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-center">ようこそ！</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              学習を始める前に、あなたの名前を入力してください。
            </p>
            <form onSubmit={handleRegisterName} className="space-y-4">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="例: たろう"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                登録してスタート
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. 未解答問題がある時のポップアップ */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center space-y-4">
            <div className="text-4xl">📝</div>
            <h3 className="text-lg font-bold">新しい問題があります！</h3>
            <p className="text-sm text-gray-600">
              まだ解いていない問題が <span className="font-bold text-blue-600">{unansweredCount}問</span> あります。挑戦してみましょう！
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                後で
              </button>
              <button
                onClick={() => router.push('/questions')}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition"
              >
                問題を解く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ダッシュボード表示 */}
      <div className="max-w-xl mx-auto space-y-6">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">おかえりなさい！</p>
          <h1 className="text-2xl font-bold text-gray-900">{userName} さん</h1>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/questions')}
            className="p-6 bg-white hover:bg-blue-50/50 border border-gray-200 rounded-2xl text-left transition space-y-2 relative shadow-sm"
          >
            <div className="text-3xl">✏️</div>
            <div className="font-bold text-gray-800">チューターからの問題</div>
            {unansweredCount > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                未解答 {unansweredCount}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/review')}
            className="p-6 bg-white hover:bg-amber-50/50 border border-gray-200 rounded-2xl text-left transition space-y-2 shadow-sm"
          >
            <div className="text-3xl">🔄</div>
            <div className="font-bold text-gray-800">復習・質問</div>
          </button>
        </section>
      </div>
    </main>
  );
}
