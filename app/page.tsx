'use client'

import { useEffect, useState } from 'react'
import { createClient } from './utils/supabase'

export default function Home() {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')

  // 1. データを読み込む
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error:', error)
    else if (data) setItems(data)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // 2. データを追加する
  const addItem = async () => {
    if (!title || !amount) return alert('入力してください！')
    const { error } = await supabase
      .from('transactions')
      .insert([{ title, amount: Number(amount) }])

    if (error) alert('保存に失敗しました')
    else {
      setTitle(''); setAmount(''); fetchTransactions()
    }
  }

  // 3. データを削除する (追加機能！)
  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) alert('削除に失敗しました')
    else fetchTransactions()
  }

  // 4. 合計金額を計算する (追加機能！)
  const totalBalance = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 bg-slate-100 text-slate-800 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-slate-700 tracking-tight">
          📊 My Budget
        </h1>

        {/* 合計表示エリア */}
        <div className={`p-6 rounded-xl mb-8 text-center shadow-inner ${totalBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">現在の収支合計</p>
          <p className={`text-4xl font-black ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ¥{totalBalance.toLocaleString()}
          </p>
        </div>
        
        {/* 入力フォーム */}
        <div className="space-y-4 mb-10 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input 
            type="text" 
            placeholder="何に使った？ (例: ラーメン)" 
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="金額 (マイナスで支出)" 
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-[10px] text-slate-400 px-1">※ 支出は「-500」のようにマイナスで入力してください</p>
          <button 
            onClick={addItem}
            className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 active:scale-95 transition shadow-lg"
          >
            記録する
          </button>
        </div>

        {/* 履歴リスト */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-400 ml-1">最近の履歴</h2>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {items.map((item) => (
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
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}