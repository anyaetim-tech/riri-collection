"use client"
// FIXES: isolated shop, signupUser is not a function, login works, jamoy gets products
export type Shop = { id:string; slug:string; name:string; ownerId:string; phone?:string; whatsapp?:string; bankName?:string; accountNumber?:string; accountName?:string; deliveryFee?:number; address?:string }
export type Product = { id:string; shopId:string; name:string; sku:string; price:number; stock:number; image:string; imageUrl?:string; desc?:string }
export type User = { id:string; email:string; name:string; phone?:string }
export type Order = { id:string; shopId:string; customer:any; items:any[]; total:number; deliveryFee:number; status:string; payment:string; delivery:string; date:string; paymentMethod:string }

const SK='riri_ultimate_shops'
const UK='riri_ultimate_users'
const CK='riri_ultimate_current'
const kf=(s:string,t:string)=>`riri_ultimate_${t}_${s}`

export const WHATSAPP_NUMBER='2349064301203'
export const WHATSAPP_LINK='https://wa.me/2349064301203?text=Hi%20Riri%20Collection'
export const SHOP_SLUG='riri-collection'

export const getCurrentUser=():User|null=>{if(typeof window==='undefined')return null;try{const r=localStorage.getItem(CK);return r?JSON.parse(r):null}catch{return null}}
export const setCurrentUser=(u:User|null)=>{if(typeof window==='undefined')return;if(u)localStorage.setItem(CK,JSON.stringify(u));else localStorage.removeItem(CK);if(typeof window!=='undefined')window.dispatchEvent(new Event('riri-auth-change'))}
export const logoutUser=()=>{if(typeof window==='undefined')return;localStorage.removeItem(CK);if(typeof window!=='undefined')window.dispatchEvent(new Event('riri-auth-change'))}
export const getUsers=():User[]=>{if(typeof window==='undefined')return[];try{const r=localStorage.getItem(UK);return r?JSON.parse(r):[]}catch{return[]}}
export const saveUsers=(u:User[])=>{if(typeof window==='undefined')return;localStorage.setItem(UK,JSON.stringify(u))}
export const signupUser=(n:string,e:string,p:string):User=>{const us=getUsers();const lo=e.toLowerCase().trim();if(us.some(x=>x.email.toLowerCase()===lo))throw new Error('Email exists - Login instead');if(!n||!lo)throw new Error('Name and Email required');const nu:User={id:Date.now().toString(),email:lo,name:n.trim(),phone:p.trim()};saveUsers([...us,nu]);setCurrentUser(nu);return nu}

export const getShops=():Shop[]=>{if(typeof window==='undefined')return[];try{const r=localStorage.getItem(SK);if(!r){const d:Shop[]=[{id:'1',slug:SHOP_SLUG,name:'Riri Collection',ownerId:'owner-riri',phone:'08031234567',whatsapp:WHATSAPP_NUMBER,bankName:'Opay',accountNumber:'9064301203',accountName:'Riri collections',deliveryFee:1500,address:'Wuse 2, Abuja'}];localStorage.setItem(SK,JSON.stringify(d));return d;}return JSON.parse(r)}catch{return[]}}
export const saveShops=(s:Shop[])=>{if(typeof window==='undefined')return;localStorage.setItem(SK,JSON.stringify(s))}
export const getShop=(s:string|undefined)=>{if(!s)return undefined;try{return getShops().find(x=>x.slug===s)}catch{return undefined}}
export const createShop=(d:Partial<Shop>,o:string):Shop=>{const shops=getShops();const slug=(d.slug||d.name||'shop').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,30);if(!slug)throw new Error('Slug required');if(shops.some(s=>s.slug===slug))throw new Error('Shop exists');const ns:Shop={id:Date.now().toString(),slug,name:d.name||slug,ownerId:o,phone:d.phone,whatsapp:d.whatsapp||WHATSAPP_NUMBER,bankName:d.bankName||'Opay',accountNumber:d.accountNumber,accountName:d.accountName,deliveryFee:d.deliveryFee||1500,address:d.address||'Abuja'};saveShops([...shops,ns]);return ns}

// FIXED: Any shop gets products, not just riri-collection - fixes isolated
export const getProducts=(s:string|undefined):Product[]=>{
  if(typeof window==='undefined'||!s)return[]
  try{
    const r=localStorage.getItem(kf(s,'products'))
    if(!r){
      // New shop like jamoy - give it starter products OR empty that can be added to
      const defaults:Product[] = s==='riri-collection'? [
        {id:'1',shopId:'1',name:'Black Boss Bag',sku:'BLK-001',price:30000,stock:10,image:'👜',imageUrl:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',desc:'Premium'},
        {id:'2',shopId:'1',name:'Tote Mini Cream',sku:'TOTE-002',price:18000,stock:5,image:'👝',imageUrl:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',desc:'Mini tote'},
        {id:'3',shopId:'1',name:'Gold Chain Bag',sku:'GOLD-003',price:25000,stock:8,image:'👛',imageUrl:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',desc:'Gold chain'}
      ] : [
        // For jamoy and any new shop - starter products so not isolated 0
        {id:`${Date.now()}-1`,shopId:s,name:'Boss Bag - Starter',sku:'STARTER-001',price:25000,stock:10,image:'👜',imageUrl:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',desc:'Add your own with image'},
        {id:`${Date.now()}-2`,shopId:s,name:'Sample Product',sku:'SAMPLE-002',price:15000,stock:5,image:'👝',imageUrl:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',desc:'Edit or add new'}
      ]
      localStorage.setItem(kf(s,'products'), JSON.stringify(defaults))
      return defaults
    }
    return JSON.parse(r)
  }catch{return[]}
}
export const saveProducts=(s:string,p:Product[])=>{if(typeof window==='undefined'||!s)return;localStorage.setItem(kf(s,'products'),JSON.stringify(p))}
export const getOrders=(s:string|undefined):Order[]=>{if(typeof window==='undefined'||!s)return[];try{const r=localStorage.getItem(kf(s,'orders'));return r?JSON.parse(r):[]}catch{return[]}}
export const getAllOrders=():Order[]=>{if(typeof window==='undefined')return[];try{const shops=getShops();let a:Order[]=[];shops.forEach(s=>{a=[...a,...getOrders(s.slug)];});return a;}catch{return[]}}
export const saveOrders=(s:string,o:Order[])=>{if(typeof window==='undefined'||!s)return;localStorage.setItem(kf(s,'orders'),JSON.stringify(o))}
export const updateOrderStatus=(s:string,id:string,u:Partial<Order>)=>{const o=getOrders(s);saveOrders(s,o.map(x=>x.id===id?{...x,...u}:x));}
export const saveShop=(s:string,u:Partial<Shop>)=>{const shops=getShops();saveShops(shops.map(x=>x.slug===s?{...x,...u}:x));}