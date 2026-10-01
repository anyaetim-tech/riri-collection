"use client"
import { useState, useEffect } from 'react'
import { getShop, getProducts, getOrders, saveOrders, WHATSAPP_LINK, getCurrentUser } from '@/lib/store'
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
    // owner check - if user exists, treat as owner for demo
    if(u) setIsOwner(true)
    const saved = localStorage.getItem(`cart_${slug}`)
    if(saved) setCart(JSON.parse(saved))
  },[slug])

  const addToCart = (p:any)=>{
    const nc = [...cart, p]
    setCart(nc)
    localStorage.setItem(`cart_${slug}`, JSON.stringify(nc))
  }

  const cartCount = cart.length
  const whatsappShop = `https://wa.me/${shop?.whatsapp||'2349064301203'}?text=Hi%20I%20want%20to%20order%20from%20${shop?.name||slug}%20${typeof window!=='undefined'?window.location.href:''}`

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-24">
      {/* TOP BAR - clean */}
      <header className="sticky top-0 z-30 h- bg-white/95 backdrop-blur-xl border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" className="h-9 w-9 rounded-xl border bg-white object-contain p-1.5"/>
          <div className="min-w-0">
            <p className="font-bold text- leading-none truncate">{shop?.name||'Jamoy'}</p>
            <p className="text- text-gray-500 truncate">/s/{slug} • Boss Bags</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${slug}`} className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">⚙️</Link>
          <Link href={`/s/${slug}/cart`} className="h-10 px-5 rounded-full bg-gray-900 text-white text- font-bold flex items-center gap-2">
            Cart {cartCount>0 && <span className="bg-white text-black rounded-full h-5 min-w- px-1 flex items-center justify-center text-">{cartCount}</span>}
            {cartCount===0 && <span>2</span>}
          </Link>
        </div>
      </header>

      {/* HERO - professional, not nested */}
      <div className="mx-3 mt-3 rounded- bg-gradient-to-br from-[#6B21A8] to-[#8b2fd9] p-6 text-white shadow-xl">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded- bg-white p-2 flex items-center justify-center shrink-0">
            <img src="/logo.png" className="h-full w-full object-contain"/>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text- font-bold leading-tight">{shop?.name||'Jamoy'} Boss Bags</h1>
            <p className="mt-2 text- opacity-90 bg-white/15 inline-flex px-3 py-1 rounded-full">Pay to Opay {shop?.accountNumber||'9155563698'} {shop?.accountName||'Joy'}</p>
          </div>
        </div>

        {/* Action pills - horizontal, even, professional */}
        <div className="mt-6 grid grid-cols-1 gap-2.5">
          <Link href={`/dashboard/${slug}`} className="h- rounded-full bg-white text-[#6B21A8] font-bold text- flex items-center justify-center gap-2 shadow-md">
            ⚙️ Dashboard → Manage Shop
          </Link>
          <div className="grid grid-cols-2 gap-2.5">
            <a href={whatsappShop} target="_blank" className="h- rounded-full bg-white/15 border border-white/20 text-white font-bold text- flex items-center justify-center gap-2 backdrop-blur">
              💬 WhatsApp
            </a>
            <Link href="/" className="h- rounded-full bg-black/20 border border-white/10 text-white font-bold text- flex items-center justify-center gap-2">
              🏠 SaaS Home
            </Link>
          </div>
        </div>

        {/* Owner Mode - SEPARATE card, not nested inside */}
      </div>

      {/* Owner Mode - outside hero, clean */}
      {isOwner && (
        <div className="mx-3 mt-3 rounded- bg-white border shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-">Owner Mode</p>
            <p className="text- text-gray-500">You own this shop • Manage</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/${slug}`} className="h-9 px-4 rounded-full bg-[#6B21A8] text-white text- font-bold flex items-center gap-1">⚙️ Dashboard →</Link>
            <Link href={`/dashboard/${slug}/products`} className="h-9 px-4 rounded-full bg-gray-900 text-white text- font-bold flex items-center gap-1">👜 Add Product →</Link>
          </div>
        </div>
      )}

      {/* Products - clean grid, NO overlapping floats */}
      <div className="px-3 mt-5">
        <div className="flex items-center justify-between">
          <p className="font-bold text-">Boss Bags • {products.length} products</p>
          <Link href={`/track`} className="text- font-bold text-[#6B21A8] border px-3 py-1 rounded-full">📦 Track</Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {products.map((p:any)=>(
            <div key={p.id} className="rounded- bg-white border shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-50 relative">
                <img src={p.imageUrl||'/logo.png'} alt={p.name} className="h-full w-full object-cover"/>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="font-bold text- leading-tight line-clamp-2 min-h-">{p.name}</p>
                <p className="mt-1 font-bold text-">₦{p.price?.toLocaleString()}</p>
                <button onClick={()=>addToCart(p)} className="mt-3 h-10 w-full rounded-full bg-gray-900 text-white text- font-bold active:scale-[0.98]">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating - SINGLE, not overlapping products */}
      <div className="fixed bottom-4 right-4 left-4 flex justify-between items-end pointer-events-none">
        <Link href={`/dashboard/${slug}`} className="pointer-events-auto h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl">⚙️</Link>
        <a href={whatsappShop} target="_blank" className="pointer-events-auto h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl text-">💬</a>
      </div>
    </div>
  )
}