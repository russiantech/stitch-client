// services/mockData.js — Realistic SaaS mock data (v2)

export const MOCK_USER = {
  id: 1, name: 'Adaeze Okonkwo', email: 'adaeze@example.com',
  role: 'admin', username: 'adaeze_ok',
  loyalty_points: 340, referral_code: 'SL-ADAEZE',
  phone: '08012345678', created_at: '2024-11-01T00:00:00Z',
};

export const LAUNDRY_STATUSES = [
  'Received','Sorted','Washing','Drying','Ironing',
  'Folding','Packing','Ready For Delivery','Out For Delivery','Delivered','Completed',
];

export const FASHION_STATUSES = [
  'Consultation','Measurement','Design Approval','Production',
  'Fitting','Adjustments','Ready','Delivery','Completed',
];

export const STATUS_BADGE_MAP = {
  'Received':'badge-received','Sorted':'badge-sorted','Washing':'badge-washing',
  'Drying':'badge-drying','Ironing':'badge-ironing','Folding':'badge-folding',
  'Packing':'badge-packing','Ready For Delivery':'badge-ready',
  'Out For Delivery':'badge-out-for-delivery','Delivered':'badge-delivered',
  'Completed':'badge-completed','Cancelled':'badge-cancelled',
  'Consultation':'badge-consultation','Measurement':'badge-measurement',
  'Design Approval':'badge-design-approval','Production':'badge-production',
  'Fitting':'badge-fitting','Adjustments':'badge-adjustments',
  'Ready':'badge-ready','Delivery':'badge-out-for-delivery',
};

export const MOCK_LAUNDRY_ORDERS = [
  { id:'LD-001',customer:'Chiamaka Eze',phone:'08012345678',items:12,service:'Standard Wash',status:'Washing',priority:'Normal',amount:4500,created_at:'2025-05-24',pickup:'2025-05-24',delivery:'2025-05-26',address:'14B Admiralty Way, Lekki',notes:'Handle delicates with care',payment_method:'subscription' },
  { id:'LD-002',customer:'Emeka Nwosu',phone:'08023456789',items:5,service:'Express Wash',status:'Ironing',priority:'Express',amount:6000,created_at:'2025-05-24',pickup:'2025-05-24',delivery:'2025-05-25',address:'22 VGC Rd, VGC',notes:'',payment_method:'direct' },
  { id:'LD-003',customer:'Bisi Adeyemi',phone:'08034567890',items:8,service:'Dry Cleaning',status:'Ready For Delivery',priority:'Normal',amount:9500,created_at:'2025-05-23',pickup:'2025-05-23',delivery:'2025-05-26',address:'5 Chevron Drive',notes:'Suits only',payment_method:'subscription' },
  { id:'LD-004',customer:'Tunde Bakare',phone:'08045678901',items:20,service:'Standard Wash',status:'Completed',priority:'Normal',amount:7500,created_at:'2025-05-22',pickup:'2025-05-22',delivery:'2025-05-24',address:'3 Graceland Estate',notes:'',payment_method:'direct' },
  { id:'LD-005',customer:'Ngozi Obi',phone:'08056789012',items:3,service:'Ironing Only',status:'Received',priority:'Normal',amount:1500,created_at:'2025-05-25',pickup:'2025-05-25',delivery:'2025-05-27',address:'7 Awoyaya, Ajah',notes:'',payment_method:'subscription' },
];

export const MOCK_FASHION_ORDERS = [
  { id:'FS-001',customer:'Aisha Bello',phone:'08067890123',service:'Custom Tailoring',item:'Aso-Oke Senator',status:'Measurement',priority:'Normal',amount:35000,created_at:'2025-05-20',delivery:'2025-06-10',notes:'Ankara fabric provided by customer',measurements:{chest:42,waist:36,hips:44,shoulder:18} },
  { id:'FS-002',customer:'Kemi Lawal',phone:'08078901234',service:'Alteration',item:'Evening Gown',status:'Fitting',priority:'Express',amount:8000,created_at:'2025-05-22',delivery:'2025-05-28',notes:'Take in at waist by 2 inches',measurements:{} },
  { id:'FS-003',customer:'Folake Adeleke',phone:'08089012345',service:'Bespoke Design',item:'Wedding Guest Outfit',status:'Production',priority:'Normal',amount:55000,created_at:'2025-05-18',delivery:'2025-06-05',notes:'Navy blue Ankara, beaded neckline',measurements:{chest:38,waist:30,hips:40} },
  { id:'FS-004',customer:'Yinka Oyelaran',phone:'08090123456',service:'Repair',item:'Kaftan',status:'Completed',priority:'Normal',amount:3500,created_at:'2025-05-19',delivery:'2025-05-23',notes:'Fix zipper and hem',measurements:{} },
];

