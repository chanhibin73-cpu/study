// app/questions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

interface Question {
  id: string;
  content: string;
  choices: string[];
  correctAnswer: number;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    fetchUnansweredQuestions();
  }, []);

  // 未解答の問題をFirestoreから読み込む
  const fetchUnansweredQuestions = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. 全問題を取得
      const questionsSnap = await getDocs(collection(db, 'questions'));
      const allQuestions = questionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];

      // 2. 解答済み問題のIDを取得
      const answersQuery = query(collection(db, 'userAnswers'), where('userId', '==', user.uid));
      const answersSnap = await getDocs(answersQuery);
      const answeredIds = new Set(answersSnap.docs.map((doc) => doc.data().questionId));

      // 3. 未解答問題のみフィルタリング
      const list = allQuestions.filter((q) => !answeredIds.has(q.id));
      setQuestions(list);
    } catch (error) {
      console.error('問題取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 回答時の処理
  const handleSelectChoice = (choiceIndex: number) => {
    if (isAnswered) return;
    setSelectedChoice(choiceIndex);
  };

  // 回答送信（Firestore保存）
  const handleSubmitAnswer = async () => {
    if (selectedChoice === null || !auth.currentUser) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedChoice === currentQuestion.correctAnswer;

    try {
      // Firestoreに記録を保存
      await addDoc(collection(db, 'userAnswers'), {
        userId: auth.currentUser.uid,
        questionId: currentQuestion.id,
        selectedChoice,
        isCorrect,
        answeredAt: serverTimestamp(),
      });

      setIsAnswered(true);
    } catch (error) {
      console.error('解答保存エラー:', error);
    }
  };

  // 次の問題へ
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 font-medium">問題を読み込み中...</p>
      </div>
    );
  }

  // 解く問題がない・すべて完了した場合
  if (questions.length === 0 || isCompleted) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold">すべての問題が完了しました！</h2>
        <p className="text-gray-600 text-sm">チューターが新しい問題を投稿するのを待ちましょう。</p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition shadow"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* 進捗プログレス */}
      <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
        <span>問題 {currentIndex + 1} / {questions.length}</span>
      </div>

      {/* 問題文カード */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[140px] flex items-center justify-center">
        <p className="text-lg font-bold text-gray-800 text-center">{currentQuestion.content}</p>
      </div>

      {/* 選択肢ボタン (4択) */}
      <div className="space-y-3">
        {currentQuestion.choices.map((choice, index) => {
          let buttonStyle = "w-full p-4 border rounded-xl text-left font-medium transition text-gray-700 border-gray-200 hover:border-blue-300";

          // 選択された時の見た目
          if (selectedChoice === index) {
            buttonStyle = "w-full p-4 border-2 rounded-xl text-left font-medium transition border-blue-600 bg-blue-50 text-blue-700";
          }

          // 回答判定後の色付け
          if (isAnswered) {
            if (index === currentQuestion.correctAnswer) {
              buttonStyle = "w-full p-4 border-2 rounded-xl text-left font-medium bg-green-100 border-green-500 text-green-800"; // 正解
            } else if (selectedChoice === index) {
              buttonStyle = "w-full p-4 border-2 rounded-xl text-left font-medium bg-red-100 border-red-500 text-red-800"; // 不正解
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectChoice(index)}
              disabled={isAnswered}
              className={buttonStyle}
            >
              <span className="mr-3 font-bold text-gray-400">{index + 1}.</span>
              {choice}
            </button>
          );
        })}
      </div>

      {/* 送信・次へボタン */}
      <div className="pt-2">
        {!isAnswered ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedChoice === null}
            className={`w-full py-3 px-4 rounded-xl font-bold transition shadow ${
              selectedChoice !== null
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            回答を送信する
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow"
          >
            {currentIndex + 1 < questions.length ? '次の問題へ' : '結果を見る'}
          </button>
        )}
      </div>
    </div>
  );
}
