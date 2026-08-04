<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>チューター管理・分析ダッシュボード</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&display=swap');
        
        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            background-color: #f8fafc;
        }

        .chart-container {
            position: relative;
            width: 100%;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
            height: 320px;
            max-height: 400px;
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .tab-active {
            border-bottom: 2px solid #4f46e5;
            color: #4f46e5;
        }
    </style>
</head>
<body class="text-slate-800">

    <!-- Chosen Palette: Indigo & Slate Harmony (Minimalist and professional) -->
    <!-- Application Structure Plan: 
         1. 概要（Overview）: 主要なKPI（総問題数、正答率、未返信質問数）を表示し、全体像を把握。
         2. 生徒分析（Student Analysis）: 個別の学習進捗とログイン頻度を可視化。
         3. コンテンツ分析（Content Analysis）: 問題ごとの難易度（正答率）をチャート化し、改善が必要な問題を特定。
         4. コミュニケーション（Inbox）: 生徒からの質問への対応管理。
         この構造は、管理者が「状況把握 -> 原因分析 -> アクション（返信）」をスムーズに行えるよう設計されています。
    -->
    <!-- Visualization & Content Choices: 
         - KPIカード: 主要指標の即時把握。
         - Bar Chart (Chart.js): 問題別の正答率比較。学習のボトルネックを特定。
         - Line Chart (Chart.js): 過去7日間の総解答数の推移。アクティビティの傾向を把握。
         - ステータスリスト (HTML/CSS): ログイン状況のヒートマップ風表示。
         - NO SVG/Mermaid: 全てのグラフィック要素はCanvasまたはTailwind CSSで構築。
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->

    <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                        T
                    </div>
                    <div>
                        <h1 class="text-lg font-bold leading-tight">Tutor Insight</h1>
                        <p class="text-xs text-slate-500">学習管理・分析システム</p>
                    </div>
                </div>
                <nav class="hidden md:flex gap-8">
                    <button onclick="switchTab('overview')" id="tab-overview" class="text-sm font-semibold py-5 transition tab-active">ダッシュボード</button>
                    <button onclick="switchTab('students')" id="tab-students" class="text-sm font-semibold py-5 text-slate-500 hover:text-indigo-600 transition">生徒管理</button>
                    <button onclick="switchTab('analysis')" id="tab-analysis" class="text-sm font-semibold py-5 text-slate-500 hover:text-indigo-600 transition">問題分析</button>
                </nav>
                <div class="flex items-center gap-4">
                    <span class="text-sm font-medium text-slate-600">管理者様</span>
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">👤</div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8">
            
            <!-- SECTION: Overview -->
            <div id="content-overview" class="space-y-8 animate-in fade-in duration-500">
                <section>
                    <h2 class="text-2xl font-bold mb-1">現在の学習状況</h2>
                    <p class="text-slate-500 text-sm mb-6">直近1週間の主要なパフォーマンス指標です。</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">配信済み問題</div>
                            <div class="flex items-end gap-2">
                                <span class="text-3xl font-bold text-slate-800" id="stat-total-q">12</span>
                                <span class="text-sm text-indigo-500 font-bold mb-1">問</span>
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">総回答数</div>
                            <div class="flex items-end gap-2">
                                <span class="text-3xl font-bold text-slate-800" id="stat-total-ans">156</span>
                                <span class="text-sm text-emerald-500 font-bold mb-1">+12%</span>
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">平均正答率</div>
                            <div class="flex items-end gap-2">
                                <span class="text-3xl font-bold text-slate-800" id="stat-avg-acc">68</span>
                                <span class="text-sm text-slate-500 font-bold mb-1">%</span>
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-orange-400">
                            <div class="text-orange-500 text-xs font-bold uppercase tracking-wider mb-2">未対応の質問</div>
                            <div class="flex items-end gap-2">
                                <span class="text-3xl font-bold text-slate-800" id="stat-pending-q">3</span>
                                <span class="text-sm text-orange-500 font-bold mb-1">件</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Activity Chart -->
                    <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 class="text-lg font-bold mb-6">学習アクティビティ推移</h3>
                        <div class="chart-container">
                            <canvas id="activityChart"></canvas>
                        </div>
                    </div>

                    <!-- Recent Questions to Tutor -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 class="text-lg font-bold mb-4">生徒からの最新の質問</h3>
                        <div class="flex-grow space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar" id="question-list">
                            <!-- JS injected questions -->
                        </div>
                        <button onclick="switchTab('students')" class="mt-4 w-full py-3 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition">
                            すべての質問を見る
                        </button>
                    </div>
                </div>
            </div>

            <!-- SECTION: Student Analysis -->
            <div id="content-students" class="hidden space-y-8">
                <section>
                    <h2 class="text-2xl font-bold mb-6">生徒別進捗状況</h2>
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th class="px-6 py-4">生徒名</th>
                                    <th class="px-6 py-4">最終ログイン</th>
                                    <th class="px-6 py-4 text-center">完了問題数</th>
                                    <th class="px-6 py-4">1週間の継続状況</th>
                                    <th class="px-6 py-4 text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody id="student-table-body" class="divide-y divide-slate-100">
                                <!-- JS injected table rows -->
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <!-- SECTION: Content Analysis -->
            <div id="content-analysis" class="hidden space-y-8">
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div class="lg:col-span-3 space-y-6">
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 class="text-lg font-bold mb-6">問題別正答率ランキング</h3>
                            <div class="chart-container h-[400px] max-h-[500px]">
                                <canvas id="accuracyChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 class="text-lg font-bold mb-4">重点フォローが必要な問題</h3>
                            <p class="text-sm text-slate-500 mb-6">正答率が50%以下の問題です。解説の追加や再配信を検討してください。</p>
                            <div id="critical-questions" class="space-y-4">
                                <!-- JS injected items -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 py-8 px-4 text-center">
        <p class="text-xs">&copy; 2024 Tutor Insight Management System. All rights reserved.</p>
    </footer>

    <script>
        // --- Mock Data: Source Report Insights ---
        const appState = {
            activeTab: 'overview',
            users: [
                { uid: 'u1', name: '田中 太郎', lastLogin: '2024-05-18', solved: 45, loginStreak: [1, 1, 0, 1, 1, 1, 1] },
                { uid: 'u2', name: '佐藤 結衣', lastLogin: '2024-05-19', solved: 38, loginStreak: [0, 0, 1, 1, 0, 1, 1] },
                { uid: 'u3', name: '鈴木 一郎', lastLogin: '2024-05-19', solved: 52, loginStreak: [1, 1, 1, 1, 1, 1, 1] },
                { uid: 'u4', name: '高橋 花子', lastLogin: '2024-05-17', solved: 21, loginStreak: [1, 0, 0, 0, 1, 0, 0] },
            ],
            questions: [
                { id: 'q1', text: '基礎法学：第1条の定義', accuracy: 85 },
                { id: 'q2', text: '民法：物権変動の原則', accuracy: 42 },
                { id: 'q3', text: '憲法：三権分立の仕組み', accuracy: 78 },
                { id: 'q4', text: '刑法：故意の構成要件', accuracy: 31 },
                { id: 'q5', text: '行政法：行政裁量の範囲', accuracy: 55 },
            ],
            messages: [
                { id: 'm1', sender: '田中 太郎', text: '民法の第3条の解釈について詳しく知りたいです。', date: '2時間前', status: 'unread' },
                { id: 'm2', sender: '佐藤 結衣', text: '物権変動の問題が難しすぎます。ヒントをください。', date: '5時間前', status: 'unread' },
                { id: 'm3', sender: '高橋 花子', text: 'ログインパスワードを忘れそうになりましたが大丈夫でした。', date: '昨日', status: 'unread' },
            ],
            activityHistory: [12, 18, 15, 25, 22, 30, 28] // Past 7 days total solved
        };

        // --- Core Functions ---

        function switchTab(tabName) {
            // Hide all
            document.getElementById('content-overview').classList.add('hidden');
            document.getElementById('content-students').classList.add('hidden');
            document.getElementById('content-analysis').classList.add('hidden');
            
            // Remove active styles
            ['overview', 'students', 'analysis'].forEach(t => {
                document.getElementById(`tab-${t}`).classList.remove('tab-active');
                document.getElementById(`tab-${t}`).classList.add('text-slate-500');
            });

            // Show target
            document.getElementById(`content-${tabName}`).classList.remove('hidden');
            document.getElementById(`tab-${tabName}`).classList.add('tab-active');
            document.getElementById(`tab-${tabName}`).classList.remove('text-slate-500');

            // Specific initialization
            if (tabName === 'analysis') {
                renderAccuracyChart();
            }
        }

        function renderActivityChart() {
            const ctx = document.getElementById('activityChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['5/13', '5/14', '5/15', '5/16', '5/17', '5/18', '今日'],
                    datasets: [{
                        label: '総解答数',
                        data: appState.activityHistory,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#4f46e5'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { borderDash: [5, 5], color: '#e2e8f0' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        function renderAccuracyChart() {
            const ctx = document.getElementById('accuracyChart').getContext('2d');
            const sortedQ = [...appState.questions].sort((a, b) => b.accuracy - a.accuracy);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedQ.map(q => q.text.length > 10 ? q.text.substring(0, 10) + '...' : q.text),
                    datasets: [{
                        label: '正答率 (%)',
                        data: sortedQ.map(q => q.accuracy),
                        backgroundColor: sortedQ.map(q => q.accuracy < 50 ? '#f87171' : '#818cf8'),
                        borderRadius: 8,
                        barThickness: 32
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` 正答率: ${context.raw}%`
                            }
                        }
                    },
                    scales: {
                        x: { 
                            max: 100,
                            grid: { borderDash: [5, 5], color: '#e2e8f0' }
                        },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        function populateUI() {
            // Stats
            document.getElementById('stat-total-q').textContent = appState.questions.length;
            document.getElementById('stat-avg-acc').textContent = Math.round(appState.questions.reduce((a, b) => a + b.accuracy, 0) / appState.questions.length);
            document.getElementById('stat-pending-q').textContent = appState.messages.length;

            // Messages
            const msgList = document.getElementById('question-list');
            appState.messages.forEach(m => {
                const div = document.createElement('div');
                div.className = "p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition cursor-pointer group";
                div.innerHTML = `
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-slate-800">${m.sender}</span>
                        <span class="text-[10px] text-slate-400">${m.date}</span>
                    </div>
                    <p class="text-xs text-slate-600 line-clamp-2">${m.text}</p>
                `;
                msgList.appendChild(div);
            });

            // Student Table
            const tableBody = document.getElementById('student-table-body');
            appState.users.forEach(u => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">${u.name.charAt(0)}</div>
                            <span class="text-sm font-bold">${u.name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500">${u.lastLogin}</td>
                    <td class="px-6 py-4 text-sm text-center font-bold text-slate-700">${u.solved}</td>
                    <td class="px-6 py-4">
                        <div class="flex gap-1">
                            ${u.loginStreak.map(day => `
                                <div class="w-4 h-4 rounded-sm ${day ? 'bg-emerald-400' : 'bg-slate-200'}"></div>
                            `).join('')}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button class="text-indigo-600 hover:text-indigo-800 text-xs font-bold">詳細</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Critical Questions
            const criticalDiv = document.getElementById('critical-questions');
            appState.questions.filter(q => q.accuracy < 60).forEach(q => {
                const item = document.createElement('div');
                item.className = "flex items-center justify-between p-3 border border-slate-100 rounded-xl";
                item.innerHTML = `
                    <span class="text-xs font-medium text-slate-700">${q.text}</span>
                    <span class="text-xs font-bold text-rose-500">${q.accuracy}%</span>
                `;
                criticalDiv.appendChild(item);
            });
        }

        // Initialize
        window.onload = () => {
            populateUI();
            renderActivityChart();
        };
    </script>
</body>
</html>