export const MOCK_CATEGORIES = [
  { id:1,name:"Women's Wear",description:'Dresses, blouses, skirts for women',products_count:24 },
  { id:2,name:"Men's Wear",description:'Suits, shirts, trousers, traditional attire',products_count:18 },
  { id:3,name:"Children's Wear",description:'Outfits for boys and girls',products_count:15 },
  { id:4,name:'Native Ankara',description:'Traditional Ankara designs',products_count:31 },
  { id:5,name:'Aso-Oke',description:'Premium Aso-Oke for ceremonies',products_count:12 },
];

export const MOCK_PRODUCTS = [
  { id:1,name:'English Jumpsuit',price:45000,stock:5,categories:[{id:1,name:"Women's Wear"}],image_urls:[],description:'Elegant English jumpsuit, available in multiple colors' },
  { id:2,name:'Kaftan Bubu Gown',price:38000,stock:8,categories:[{id:1,name:"Women's Wear"}],image_urls:[],description:'Flowing Kaftan Bubu in premium fabric' },
  { id:3,name:'Ankara Children Gown',price:15000,stock:12,categories:[{id:3,name:"Children's Wear"},{id:4,name:'Native Ankara'}],image_urls:[],description:'Beautiful Ankara gown for girls aged 3–12' },
  { id:4,name:'Senator Suit',price:65000,stock:3,categories:[{id:2,name:"Men's Wear"}],image_urls:[],description:'Classic Nigerian Senator suit for men' },
  { id:5,name:'Aso-Oke Headtie Set',price:28000,stock:20,categories:[{id:5,name:'Aso-Oke'}],image_urls:[],description:'Premium Aso-Oke headtie and wrapper set' },
];

// ─── PLANS (now with units field) ─────────────────────────────────────────────
export const MOCK_PLANS = [
  { id:1,name:'Basic Wash',amount:15000,units:50,description:'50 units of standard laundry per month',popular:false },
  { id:2,name:'Premium Clean',amount:35000,units:150,description:'150 units including dry cleaning and ironing',popular:true },
  { id:3,name:'Enterprise',amount:80000,units:400,description:'400 units with priority service and dedicated driver',popular:false },
];

// ─── USER SUBSCRIPTIONS (a user can have many) ────────────────────────────────
export const MOCK_SUBSCRIPTIONS = [
  {
    id:1,plan_id:2,plan_name:'Premium Clean',units:150,units_used:38,units_remaining:112,
    amount:35000,status:'active',subscribed_at:'2025-05-01',renews_at:'2025-06-01',
    payment_ref:'SL-PAY-001',
  },
  {
    id:2,plan_id:1,plan_name:'Basic Wash',units:50,units_used:12,units_remaining:38,
    amount:15000,status:'active',subscribed_at:'2025-05-10',renews_at:'2025-06-10',
    payment_ref:'SL-PAY-002',
  },
];

// Aggregate totals across all active subscriptions
export const MOCK_USAGE = {
  units_used: 50,
  total_units: 200,
  remaining_units: 150,
  usage_percentage: 25,
  subscriptions: MOCK_SUBSCRIPTIONS,
};

