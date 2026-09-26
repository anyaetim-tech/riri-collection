
"use client"
export type Shop={id:string;slug:string;name:string;ownerId:string;phone?:string;whatsapp?:string;bankName?:string;accountNumber?:string;accountName?:string;deliveryFee?:number;address?:string}
export type Product={id:string;shopId:string;name:string;sku:string;price:number;stock:number;image:string;imageUrl?:string;desc?:string;category?:string}
export type User={id:string;email:string;name:string;phone?:string}
export type Order={id:string;shopId:string;customer:any;items:any[];total:number;deliveryFee:number;status:string;payment:string;delivery:string;date:string;paymentMethod:string}
const SK='riri_sa_shops_v70'
const UK='riri_sa_users_v70'
const CU='riri_sa_current_user_v70'
const k=(slug:string,t:string)=>`riri_sa_${t}_${slug}_v70`
export const getCurrentUser=():User|null=>{ if(typeof window==='undefined') return null; try{ const r=localStorage.getItem(CU); return r?JSON.parse(r):null }catch{ return null } }
export const setCurrentUser=(u:User|null)=>{ if(typeof window==='undefined') return; if(u) localStorage.setItem(CU, JSON.stringify(u)); else localStorage.removeItem(CU) }
export const getUsers=():User[]=>{ if(typeof window==='undefined') return []; try{ const r=localStorage.getItem(UK); return r?JSON.parse(r):[] }catch{ return [] } }
export const saveUsers=(u:User[])=>{ if(typeof window==='undefined') return; localStorage.setItem(UK, JSON.stringify(u)) }
export const signupUser=(name:string,email:string,phone:string):User=>{ const users=getUsers(); if(users.some(x=>x.email.toLowerCase()===email.toLowerCase())) throw new Error('Email exists'); const nu:User={id:Date.now().toString(),email:email.toLowerCase(),name,phone}; saveUsers([...users,nu]); setCurrentUser(nu); return nu }
export const getShops=():Shop[]=>{ if(typeof window==='undefined') return []; try{ const r=localStorage.getItem(SK); if(!r){ const d:Shop[]=[{id:'1',slug:'riri-collection',name:'Riri Collection',ownerId:'owner-riri',phone:'08031234567',whatsapp:'2349064301203',bankName:'Opay',accountNumber:'9064301203',accountName:'Riri collections',deliveryFee:1500,address:'Wuse 2, Abuja'}]; localStorage.setItem(SK, JSON.stringify(d)); return d;} return JSON.parse(r) }catch{ return [] } }
export const saveShops=(s:Shop[])=>{ if(typeof window==='undefined') return; localStorage.setItem(SK, JSON.stringify(s)) }
export const getShop=(slug:string|undefined)=>{ if(!slug) return undefined; try{ return getShops().find(x=>x.slug===slug) }catch{ return undefined } }
export const createShop=(data:Partial<Shop>, ownerId:string):Shop=>{ const shops=getShops(); const slug=(data.slug||data.name||'shop').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,30); if(!slug) throw new Error('Slug required'); if(shops.some(s=>s.slug===slug)) throw new Error('Shop slug exists'); const ns:Shop={id:Date.now().toString(),slug,name:data.name||slug,ownerId,phone:data.phone,whatsapp:data.whatsapp,bankName:data.bankName,accountNumber:data.accountNumber,accountName:data.accountName,deliveryFee:data.deliveryFee||1500,address:data.address||'Abuja'}; saveShops([...shops,ns]); return ns }
export const getProducts=(slug:string|undefined):Product[]=>{ if(typeof window==='undefined' || !slug) return []; try{ const r=localStorage.getItem(k(slug,'products')); if(!r && slug==='riri-collection'){ const d:Product[]=[{id:'1',shopId:'1',name:'Black Boss Bag',sku:'BLK-BOSS-001',price:30000,stock:10,image:'👜',imageUrl:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',desc:'Premium',category:'Boss'},{id:'2',shopId:'1',name:'Tote Mini Cream',sku:'TOTE-MINI-002',price:18000,stock:5,image:'👝',imageUrl:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',desc:'Mini tote',category:'Tote'}]; localStorage.setItem(k(slug,'products'), JSON.stringify(d)); return d;} return r?JSON.parse(r):[] }catch{ return [] } }
export const saveProducts=(slug:string,p:Product[])=>{ if(typeof window==='undefined' || !slug) return; localStorage.setItem(k(slug,'products'), JSON.stringify(p)) }
export const getOrders=(slug:string|undefined):Order[]=>{ if(typeof window==='undefined' || !slug) return []; try{ const r=localStorage.getItem(k(slug,'orders')); return r?JSON.parse(r):[] }catch{ return [] } }
export const saveOrders=(slug:string,o:Order[])=>{ if(typeof window==='undefined' || !slug) return; localStorage.setItem(k(slug,'orders'), JSON.stringify(o)) }
export const saveShop=(slug:string,u:Partial<Shop>)=>{ const shops=getShops(); saveShops(shops.map(s=>s.slug===slug?{...s,...u}:s)); }
