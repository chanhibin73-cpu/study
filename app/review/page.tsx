// app/review/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface Question {
  id: string;
  content: string;
  choices: string[];
  correctAnswer: number;
}

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<'review' | 'ask'>('review');
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 復習の選択状態
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<{ [key: string]: boolean }>({});

  // 質問フォーム用の状態
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    fetchWrongQuestions();
  }, []);

  // 間違えた問題をFirestoreから読み込む
  const fetchWrongQuestions = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. 不正解（isCorrect == false）の解答履歴を取得
      const q = query(
        collection(db, 'userAnswers'),
        where('userId', '==', user.uid),
        where('isCorrect', '==', false)
      );
      const querySnapshot = await getDocs(q);

      // 重複を防ぐため Unique な questionId のセットを作成
      const wrongQuestionIds = Array.from(
        new Set(querySnapshot.docs.map((doc) => doc.data().questionId as string))
      );

      // 2. 問題データを取得
      const questionPromises = wrongQuestionIds.map(async (qId) => {
        const qDoc = await getDoc(doc(db, 'questions', qId));
        if (qDoc.exists()) {
          return { id: qDoc.id, ...qDoc.data() } as Question;
        }
        return null;
      });

      const fetchedQuestions = (await Promise.all(questionPromises)).filter(
        (q): q is Question => q !== null
      );

      setWrongQuestions(fetchedQuestions);
    } catch (error) {
      console.error('復習問題の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 復習問題の判定
  const handleAnswerReview = (questionId: string, choiceIndex: number, correctAnswer: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
    const isCorrect = choiceIndex === correctAnswer;
    setResults((prev) => ({ ...prev, [questionId]: isCorrect }));
  };

  // チューターへの質問送信
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'questionsToTutor'), {
        userId: auth.currentUser.uid,
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: 'unread',
      });

      setMessage('');
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
    } catch (error) {
      console.error('質問送信エラー:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">データを読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* タブ切り替え */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'review' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          間違えた問題 ({wrongQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
            activeTab === 'ask' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          チューターに質問
        </button>
      </div>

      {/* 1. 復習タブコンテンツ */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {wrongQuestions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-4xl mb-2">✨</div>
              <p className="font-bold text-gray-700">復習する問題はありません！</p>
              <p className="text-xs text-gray-500 mt-1">素晴らしい集中力です。</p>
            </div>
          ) : (
            wrongQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  復習 {idx + 1}
                </span>
                <p className="font-bold text-gray-800">{q.content}</p>

                <div className="space-y-2 pt-2">
                  {q.choices.map((choice, cIdx) => {
                    const isSelected = selectedAnswers[q.id] === cIdx;
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isCorrect = results[q.id];

                    let style = 'w-full p-3 text-left border rounded-xl text-sm transition font-medium ';
                    if (isAnswered) {
                      if (cIdx === q.correctAnswer) {
                        style += 'bg-green-100 border-green-500 text-green-800';
                      } else if (isSelected && !isCorrect) {
                        style += 'bg-red-100 border-red-500 text-red-800';
                      } else {
                        style += 'border-gray-200 text-gray-400';
                      }
                    } else {
                      style += 'border-gray-200 hover:border-blue-300 text-gray-700';
                    }

                    return (
                      <button
                        key={cIdx}
                        disabled={isAnswered}
                        onClick={() => handleAnswerReview(q.id, cIdx, q.correctAnswer)}
                        className={style}
                      >
                        {cIdx + 1}. {choice}
                      </button>
                    );
                  })}
                </div>

                {results[q.id] !== undefined && (
                  <p className={`text-xs font-bold text-center mt-2 ${results[q.id] ? 'text-green-600' : 'text-red-500'}`}>
                    {results[q.id] ? '正解です！解き方をマスターできました！' : '残念、もう一度見直してみましょう。'}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. 質問タブコンテンツ */}
      {activeTab === 'ask' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-800">チューターへ質問メッセージを送る</h2>
          <p className="text-xs text-gray-500">
            解き方が分からない問題や勉強の相談など、自由にメッセージを入力してください。
          </p>

          <form onSubmit={handleSendQuestion} className="space-y-4">
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="質問を入力してください..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow text-sm"
            >
              送信する
            </button>
          </form>

          {isSent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-bold text-center">
              メッセージを送信しました！
            </div>
          )}
        </div>
      )}
    </div>
  );
}