// ─── USAGE LOG ────────────────────────────────────────────────────────────────
export const MOCK_USAGE_LOG = [
  { id:1,user:{username:'chiamaka_eze',name:'Chiamaka Eze'},units_used:12,total_units:150,remaining_units:138,status:'completed',order_id:'LD-001',payment_method:'subscription',created_at:'2025-05-24T10:30:00Z' },
  { id:2,user:{username:'emeka_n',name:'Emeka Nwosu'},units_used:5,total_units:50,remaining_units:45,status:'completed',order_id:'LD-002',payment_method:'direct',created_at:'2025-05-24T11:00:00Z' },
  { id:3,user:{username:'bisi_a',name:'Bisi Adeyemi'},units_used:8,total_units:150,remaining_units:142,status:'completed',order_id:'LD-003',payment_method:'subscription',created_at:'2025-05-23T14:20:00Z' },
  { id:4,user:{username:'chiamaka_eze',name:'Chiamaka Eze'},units_used:20,total_units:150,remaining_units:122,status:'completed',order_id:'LD-004',payment_method:'subscription',created_at:'2025-05-22T09:10:00Z' },
];

// ─── GARMENT PRICING (admin-managed) ─────────────────────────────────────────
export const MOCK_GARMENT_PRICING = [
  { id:1,name:'Shirts',base_price:300,category:'Tops',unit:'per piece',active:true },
  { id:2,name:'Trousers',base_price:350,category:'Bottoms',unit:'per piece',active:true },
  { id:3,name:'Dresses',base_price:500,category:'Full outfits',unit:'per piece',active:true },
  { id:4,name:'Suits (2-piece)',base_price:1200,category:'Full outfits',unit:'per set',active:true },
  { id:5,name:'Blouses',base_price:300,category:'Tops',unit:'per piece',active:true },
  { id:6,name:'Skirts',base_price:300,category:'Bottoms',unit:'per piece',active:true },
  { id:7,name:'Jeans',base_price:400,category:'Bottoms',unit:'per piece',active:true },
  { id:8,name:'Jackets',base_price:600,category:'Outerwear',unit:'per piece',active:true },
  { id:9,name:'Shorts',base_price:250,category:'Bottoms',unit:'per piece',active:true },
  { id:10,name:'Underwear',base_price:150,category:'Innerwear',unit:'per piece',active:true },
  { id:11,name:'Bed Sheets',base_price:800,category:'Household',unit:'per set',active:true },
  { id:12,name:'Towels',base_price:400,category:'Household',unit:'per piece',active:true },
  { id:13,name:'Duvet / Blanket',base_price:2500,category:'Household',unit:'per piece',active:true },
  { id:14,name:'Curtains',base_price:3000,category:'Household',unit:'per set',active:true },
  { id:15,name:'Agbada (3-piece)',base_price:2000,category:'Native Wear',unit:'per set',active:true },
  { id:16,name:'Senator Suit',base_price:1500,category:'Native Wear',unit:'per piece',active:true },
];

// ─── LAUNDRY SERVICES ─────────────────────────────────────────────────────────
export const MOCK_LAUNDRY_SERVICES = [
  { id:1,name:'Standard Wash',description:'Regular washing and folding',price_multiplier:1.0,icon:'fa-soap',active:true },
  { id:2,name:'Dry Cleaning',description:'Professional dry cleaning',price_multiplier:2.5,icon:'fa-vest',active:true },
  { id:3,name:'Ironing Only',description:'Press and iron your garments',price_multiplier:0.7,icon:'fa-temperature-high',active:true },
  { id:4,name:'Express Wash',description:'Same-day service',price_multiplier:1.8,icon:'fa-bolt',active:true },
  { id:5,name:'Wash & Iron',description:'Full wash and press',price_multiplier:1.5,icon:'fa-shirt',active:true },
  { id:6,name:'Stain Removal',description:'Specialist stain treatment',price_multiplier:2.0,icon:'fa-droplet',active:true },
];

// ─── DELIVERY AREAS ───────────────────────────────────────────────────────────
export const MOCK_DELIVERY_AREAS = [
  { id:1,name:'Ajah',price:2000,active:true },
  { id:2,name:'VGC',price:4000,active:true },
  { id:3,name:'Chevron',price:3000,active:true },
  { id:4,name:'Lekki Phase 1',price:4000,active:true },
  { id:5,name:'LBS / Sangotedo',price:10000,active:true },
  { id:6,name:'Awoyaya',price:11000,active:true },
  { id:7,name:'Ado Road',price:2500,active:true },
  { id:8,name:'Badore',price:3000,active:true },
  { id:9,name:'Adesanya',price:2000,active:true },
  { id:10,name:'Graceland Estate',price:2500,active:true },
  { id:11,name:'Scheme 2',price:3000,active:true },
  { id:12,name:'Ogombo',price:3500,active:true },
];

