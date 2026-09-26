"use client"
export type Shop={id:string;slug:string;name:string;phone?:string;whatsapp?:string;bankName?:string;accountNumber?:string;accountName?:string;deliveryFee?:number;address?:string;instagram?:string}
export type Product={id:string;shopId:string;name:string;sku:string;price:number;stock:number;image:string;imageUrl?:string;desc?:string;category?:string}
export type Customer={id:string;shopId:string;name:string;phone:string;email?:string;address?:string}
export type Order={id:string;shopId:string;customer:Customer;items:{productId:string;name:string;price:number;qty:number;image:string;imageUrl?:string}[];total:number;deliveryFee:number;status:'Pending'|'Completed'|'Cancelled';payment:'Unpaid'|'Paid'|'Failed';delivery:'Pending'|'In transit'|'Delivered';date:string;paymentMethod:'Transfer'|'Paystack'}
const SHOPS_KEY='orderly_shops_v3_final'
const getKey=(slug:string,type:string)=>`orderly_${type}_${slug}_v3`
export const getShops=():Shop[]=>{
  if(typeof window==='undefined') return []
  const raw=localStorage.getItem(SHOPS_KEY)
  if(!raw){
    const d:Shop[]=[{id:'1',slug:'riri-collection',name:'Riri Collection',phone:'08031234567',whatsapp:'2349064301203',bankName:'Opay',accountNumber:'9064301203',accountName:'Riri collections',deliveryFee:1500,address:'Wuse 2, Abuja',instagram:'@riri_collection'}]
    localStorage.setItem(SHOPS_KEY, JSON.stringify(d))
    return d
  }
  return JSON.parse(raw)
}
export const saveShops=(s:Shop[])=>localStorage.setItem(SHOPS_KEY, JSON.stringify(s))
export const getShopBySlug=(slug:string)=>getShops().find(x=>x.slug===slug)
export const getProducts=(slug:string):Product[]=>{
  if(typeof window==='undefined') return []
  const raw=localStorage.getItem(getKey(slug,'products'))
  if(!raw && slug==='riri-collection'){
    const d:Product[]=[
      {id:'1',shopId:'1',name:'Black Boss Bag',sku:'BLK-BOSS-001',price:30000,stock:10,image:'👜',imageUrl:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',desc:'Premium leather black boss bag',category:'Boss'},
      {id:'2',shopId:'1',name:'Tote Mini Cream',sku:'TOTE-MINI-002',price:18000,stock:3,image:'👝',imageUrl:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',desc:'Mini tote cream',category:'Tote'},
      {id:'3',shopId:'1',name:'Leather Crossbody',sku:'CROSS-003',price:25000,stock:23,image:'👜',imageUrl:'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500',desc:'Crossbody leather',category:'Crossbody'},
      {id:'4',shopId:'1',name:'Red Party Clutch',sku:'CLUTCH-RED',price:15000,stock:0,image:'👛',imageUrl:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',desc:'Red clutch for parties',category:'Clutch'},
    ]
    localStorage.setItem(getKey(slug,'products'), JSON.stringify(d))
    return d
  }
  return raw?JSON.parse(raw):[]
}
export const saveProducts=(slug:string,p:Product[])=>localStorage.setItem(getKey(slug,'products'), JSON.stringify(p))
export const getCustomers=(slug:string):Customer[]=>{if(typeof window==='undefined') return []; const raw=localStorage.getItem(getKey(slug,'customers')); return raw?JSON.parse(raw):[{id:'1',shopId:slug,name:'Amaka Okonkwo',phone:'08031234567',email:'amaka@gmail.com',address:'Wuse 2, Abuja'}]}
export const saveCustomers=(slug:string,c:Customer[])=>localStorage.setItem(getKey(slug,'customers'), JSON.stringify(c))
export const getOrders=(slug:string):Order[]=>{if(typeof window==='undefined') return []; const raw=localStorage.getItem(getKey(slug,'orders')); return raw?JSON.parse(raw):[]}
export const saveOrders=(slug:string,o:Order[])=>localStorage.setItem(getKey(slug,'orders'), JSON.stringify(o))
export const saveSettings=(slug:string,upd:Partial<Shop>)=>{const shops=getShops(); saveShops(shops.map(s=>s.slug===slug?{...s,...upd}:s))}
