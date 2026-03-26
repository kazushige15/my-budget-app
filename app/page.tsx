'use client'

import { useEffect, useState } from 'react'
import { createClient } from './utils/supabase'

export default function Home() {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  
  // 現在の日付を取得（日本時間の計算用）
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  // 1. データを読み込む（選択された月の範囲で絞り込み）
  const fetchTransactions = async () => {
    // 選択された月の「1日 00:00:00」
    const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0).toISOString()
    // 選択された月の「末日 23:59:59」
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error:', error)
    else if (data) setItems(data)
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentMonth, currentYear])

  // 2. データを追加する
  const addItem = async () => {
    if (!title || !amount) return alert('入力してください！')

    // ★重要：サーバーの時間（UTC）に任せず、ブラウザ側の現在時刻を明示的に送る
    const createdAt = new Date().toISOString()

    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        title, 
        amount: Number(amount),
        created_at: createdAt 
      }])

    if (error) {
      console.error('Error inserting:', error)
      alert('保存に失敗しました')
    } else {
      setTitle('')
      setAmount('')
      // 反映を確実にするため、少し待ってから再読み込み
      setTimeout(() => fetchTransactions(), 300)
    }
  }

  // 3. データを削除する
  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) alert('削除に失敗しました')
    else fetchTransactions()
  }

  // 月を切り替える関数
  const changeMonth = (diff: number) => {
    const newDate = new Date(currentYear, currentMonth + diff, 1)
    setCurrentMonth(newDate.getMonth())
    setCurrentYear(newDate.getFullYear())
  }

  const totalBalance = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 bg-slate-100 text-slate-800 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-slate-700 tracking-tight">
          📊 My Budget
        </h1>

        {/* 月切り替えコントローラー */}
        <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-lg border">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded-md transition text-xl">◀</button>
          <div className="text-center">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentYear}</span>
            <span className="font-bold text-xl text-slate-700">{currentMonth + 1}月</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded-md transition text-xl">▶</button>
        </div>

        {/* 合計表示 */}
        <div className={`p-6 rounded-xl mb-8 text-center shadow-inner ${totalBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{currentMonth + 1}月の収支合計</p>
          <p className={`text-4xl font-black ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ¥{totalBalance.toLocaleString()}
          </p>
        </div>
        
        {/* 入力フォーム */}
        <div className="space-y-4 mb-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input 
            type="text" 
            placeholder="何に使った？" 
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="金額 (支出はマイナス)" 
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button 
            onClick={addItem}
            className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 active:scale-95 transition shadow-lg"
          >
            記録する
          </button>
        </div>

        {/* 履歴リスト */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-400 ml-1">{currentMonth + 1}月の履歴</h2>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {items.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm italic">この月のデータはありません</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{item.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-lg ${item.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}
                    </span>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="text-slate-300 hover:text-rose-400 transition text-sm p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}