export const MOCK_ANALYTICS = {
  revenue:{ total:1250000,this_month:285000,last_month:210000,growth:35.7 },
  orders:{ total:342,this_month:87,laundry:215,fashion:127,pending:23 },
  customers:{ total:156,new_this_month:18,returning:92,vip:12 },
  deliveries:{ completed:318,pending:24,failed:4,on_time_rate:94.2 },
};

export const MOCK_STAFF = [
  { id:1,name:'Chioma Uzoma',role:'Senior Cleaner',tasks:8,completed_today:5,status:'Active' },
  { id:2,name:'Musa Abdullahi',role:'Ironing Specialist',tasks:12,completed_today:9,status:'Active' },
  { id:3,name:'Segun Adeola',role:'Driver',tasks:6,completed_today:4,status:'On Route' },
  { id:4,name:'Amara Ike',role:'Fashion Tailor',tasks:4,completed_today:2,status:'Active' },
];

export const MOCK_DRIVERS = [
  { id:1,name:'Segun Adeola',phone:'08101234567',vehicle:'Toyota Corolla - ABC 123 EK',pickups:3,deliveries:4,status:'On Route',current_area:'Lekki' },
  { id:2,name:'Biodun Fashola',phone:'08212345678',vehicle:'Honda Civic - XYZ 456 LG',pickups:2,deliveries:5,status:'Available',current_area:'Ajah' },
];

export const MOCK_INVENTORY = [
  { id:1,name:'Ariel Detergent',category:'Detergent',quantity:45,unit:'kg',reorder_level:20,status:'In Stock' },
  { id:2,name:'Fabric Softener',category:'Chemical',quantity:12,unit:'L',reorder_level:15,status:'Low Stock' },
  { id:3,name:'Packaging Bags (S)',category:'Packaging',quantity:500,unit:'pcs',reorder_level:200,status:'In Stock' },
  { id:4,name:'Packaging Bags (L)',category:'Packaging',quantity:180,unit:'pcs',reorder_level:200,status:'Low Stock' },
  { id:5,name:'Starch',category:'Chemical',quantity:8,unit:'kg',reorder_level:10,status:'Low Stock' },
  { id:6,name:'White Ankara Fabric',category:'Fashion Material',quantity:25,unit:'yards',reorder_level:10,status:'In Stock' },
  { id:7,name:'Sewing Thread (Black)',category:'Accessory',quantity:50,unit:'spools',reorder_level:20,status:'In Stock' },
];

export const MOCK_INVOICES = [
  { id:'INV-2025-001',customer:'Chiamaka Eze',order_id:'LD-001',amount:4500,status:'Paid',date:'2025-05-24',paid_at:'2025-05-24',method:'Subscription' },
  { id:'INV-2025-002',customer:'Emeka Nwosu',order_id:'LD-002',amount:6000,status:'Paid',date:'2025-05-24',paid_at:'2025-05-24',method:'Paystack' },
  { id:'INV-2025-003',customer:'Aisha Bello',order_id:'FS-001',amount:35000,status:'Partial',date:'2025-05-20',paid_at:null,method:'Paystack',paid:17500 },
  { id:'INV-2025-004',customer:'Tunde Bakare',order_id:'LD-004',amount:7500,status:'Paid',date:'2025-05-22',paid_at:'2025-05-23',method:'Transfer' },
];

export const MOCK_NOTIFICATIONS = [
  { id:1,title:'Order LD-001 status updated',message:'Your order is now being washed.',type:'order',read:false,created_at:'2025-05-24T10:00:00Z' },
  { id:2,title:'Subscription activated',message:'Your Premium Clean plan is now active. 150 units added.',type:'subscription',read:false,created_at:'2025-05-20T09:00:00Z' },
  { id:3,title:'Payment received',message:'Payment of ₦35,000 confirmed for INV-2025-001.',type:'payment',read:true,created_at:'2025-05-19T15:00:00Z' },
];

export const formatNGN = (amount) =>
  new Intl.NumberFormat('en-NG',{ style:'currency',currency:'NGN',minimumFractionDigits:0 }).format(amount || 0);
