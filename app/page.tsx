'use client'

import { useEffect, useState } from 'react'
import { createClient } from './utils/supabase'

export default function Home() {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  
  // 表示モードの管理 ('input' か 'history')
  const [mode, setMode] = useState<'input' | 'history'>('input')
  
  // 履歴画面用の月管理
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  // データを読み込む
  const fetchTransactions = async (year: number, month: number) => {
    const startDate = new Date(year, month, 1, 0, 0, 0).toISOString()
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else if (data) setItems(data)
  }

  // モードや月が変わるたびに読み込み
  useEffect(() => {
    if (mode === 'input') {
      fetchTransactions(now.getFullYear(), now.getMonth()) // 入力画面は常に「今月」
    } else {
      fetchTransactions(viewYear, viewMonth) // 履歴画面は「選択した月」
    }
  }, [mode, viewMonth, viewYear])

  const addItem = async () => {
    if (!title || !amount) return alert('入力してください')
    const { error } = await supabase
      .from('transactions')
      .insert([{ title, amount: Number(amount), created_at: new Date().toISOString() }])

    if (error) alert('保存失敗')
    else {
      setTitle(''); setAmount(''); fetchTransactions(now.getFullYear(), now.getMonth())
    }
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) fetchTransactions(mode === 'input' ? now.getFullYear() : viewYear, mode === 'input' ? now.getMonth() : viewMonth)
  }

  const totalBalance = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 bg-slate-50 text-slate-800">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[85vh]">
        
        {/* ヘッダー */}
        <div className="bg-slate-800 p-6 text-white text-center">
          <h1 className="text-xl font-bold tracking-widest">MY BUDGET</h1>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'input' ? (
            /* --- 入力画面 --- */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs text-emerald-600 font-bold mb-1">今月の収支</p>
                <p className="text-4xl font-black text-emerald-700">¥{totalBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="品目 (例: ランチ)" className="w-full p-4 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-400" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input type="number" placeholder="金額 (支出は -500)" className="w-full p-4 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-400" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button onClick={addItem} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:opacity-90 active:scale-95 transition shadow-lg">記録する</button>
              </div>
            </div>
          ) : (
            /* --- 履歴画面 --- */
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center py-2 border-b">
                <button onClick={() => setViewMonth(v => v - 1)} className="p-2">◀</button>
                <span className="font-bold">{viewYear}年 {viewMonth + 1}月</span>
                <button onClick={() => setViewMonth(v => v + 1)} className="p-2">▶</button>
              </div>
              
              <div className="text-center py-4 bg-slate-100 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold">この月の合計</p>
                <p className="text-2xl font-bold">¥{totalBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 border-b hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-700">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${item.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}</span>
                      <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white border-t flex h-20">
          <button onClick={() => setMode('input')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mode === 'input' ? 'text-slate-800' : 'text-slate-400'}`}>
            <span className="text-2xl">📝</span>
            <span className="text-[10px] font-bold">入力</span>
          </button>
          <button onClick={() => setMode('history')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mode === 'history' ? 'text-slate-800' : 'text-slate-400'}`}>
            <span className="text-2xl">📊</span>
            <span className="text-[10px] font-bold">履歴</span>
          </button>
        </div>
      </div>
    </main>
  )
}