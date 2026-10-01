"use client"; import Link from 'next/link'; import { usePathname, useRouter } from 'next/navigation'; import { getCurrentUser, logoutUser, WHATSAPP_LINK } from '@/lib/store'; import { useState, useEffect } from 'react';
export function Sidebar({shopSlug,open,setOpen}:{shopSlug:string;open:boolean;setOpen:(v:boolean)=>void}){
  const s=(shopSlug||'riri-collection'); const b=`/dashboard/${s}`; const pn=usePathname(); const r=useRouter();
  const [u,setU]=useState<any>(null);
  useEffect(()=>{ const upd=()=>setU(getCurrentUser()); upd(); window.addEventListener('riri-auth-change',upd); return()=>window.removeEventListener('riri-auth-change',upd); },[]);
  const items=[
    {n:'Dashboard',h:b,ic:'📊'},
    {n:'Products',h:`${b}/products`,ic:'👜'},
    {n:'Orders',h:`${b}/orders`,ic:'📦'},
    {n:'Deliveries',h:`${b}/deliveries`,ic:'🚚'},
    {n:'Settings',h:`${b}/settings`,ic:'⚙️'},
    {n:'Track',h:`/track`,ic:'📍'},
  ];
  const lo=()=>{ logoutUser(); setU(null); r.push('/login'); };
  return <>
    <div className={`fixed inset-0 z-40 bg-black/30 lg:hidden ${open?'block':'hidden'}`} onClick={()=>setOpen(false)}/>
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex w- flex-col border-r bg-white ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'} transition-transform`}>
      <div className='h- flex items-center gap-3 px-5 border-b bg-gradient-to-r from-[#6B21A8]/5 to-transparent'>
        <img src='/logo.png' alt='Riri' className='h-11 w-11 rounded-xl object-contain bg-white border shadow-sm'/>
        <div><p className='font-bold text-'>Riri Collection</p><p className='text- text-[#6B21A8] font-bold'>/{s} • {u?.name||'Jamoy'}</p></div>
      </div>
      <div className='p-4'>
        <div className='rounded-2xl bg-[#FAF8F5] border p-3 flex items-center gap-3'>
          <div className='h-11 w-11 rounded-full bg-[#6B21A8] text-white flex items-center justify-center font-bold shadow-md'>{u?.name?.[0]?.toUpperCase()||'J'}</div>
          <div className='flex-1 min-w-0'>
            <p className='font-bold text- truncate'>{u?.name||'Jamoy'} ✨</p>
            <p className='text- text-gray-500 truncate'>/s/{s} ↔ /dashboard/{s}</p>
          </div>
          {u&&<button onClick={lo} className='text- font-bold border bg-white rounded-full px-3 py-1.5 hover:bg-red-50 hover:text-red-600'>Logout</button>}
        </div>
      </div>
      <nav className='flex-1 p-3 space-y-1.5'>
        {items.map(it=>{ const a=pn===it.h; return <Link key={it.n} href={it.h} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text- font-medium transition-all ${a?'bg-[#6B21A8] text-white shadow-lg':'text-gray-600 hover:bg-gray-50'}`}><span>{it.ic}</span>{it.n}</Link>})}
        <a href={WHATSAPP_LINK} target='_blank' className='flex items-center gap-3 rounded-2xl px-4 py-3.5 text- font-medium text-green-700 bg-green-50 border border-green-200'><span>💬</span>WhatsApp</a>
        <a href={`/s/${s}`} className='flex items-center gap-3 rounded-2xl px-4 py-3.5 text- font-medium bg-gray-900 text-white'><span>🛍️</span>View Shop /s/{s}</a>
      </nav>
      <div className='p-3 space-y-2'>
        <div className='rounded-2xl bg-gradient-to-br from-[#6B21A8] to-[#8b2fd9] p-4 text-white'>
          <p className='font-bold text-'>Live Shop ✨</p>
          <p className='text- opacity-90 mt-1'>/s/{s} • Not isolated • {u?.name}</p>
          <div className='mt-3 grid grid-cols-2 gap-2'>
            <Link href={`/s/${s}`} className='rounded-full bg-white text-[#6B21A8] text-center py-2 text- font-bold'>🛍️ Shop</Link>
            <a href={WHATSAPP_LINK} target='_blank' className='rounded-full bg-green-500 text-white text-center py-2 text- font-bold'>💬 WhatsApp</a>
          </div>
        </div>
        <button onClick={lo} className='w-full rounded-full bg-red-50 border border-red-200 text-red-600 py-2.5 text- font-bold'>🚪 Logout Works Everywhere</button>
      </div>
    </aside>
  </>
}