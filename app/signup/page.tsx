"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signupUser } from '@/lib/store'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Signup(){
  const router = useRouter()
  const [form, setForm] = useState({name:'', email:'', phone:''})
  const [err, setErr] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(()=>{ setMounted(true) },[])

  const submit = ()=>{
    if(!form.name ||!form.email){ setErr('Name and Email required'); return }
    try{
      signupUser(form.name, form.email, form.phone)
      router.push('/onboarding')
    }catch(e:any){
      setErr(e.message)
    }
  }

  if(!mounted) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="bg-white rounded- p-8 max-w-md w-full shadow-xl border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="h-10 w-10 rounded-xl border bg-white"/>
          <span className="font-bold">Riri SaaS</span>
        </div>
        <h1 className="mt-6 text- font-bold">Create store</h1>
        <p className="text- text-gray-500">Fixes (0,!signupUser) is not a function</p>
        <div className="mt-6 space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Jamoy" className="mt-1"/>
          </div>
          <div>
            <Label>Email *</Label>
            <Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="anyaetim@gmail.com" className="mt-1"/>
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="08137717359" className="mt-1"/>
          </div>
          {err && <p className="text- bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl">{err}</p>}
          <Button onClick={submit} className="w-full">Create →</Button>
          <p className="text-center text-">Have account? <Link href="/login" className="font-bold text-[#6B21A8]">Login</Link></p>
        </div>
      </div>
    </div>
  )
}