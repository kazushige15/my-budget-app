'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from './utils/supabase'
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
      .order('created_at', { ascending: true })
    
    if (error) console.error(error)
    else if (data) setItems(data)
  }

  useEffect(() => {
    fetchTransactions(mode === 'input' ? now.getFullYear() : viewYear, mode === 'input' ? now.getMonth() : viewMonth)
  }, [mode, viewMonth, viewYear])

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
    // ★ 全体をパステルピンクの背景に
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 bg-pink-50 text-pink-950 font-mono">
      {/* ★ 強い丸みとピンクの影 */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-pink-200 w-full max-w-md overflow-hidden flex flex-col h-[90vh] border-4 border-pink-100">
        
        {/* ★ ヘッダーをピンクに、豚ちゃんアイコンを追加 */}
        <div className="bg-pink-500 p-6 text-white text-center border-b-4 border-pink-600">
          <h1 className="text-2xl font-black tracking-widest flex items-center justify-center gap-3">
            <span>🐽</span>
            PIGGY BANK
            <span>🐽</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === 'input' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* ★ 収支表示をぷっくりと */}
              <div className="text-center py-10 bg-pink-100 rounded-3xl border-4 border-pink-200 shadow-inner">
                <p className="text-xs text-pink-600 font-bold mb-2 uppercase tracking-widest">今月のちょきん</p>
                <p className="text-5xl font-black text-pink-700">¥{totalBalance.toLocaleString()}</p>
              </div>

              {/* ★ 入力フォームを丸く、ピンクのアクセント */}
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📝</span>
                  <input type="text" placeholder="なにに使った？" className="w-full p-5 pl-12 bg-white border-2 border-pink-200 rounded-full outline-none focus:ring-4 focus:ring-pink-300 placeholder:text-pink-300 transition" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">💰</span>
                  <input type="number" placeholder="いくら？ (支出はマイナス)" className="w-full p-5 pl-12 bg-white border-2 border-pink-200 rounded-full outline-none focus:ring-4 focus:ring-pink-300 placeholder:text-pink-300 transition" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <button onClick={addItem} className="w-full bg-pink-600 text-white py-5 rounded-full font-black text-lg shadow-lg shadow-pink-300 transition hover:bg-pink-700 active:scale-95 flex items-center justify-center gap-3">
                  <span>🐷</span>
                  チャリン！と記録
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              {/* ★ カレンダーコントローラー */}
              <div className="flex justify-between items-center py-3 px-4 bg-pink-50 rounded-full border-2 border-pink-100">
                <button onClick={() => setViewMonth(v => v - 1)} className="p-2 text-pink-600 text-xl hover:scale-125 transition">◀</button>
                <span className="font-bold text-lg text-pink-900">{viewYear}年 {viewMonth + 1}月</span>
                <button onClick={() => setViewMonth(v => v + 1)} className="p-2 text-pink-600 text-xl hover:scale-125 transition">▶</button>
              </div>

              {/* ★ グラフをピンクベースに */}
              <div className="h-48 w-full bg-pink-50 rounded-3xl p-4 border-2 border-pink-100">
                <p className="text-[10px] font-bold text-pink-400 mb-2 px-2 uppercase tracking-widest">Daily Report</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fbcfe8" />
                    <XAxis dataKey="day" fontSize={10} tickMargin={5} stroke="#db2777" />
                    <YAxis fontSize={10} stroke="#db2777" />
                    <Tooltip contentStyle={{backgroundColor: '#fff', border: '2px solid #fbcfe8', borderRadius: '10px'}} />
                    {/* ★ グラフの線を濃いピンクに */}
                    <Line type="monotone" dataKey="amount" stroke="#db2777" strokeWidth={4} dot={{ r: 5, stroke: '#db2777', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, stroke: '#db2777', fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-center py-4 bg-pink-100 rounded-2xl border-2 border-pink-200">
                <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Monthly Total</p>
                <p className="text-2xl font-black text-pink-700">¥{totalBalance.toLocaleString()}</p>
              </div>

              {/* ★ リストアイテムを丸く、かわいく */}
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-5 bg-white rounded-2xl border-2 border-pink-100 shadow-sm hover:border-pink-300 transition">
                    <div>
                      <p className="font-bold text-pink-950">{item.title}</p>
                      <p className="text-[10px] text-pink-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-lg ${item.amount >= 0 ? 'text-pink-500' : 'text-pink-700'}`}>{item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}</span>
                      <button onClick={() => deleteItem(item.id)} className="text-pink-200 hover:text-pink-600 transition text-xl">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ★ ナビゲーションをピンクに */}
        <div className="bg-pink-50 border-t-4 border-pink-100 flex h-24 shadow-inner">
          <button onClick={() => setMode('input')} className={`flex-1 flex flex-col items-center justify-center gap-2 ${mode === 'input' ? 'text-pink-600' : 'text-pink-300'} hover:text-pink-500 transition`}>
            <span className="text-3xl">📝</span>
            <span className="text-xs font-bold uppercase tracking-widest">いれる</span>
          </button>
          <button onClick={() => setMode('history')} className={`flex-1 flex flex-col items-center justify-center gap-2 ${mode === 'history' ? 'text-pink-600' : 'text-pink-300'} hover:text-pink-500 transition`}>
            <span className="text-3xl">📈</span>
            <span className="text-xs font-bold uppercase tracking-widest">みる</span>
          </button>
        </div>
      </div>
    </main>
  )
}