"use client"
import { useState, useEffect } from 'react'
import { getProducts, saveProducts } from '@/lib/store'
import { useParams } from 'next/navigation'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ProductsPage(){
  const params=useParams()
  const slug=params?.slug as string || 'jamoy'
  const [products,setProducts]=useState<any[]>([])
  const [form,setForm]=useState({name:'', price:'', imageUrl:''})

  useEffect(()=>{ setProducts(getProducts(slug)) },[slug])

  const reload=()=> setProducts(getProducts(slug))

  const add=()=>{
    if(!form.name ||!form.price) return
    const np={id:Date.now().toString(), shopId:slug, name:form.name, sku:`SKU-${Date.now()}`, price:Number(form.price), stock:10, imageUrl:form.imageUrl||'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'}
    const updated=[...products, np]
    saveProducts(slug, updated)
    setProducts(updated)
    setForm({name:'', price:'', imageUrl:''})
  }

  const del=(id:string)=>{
    if(!confirm('Delete this product?')) return
    const updated=products.filter(p=>p.id!==id)
    saveProducts(slug, updated)
    setProducts(updated)
  }

  const deleteAll=()=>{
    if(!confirm(`Delete ALL ${products.length} products for /s/${slug}?`)) return
    saveProducts(slug, [])
    setProducts([])
  }

  return (
    <div className='p-4 bg-[#FAF9F7] min-h-screen pb-20'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-bold text-'>Products • /s/{slug}</h1>
          <p className='text- text-gray-500'>{products.length} products • Professional • Ready</p>
        </div>
        {products.length>0 && <button onClick={deleteAll} className='h-9 px-4 rounded-full bg-red-50 border border-red-200 text-red-600 text- font-bold'>🗑 Delete All</button>}
      </div>

      <div className='mt-4 bg-white rounded- border p-4 space-y-3'>
        <div><Label>Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder='Boss Bag Gold' className='mt-1'/></div>
        <div><Label>Price *</Label><Input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder='25000' className='mt-1'/></div>
        <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} placeholder='https://...' className='mt-1'/></div>
        <Button onClick={add} className='w-full'>Add Product</Button>
      </div>

      <div className='mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3'>
        {products.map((p:any)=>(
          <div key={p.id} className='rounded- bg-white border overflow-hidden flex flex-col'>
            <div className='relative'>
              <img src={p.imageUrl} className='h- w-full object-cover bg-gray-50'/>
              <button onClick={()=>del(p.id)} className='absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center text-'>✕</button>
            </div>
            <div className='p-3 flex-1 flex flex-col'>
              <p className='text- font-medium truncate'>{p.name}</p>
              <p className='text- font-bold'>₦{p.price?.toLocaleString()}</p>
              <div className='mt-2 flex gap-2'>
                <button onClick={()=>del(p.id)} className='flex-1 h-8 rounded-full bg-red-50 border border-red-200 text-red-600 text- font-bold'>🗑 Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length===0 && (
        <div className='mt-6 bg-white border border-dashed rounded- p-8 text-center'>
          <p className='text- text-gray-500'>No products — add your Boss Bags</p>
        </div>
      )}
    </div>
  )
}