'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from './utils/supabase'
// グラフ用のコンポーネントをインポート
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'input' | 'history'>('input')
  
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const fetchTransactions = async (year: number, month: number) => {
    const startDate = new Date(year, month, 1, 0, 0, 0).toISOString()
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true }) // グラフ用に日付順
    
    if (error) console.error(error)
    else if (data) setItems(data)
  }

  useEffect(() => {
    fetchTransactions(mode === 'input' ? now.getFullYear() : viewYear, mode === 'input' ? now.getMonth() : viewMonth)
  }, [mode, viewMonth, viewYear])

  // --- グラフ用データの整形 ---
  const chartData = useMemo(() => {
    const dailyData: { [key: string]: number } = {}
    items.forEach(item => {
      const day = new Date(item.created_at).getDate()
      dailyData[day] = (dailyData[day] || 0) + item.amount
    })
    return Object.keys(dailyData).map(day => ({
      day: `${day}日`,
      amount: dailyData[day]
    }))
  }, [items])

  const addItem = async () => {
    if (!title || !amount) return alert('入力してください')
    const { error } = await supabase
      .from('transactions')
      .insert([{ title, amount: Number(amount), created_at: new Date().toISOString() }])

    if (!error) {
      setTitle(''); setAmount(''); fetchTransactions(now.getFullYear(), now.getMonth())
    }
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) fetchTransactions(viewYear, viewMonth)
  }

  const totalBalance = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 bg-slate-100 text-slate-800">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[90vh]">
        
        <div className="bg-slate-800 p-6 text-white text-center">
          <h1 className="text-xl font-bold tracking-widest">MY BUDGET</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'input' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs text-emerald-600 font-bold mb-1">今月の収支</p>
                <p className="text-4xl font-black text-emerald-700">¥{totalBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="品目" className="w-full p-4 bg-slate-50 border rounded-xl outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input type="number" placeholder="金額" className="w-full p-4 bg-slate-50 border rounded-xl outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button onClick={addItem} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition active:scale-95">記録する</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center py-2 border-b">
                <button onClick={() => setViewMonth(v => v - 1)} className="p-2">◀</button>
                <span className="font-bold text-lg">{viewYear}年 {viewMonth + 1}月</span>
                <button onClick={() => setViewMonth(v => v + 1)} className="p-2">▶</button>
              </div>

              {/* --- グラフ表示エリア --- */}
              <div className="h-48 w-full bg-slate-50 rounded-2xl p-2">
                <p className="text-[10px] font-bold text-slate-400 mb-2 px-2">日別収支推移</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" fontSize={10} tickMargin={5} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-center py-4 bg-slate-100 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Monthly Total</p>
                <p className="text-2xl font-black">¥{totalBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-50">
                    <div>
                      <p className="font-medium text-sm text-slate-700">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${item.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}</span>
                      <button onClick={() => deleteItem(item.id)} className="text-slate-200 hover:text-rose-400 transition">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t flex h-20 shadow-inner">
          <button onClick={() => setMode('input')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mode === 'input' ? 'text-slate-800' : 'text-slate-400'}`}>
            <span className="text-xl">📝</span>
            <span className="text-[10px] font-bold">入力</span>
          </button>
          <button onClick={() => setMode('history')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mode === 'history' ? 'text-slate-800' : 'text-slate-400'}`}>
            <span className="text-xl">📈</span>
            <span className="text-[10px] font-bold">履歴</span>
          </button>
        </div>
      </div>
    </main>
  )
}