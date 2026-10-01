"use client"
import { useState, useEffect } from 'react'
import { getShop, getProducts, WHATSAPP_LINK, getCurrentUser } from '@/lib/store'
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

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* HEADER - minimal boutique */}
      <header className="sticky top-0 z-30 bg-white border-b h- flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" className="h-8 w-8 rounded-full border"/>
          <div>
            <p className="font-bold text- leading-none">{shop?.name||'Jamoy'}</p>
            <p className="text- text-gray-500">/s/{slug}</p>
          </div>
        </div>
        <Link href={`/s/${slug}/cart`} className="h-8 px-4 rounded-full bg-black text-white text- font-bold flex items-center">
          Cart • {cart.length}
        </Link>
      </header>

      {/* HERO - clean, not huge purple */}
      <div className="p-4">
        <div className="rounded- bg-[#F6F3FF] border p-5 flex gap-4 items-center">
          <img src="/logo.png" className="h- w- rounded- bg-white p-2 border shrink-0"/>
          <div className="min-w-0">
            <h1 className="text- font-bold leading-tight">{shop?.name||'Jamoy'} Boss Bags</h1>
            <p className="text- text-gray-600 mt-1">Pay to Opay <span className="font-bold text-black">{shop?.accountNumber||'9155563698'} {shop?.accountName||'Joy'}</span></p>
            <div className="mt-3 flex gap-2">
              <a href={`https://wa.me/${shop?.whatsapp||'2348137717359'}`} target="_blank" className="h-8 px-4 rounded-full bg-[#25D366] text-white text- font-bold flex items-center">💬 WhatsApp</a>
              <Link href="/track" className="h-8 px-4 rounded-full bg-black text-white text- font-bold flex items-center">📦 Track</Link>
            </div>
          </div>
        </div>

        {/* OWNER BAR - discreet, outside hero, no overlap */}
        {isOwner && (
          <div className="mt-3 rounded-full bg-black text-white p-1.5 flex gap-1.5">
            <Link href={`/dashboard/${slug}`} className="flex-1 h-9 rounded-full bg-white text-black text- font-bold flex items-center justify-center">⚙️ Dashboard</Link>
            <Link href={`/dashboard/${slug}/products`} className="flex-1 h-9 rounded-full bg-[#6B21A8] text-white text- font-bold flex items-center justify-center">👜 Add Product</Link>
            <Link href="/" className="h-9 px-4 rounded-full bg-white/15 text-white text- font-bold flex items-center">Home</Link>
          </div>
        )}
      </div>

      {/* PRODUCTS HEADER */}
      <div className="px-4 mt-2 flex items-center justify-between">
        <p className="font-bold text-">Boss Bags • {products.length}</p>
        <p className="text- text-gray-400">Professional • No overlaps</p>
      </div>

      {/* PRODUCTS GRID - clean, no floating buttons inside */}
      <div className="p-3 grid grid-cols-2 gap-3">
        {products.map((p:any)=>(
          <div key={p.id} className="rounded- border bg-white overflow-hidden">
            <div className="aspect-[4/3] bg-[#FAFAFA]">
              <img src={p.imageUrl||'/logo.png'} className="h-full w-full object-cover"/>
            </div>
            <div className="p-3">
              <p className="text- font-medium leading-tight line-clamp-2 h-">{p.name}</p>
              <p className="mt-1 font-bold text-">₦{p.price?.toLocaleString()}</p>
              <button onClick={()=>addToCart(p)} className="mt-2.5 h-9 w-full rounded-full bg-black text-white text- font-bold">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM - NO floating gear overlapping */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-2">
        <Link href="/" className="flex-1 h-11 rounded-full bg-gray-100 text- font-bold flex items-center justify-center">🏠 Home</Link>
        <a href={`https://wa.me/${shop?.whatsapp||'2348137717359'}`} target="_blank" className="flex-1 h-11 rounded-full bg-[#25D366] text-white text- font-bold flex items-center justify-center">💬 WhatsApp Shop</a>
        <Link href={`/dashboard/${slug}`} className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center">⚙️</Link>
      </div>
    </div>
  )
}