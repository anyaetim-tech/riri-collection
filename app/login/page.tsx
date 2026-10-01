"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUsers, setCurrentUser, getCurrentUser, logoutUser, WHATSAPP_LINK } from '@/lib/store'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [err, setErr] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(()=>{
    setMounted(true)
    const update = ()=> setUser(getCurrentUser())
    update()
    window.addEventListener('riri-auth-change', update)
    return ()=> window.removeEventListener('riri-auth-change', update)
  },[])

  const login = ()=>{
    if(!email){ setErr('Enter email'); return }
    const u = getUsers().find(x=>x.email.toLowerCase()===email.toLowerCase().trim())
    if(u){
      setCurrentUser(u)
      setUser(u)
      router.push('/dashboard')
    } else {
      setErr('No account found - Please Signup first with that email')
    }
  }

  const doLogout = ()=>{
    logoutUser()
    setUser(null)
    setErr('Logged out successfully - you can login again')
  }

  if(!mounted) return <div className="p-10 text-center">Loading Riri...</div>

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="bg-white rounded- p-8 max-w-md w-full shadow-xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-10 w-10 rounded-xl border bg-white shadow-sm"/>
            <span className="font-bold">Riri SaaS</span>
            <span className="text- bg-[#6B21A8] text-white rounded-full px-2 py-0.5 font-bold">PRO</span>
          </div>
          <div className="flex gap-2">
            <Link href="/s/riri-collection" className="h-8 px-3 rounded-full bg-white border text- font-bold">🛍️ Shop</Link>
            <a href={WHATSAPP_LINK} target="_blank" className="h-8 px-3 rounded-full bg-green-50 border border-green-200 text-green-700 text- font-bold">💬 WhatsApp</a>
          </div>
        </div>

        {user? (
          <>
            <div className="mt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-[#6B21A8] text-white flex items-center justify-center mx-auto font-bold text- shadow-lg">{user.name[0].toUpperCase()}</div>
              <h1 className="mt-4 text- font-bold">Hi, {user.name} 👋</h1>
              <p className="text- text-gray-500">Logged in • All pages connected • Logout works</p>
            </div>
            <div className="mt-6 space-y-3">
              <Link href="/dashboard" className="block w-full h-12 rounded-full bg-[#6B21A8] text-white flex items-center justify-center font-bold shadow-md">⚙️ Dashboard</Link>
              <Link href="/s/riri-collection" className="block w-full h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">🛍️ Shop /s/riri-collection</Link>
              <Link href="/track" className="block w-full h-12 rounded-full bg-white border flex items-center justify-center font-bold">📦 Track Order</Link>
              <a href={WHATSAPP_LINK} target="_blank" className="block w-full h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">💬 WhatsApp Shop</a>
              <button onClick={doLogout} className="w-full h-12 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold hover:bg-red-100">🚪 Logout - Works Everywhere</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 text- font-bold">Welcome back ✨</h1>
            <p className="text- text-gray-500 mt-1">Login works properly • Shop + WhatsApp + Logout</p>
            <div className="mt-6">
              <Label>Email *</Label>
              <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" className="mt-1"/>
              {err && <p className="mt-3 text- bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl">{err}</p>}
              <Button onClick={login} className="mt-4 w-full">Login → Dashboard</Button>
              <div className="mt-4 flex justify-between text-">
                <Link href="/signup" className="font-bold text-[#6B21A8]">Create store (Signup)</Link>
                <Link href="/track" className="font-bold">📦 Track order</Link>
              </div>
              <div className="mt-6 p-3 rounded-2xl bg-[#6B21A8]/5 border border-[#6B21A8]/20">
                <p className="text- font-bold text-[#6B21A8]">Test Login:</p>
                <p className="text- text-gray-600">Use email you used in Signup. If you haven't signed up, click Create store.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}