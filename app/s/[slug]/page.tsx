"use client"
import { useState, useEffect } from 'react'
import { getShop, getProducts, getCurrentUser } from '@/lib/store'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ShopPage(){
  const params = useParams()
  const slug = params?.slug as string || 'jamoy'
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)

  useEffect(()=>{
    setShop(getShop(slug))
    setProducts(getProducts(slug))
    const u = getCurrentUser()
    if(u) setIsOwner(true)
    const saved = localStorage.getItem(`cart_${slug}`)
    if(saved) setCart(JSON.parse(saved))
  },[slug])

  const addToCart = (p:any)=>{
    const nc=[...cart,p]; setCart(nc); localStorage.setItem(`cart_${slug}`,JSON.stringify(nc))
  }

  const wa = `https://wa.me/${shop?.whatsapp||'2348137717359'}?text=Hi%20I%20want%20${shop?.name||'Jamoy'}%20-%20${typeof window!=='undefined'?location.href:''}`

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER - 56px only, no clutter */}
      <header className="sticky top-0 z-20 bg-white border-b h- px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="h-8 w-8 rounded-full border object-contain bg-white"/>
          <div>
            <p className="font-bold text- leading-none">{shop?.name||'Jamoy'}</p>
            <p className="text- text-gray-500">/s/{slug}</p>
          </div>
        </div>
        <Link href={`/s/${slug}/cart`} className="h-8 px-4 rounded-full bg-black text-white text- font-bold">
          Cart • {cart.length}
        </Link>
      </header>

      {/* HERO - SMALL, clean, no huge logo */}
      <div className="p-4">
        <div className="rounded- bg-[#F8F5FF] border border-[#EDE7FF] p-4 flex gap-3">
          <img src="/logo.png" className="h-14 w-14 rounded- bg-white border p-2 object-contain shrink-0"/>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text- leading-tight truncate">{shop?.name||'Jamoy'} Boss Bags</h1>
            <p className="text- text-gray-600 mt-1 truncate">Pay to 【entity-Opay¦canonical_name=Opay】 <span className="font-bold text-black">{shop?.accountNumber||'9155563698'} {shop?.accountName||'Joy'}</span></p>
            <div className="mt-2 flex gap-2">
              <a href={wa} target="_blank" className="h-7 px-3 rounded-full bg-[#25D366] text-white text- font-bold flex items-center">💬 【entity-WhatsApp¦canonical_name=WhatsApp】</a>
              <Link href="/track" className="h-7 px-3 rounded-full bg-black text-white text- font-bold flex items-center">📦 Track</Link>
            </div>
          </div>
        </div>

        {/* OWNER - single row, no black pill cutting */}
        {isOwner && (
          <div className="mt-3 flex gap-2">
            <Link href={`/dashboard/${slug}`} className="flex-1 h-10 rounded-full bg-black text-white text- font-bold flex items-center justify-center gap-1">⚙️ Dashboard</Link>
            <Link href={`/dashboard/${slug}/products`} className="flex-1 h-10 rounded-full bg-[#6B21A8] text-white text- font-bold flex items-center justify-center gap-1">👜 Add Product</Link>
            <Link href="/" className="h-10 px-4 rounded-full bg-gray-100 text- font-bold flex items-center justify-center">Home</Link>
          </div>
        )}
      </div>

      {/* PRODUCTS TITLE */}
      <div className="px-4 flex items-center justify-between">
        <p className="font-bold text-">Boss Bags • {products.length} products</p>
        <span className="text- text-gray-400">Clean • No overlap</span>
      </div>

      {/* GRID - no floating inside */}
      <div className="p-3 grid grid-cols-2 gap-3 pb-">
        {products.map((p:any)=>(
          <div key={p.id} className="rounded- border bg-white overflow-hidden">
            <div className="aspect-[4/3] bg-gray-50">
              <img src={p.imageUrl} className="w-full h-full object-cover"/>
            </div>
            <div className="p-3">
              <p className="text- font-medium truncate">{p.name}</p>
              <p className="font-bold text- mt-1">₦{p.price?.toLocaleString()}</p>
              <button onClick={()=>addToCart(p)} className="mt-2 h-9 w-full rounded-full bg-black text-white text- font-bold">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM - fixed, 3 buttons, no gear overlapping product */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-3 py-3 flex gap-2">
        <Link href="/" className="flex-1 h-11 rounded-full bg-gray-100 text- font-bold flex items-center justify-center">🏠 Home</Link>
        <a href={wa} target="_blank" className="flex-[1.5] h-11 rounded-full bg-[#25D366] text-white text- font-bold flex items-center justify-center">💬 WhatsApp Shop</a>
        <Link href={`/dashboard/${slug}`} className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center">⚙️</Link>
      </div>
    </div>
  )
}