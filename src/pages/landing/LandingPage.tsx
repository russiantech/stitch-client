// src/pages/landing/LandingPage.tsx
// Stitch Labs — Promotional Landing Page
// Built for Miva Innovators | OPay National Innovation Challenge 2026

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StitchMark from '@/components/shared/StitchMark.tsx';
import { usePWAInstall } from '@/hooks/usePWAInstall.ts';
import '@/styles/LandingPage.css';

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
// const StitchMark = ({ className = '' }: { className?: string }) => (
//   <div className={`stitch-mark ${className}`}>
//     <img src="/images/logos/stitch-logo-primary.webp" alt="Stitch" className="stitch-logo-img" />
//   </div>
// );

/* export const StitchMark = ({ 
  className = '', 
  src = '/images/logos/stitch-logo-primary.webp' 
}: { 
  className?: string; 
  src?: string 
}) => (
  <div className={`stitch-mark ${className}`}>
    <img src={src} alt="Stitch" className="stitch-logo-img" />
  </div>
);
 */

const Check = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const IconShield = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z" stroke="#5826EE" strokeWidth="1.6"/><path d="M8.5 12.2l2.4 2.4 4.6-5" stroke="#5826EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTag = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5S9.2 9 12 9s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" stroke="#F38207" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" stroke="#F38207" strokeWidth="1.8"/></svg>;
const IconBook = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#F38207" strokeWidth="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#F38207" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconRuler = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8" stroke="#F38207" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 21h18" stroke="#F38207" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconScan = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconScale = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5S9.2 9 12 9s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconCard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8"/><path d="M2 10h20" stroke="white" strokeWidth="1.8"/></svg>;
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const IconChev = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform .2s ease' }}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ─── UI Mockup Components ──────────────────────────────────────────────── */
const MockDashboard = () => (
  <div className="ui-mock dashboard-mock">
    <div className="ui-mock-header">
      <div className="ui-mock-dots"><span/><span/><span/></div>
      <div className="ui-mock-title">Operations Dashboard</div>
    </div>
    <div className="ui-mock-body">
      <div className="ui-mock-kpi-row">
        {[
          { label: 'Revenue', val: '₦1.2M', up: true },
          { label: 'Active', val: '48', up: true },
          { label: 'Pending', val: '12', up: false },
        ].map(k => (
          <div key={k.label} className="ui-mock-kpi">
            <div className="ui-mock-kpi-label">{k.label}</div>
            <div className="ui-mock-kpi-val">{k.val}</div>
            <div className={`ui-mock-kpi-change ${k.up ? 'up' : 'down'}`}>{k.up ? '↑' : '↓'} 12%</div>
          </div>
        ))}
      </div>
      <div className="ui-mock-table">
        <div className="ui-mock-row head"><span>Order</span><span>Customer</span><span>Status</span></div>
        {[
          { ref: '#STC-2601', cust: 'Adaeze O.', st: 'In Progress', stc: 'warn' },
          { ref: '#STC-2602', cust: 'Mr. Fodio', st: 'Ready', stc: 'success' },
          { ref: '#STC-2603', cust: 'Chioma B.', st: 'Received', stc: 'info' },
        ].map(r => (
          <div key={r.ref} className="ui-mock-row"><span>{r.ref}</span><span>{r.cust}</span><span className={`pill ${r.stc}`}>{r.st}</span></div>
        ))}
      </div>
    </div>
  </div>
);

const MockAnalytics = () => (
  <div className="ui-mock analytics-mock">
    <div className="ui-mock-header">
      <div className="ui-mock-dots"><span/><span/><span/></div>
      <div className="ui-mock-title">Revenue Analytics</div>
    </div>
    <div className="ui-mock-body">
      <div className="ui-mock-chart-header">
        <div>
          <div className="ui-mock-chart-val">₦847,500</div>
          <div className="ui-mock-chart-label">This month</div>
        </div>
        <div className="ui-mock-chart-badge">+24%</div>
      </div>
      <div className="ui-mock-bars">
        {[45, 62, 38, 75, 55, 88, 70, 92, 60, 78, 85, 95].map((h, i) => (
          <div key={i} className="ui-mock-bar-wrap">
            <div className="ui-mock-bar" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="ui-mock-chart-footer">
        <span>Jan</span><span>Dec</span>
      </div>
    </div>
  </div>
);

const MockOrderCard = () => (
  <div className="ui-mock order-card-mock">
    <div className="ui-mock-order-header">
      <div>
        <div className="ui-mock-who">Order · Adaeze O.</div>
        <div className="ui-mock-ref">#STC-2603-118 · Bespoke gown</div>
      </div>
      <span className="ui-mock-pill">In progress</span>
    </div>
    {[
      ['Service', 'Custom tailoring'],
      ['Fabric', 'Customer-provided'],
      ['Measurements', 'Agreed & signed'],
      ['Consultation', 'Thu · 2–4 PM'],
    ].map(([k, v]) => (
      <div key={k} className="ui-mock-order-row"><span>{k}</span><span>{v}</span></div>
    ))}
    <div className="ui-mock-order-total"><span>Total due</span><span>₦18,500</span></div>
  </div>
);

const MockMobile = () => (
  <div className="ui-mock mobile-mock">
    <div className="mobile-notch" />
    <div className="mobile-header">
      <div className="mobile-avatar">CJ</div>
      <div className="mobile-greet">Good afternoon,<br/><strong>Chris</strong></div>
    </div>
    <div className="mobile-card">
      <div className="mobile-card-title">Your Subscription</div>
      <div className="mobile-card-bal">₦25,000</div>
      <div className="mobile-card-sub">12 units remaining</div>
      <div className="mobile-progress"><div className="mobile-progress-fill" style={{ width: '60%' }} /></div>
    </div>
    <div className="mobile-actions">
      {['New Order', 'Track', 'Pay'].map(a => (
        <div key={a} className="mobile-action"><div className="mobile-action-icon" /><span>{a}</span></div>
      ))}
    </div>
  </div>
);

const MockCreateOrder = () => (
  <div className="ui-mock create-order-mock">
    <div className="ui-mock-header">
      <div className="ui-mock-dots"><span/><span/><span/></div>
      <div className="ui-mock-title">New Laundry Order</div>
    </div>
    <div className="ui-mock-body">
      <div className="ui-mock-form-row">
        <div className="ui-mock-form-label">Customer</div>
        <div className="ui-mock-form-input">Adaeze O. ▾</div>
      </div>
      <div className="ui-mock-form-row">
        <div className="ui-mock-form-label">Service</div>
        <div className="ui-mock-form-input">Wash & Iron ▾</div>
      </div>
      <div className="ui-mock-form-row">
        <div className="ui-mock-form-label">Items</div>
        <div className="ui-mock-form-tags">
          <span>Shirt ×3</span><span>Trousers ×2</span><span>+</span>
        </div>
      </div>
      <div className="ui-mock-form-total">
        <span>Total</span><span>₦4,500</span>
      </div>
      <div className="ui-mock-form-btn">Create Order</div>
    </div>
  </div>
);

/* ─── Data ────────────────────────────────────────────────────────────── */
const TEAM = [
  { initials: 'CJ', name: 'Chris James', role: 'Team Lead & Full-Stack' },
  { initials: 'DO', name: 'Damilola Olarewaju', role: 'Data & AI Lead' },
  { initials: 'FH', name: 'Fatimah Hamzah', role: 'UI/UX & Brand' },
  { initials: 'EO', name: 'Elias Olawale', role: 'Business & Research' },
  { initials: 'MO', name: 'Michelle Oluyemi', role: 'Content & Comms' },
];

const FAQS = [
  { q: 'Is Stitch really free to use?', a: 'Yes. The core platform — orders, tracking, measurements, records — costs nothing. We only earn a small fee when a payment moves through Stitch.' },
  { q: 'Do I need a smartphone or fast internet?', a: "Stitch is built mobile-first and works on an average Android phone. Slower connections are supported — it's designed for the counter, not a fibre office." },
  { q: 'How do customer subscriptions work?', a: 'Customers prepay for a monthly plan of "units" — for example, a set number of garments — and each order simply deducts from their balance, visible to both sides.' },
  { q: 'Which payment methods are supported?', a: 'Card, bank transfer, Paystack and OPay, with more rails on the way as we expand delivery and marketplace features.' },
  { q: 'Is my business and customer data secure?', a: "Yes — data is encrypted in transit and at rest, and every business's records are kept fully separate from every other business on Stitch." },
  { q: 'Can I switch from my current notebook or spreadsheet?', a: 'Yes — our team can help you move existing customers and pricing into Stitch, so nothing is lost in the switch.' },
];

/* ─── Hooks ─────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('revealed');
        obs.unobserve(el);
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── PWA Install Button ───────────────────────────────────────────────── */
function InstallButton({ variant = 'primary' }: { variant?: 'primary' | 'ghost' | 'light' }) {
  const { canInstall, isIosDevice, hasNativePrompt, promptInstall, installed } = usePWAInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (installed || !canInstall) return null;

  const handleClick = async () => {
    if (isIosDevice && !hasNativePrompt) {
      setShowIosModal(true);
      return;
    }
    await promptInstall();
  };

  const btnClass = variant === 'primary' ? 'btn btn-primary' : variant === 'light' ? 'btn btn-light' : 'btn btn-ghost';

  return (
    <>
      <button className={`${btnClass} install-btn`} onClick={handleClick}>
        <IconDownload /> Install app
      </button>
      {showIosModal && (
        <div className="ios-modal" onClick={() => setShowIosModal(false)}>
          <div className="ios-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ios-modal-header">
              <h6>Install on iPhone/iPad</h6>
              <button className="ios-modal-close" onClick={() => setShowIosModal(false)}>×</button>
            </div>
            <div className="ios-modal-body">
              <ol>
                <li>Tap the <strong>Share</strong> button <span className="ios-share-icon">⎋</span> in Safari's toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
            <button className="btn btn-primary btn-sm w-100" onClick={() => setShowIosModal(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Product', href: '#product', n: '01' },
  { label: 'For you', href: '#how', n: '02' },
  { label: 'Pricing', href: '#model', n: '03' },
  { label: 'Investors', href: '#market', n: '04' },
  { label: 'FAQ', href: '#faq', n: '05' },
];

const Nav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-curtain-open', open);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const goTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), open ? 380 : 0);
  };

  return (
    <header className={`stitch-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <StitchMark />
        </a>
        <nav className="nav-links">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={goTo(l.href)}>{l.label}</a>
          ))}
        </nav>
        <div className="nav-cta">
          <Link to="/signin" className="btn btn-ghost btn-sm">Book a walkthrough</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get started free</Link>
        </div>
        <button
          className={`bento-toggle ${open ? 'open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span className="bento-grid">
            {Array.from({ length: 9 }).map((_, i) => <span key={i} className="bento-dot" />)}
          </span>
          <span className="bento-close">
            <span className="bl bl1" />
            <span className="bl bl2" />
          </span>
        </button>
      </div>

      <div className={`nav-curtain ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="nav-curtain-inner">
          <nav className="curtain-links">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={goTo(l.href)}>
                {l.label} <span className="n">{l.n}</span>
              </a>
            ))}
          </nav>
          <div className="curtain-cta">
            <Link to="/signup" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Get started free</Link>
            <Link to="/signin" className="btn btn-ghost cta-ghost btn-block" onClick={() => setOpen(false)}>Book a walkthrough</Link>
          </div>
        </div>
        <div className="curtain-foot">
          <span>Stitch Labs</span>
          <span>stitch@stitch.salesnet.ng</span>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const ref = useScrollReveal();
  const { canInstall, installed } = usePWAInstall();
  const showInstall = canInstall && !installed;

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="wrap hero-grid">
        <div className="hero-text">
          <span className="eyebrow"><span className="dot" />Built for laundry & fashion businesses in Nigeria</span>
          <h1>Run your shop like clockwork — <em>even</em> if it started in a notebook.</h1>
          <p className="lead">Stitch replaces scattered notebooks and WhatsApp chats with one simple system: digital orders, fixed pricing, prepaid subscriptions and instant payments — built for the way drycleaners and tailors actually work.</p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">Get started — it's free</Link>
            <a href="#how" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' }); }}>See how it works</a>
            {showInstall && <InstallButton variant="ghost" />}
          </div>
          <div className="trust-line"><IconShield /> Piloted with real laundry & fashion businesses in Lagos since 2024</div>
        </div>
        <div className="hero-visual">
          <MockOrderCard />
          <div className="float-card float-1">
            <div className="fc-dot">₦</div>
            <div>Paid via<br/><strong>Paystack</strong></div>
          </div>
          <div className="float-card float-2">
            <div className="fc-check"><Check size={12} /></div>
            <div>Customer notified —<br/>no phone call needed</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StitchRule = () => <div className="wrap"><div className="stitch-rule" /></div>;

const Pains = () => {
  const ref = useScrollReveal();
  return (
    <section className="pains" id="product" ref={ref}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">The problem</span>
          <h2>The counter runs on memory. It shouldn't have to.</h2>
          <p>These are the everyday frictions we watched play out at a real Lagos laundry & fashion business — the reason Stitch exists.</p>
        </div>
        <div className="pain-grid">
          {[
            { icon: <IconTag />, title: 'Pricing that shifts by the day', desc: 'The same shirt costs ₦500 on Monday and ₦700 on Friday — no system, just memory, and a disputed price at pickup.' },
            { icon: <IconPhone />, title: '"Is my order ready?" — 5x a day', desc: 'Without status updates, customers call again and again, pulling staff away from the actual work.' },
            { icon: <IconBook />, title: 'Records that walk away', desc: 'A lost notebook means lost orders, lost history, and revenue that quietly leaks through the cracks.' },
            { icon: <IconRuler />, title: 'Measurement arguments', desc: 'A tailor cuts fabric to spec — then hears "it\'s too tight," with no agreed record to settle it.' },
          ].map(p => (
            <div key={p.title} className="pain-card">
              <div className="pi">{p.icon}</div>
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SolutionBand = () => {
  const ref = useScrollReveal();
  return (
    <section className="band" id="how" ref={ref}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">The fix</span>
          <h2 className="text-white">Leave the notebook behind.</h2>
          <p>One system for orders, pricing and payments — simple enough for a counter that's never used software before.</p>
        </div>
        <div className="band-grid">
          {[
            { icon: <IconScan />, title: 'Track every order, start to finish', desc: 'Every garment gets a digital ticket — intake, wash, press, delivery — so nothing goes missing and no order is forgotten.' },
            { icon: <IconScale />, title: 'Price it right, every time', desc: 'Fixed pricing by garment, service and delivery zone. No haggling, no disputes, no guessing at pickup.' },
            { icon: <IconCard />, title: 'Get paid before you deliver', desc: 'Customers prepay into monthly units or pay instantly via Paystack — steady cash flow instead of chasing payment.' },
          ].map(b => (
            <div key={b.title} className="band-card">
              <div className="bi">{b.icon}</div>
              <h4>{b.title}</h4>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── UI Showcase (embedded screens) ─────────────────────────────────── */
const UIShowcase = () => {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();
  return (
    <section className="ui-showcase">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">Inside the platform</span>
          <h2>Built for the counter. Designed to convert.</h2>
          <p>Every screen is designed for business owners who have never used management software — and customers who expect Uber-level convenience.</p>
        </div>

        <div className="showcase-row" ref={ref1}>
          <div className="showcase-text">
            <h3>Your operations, crystal clear</h3>
            <p>See every order, every garment, and every naira in one place. From intake to delivery, nothing slips through.</p>
            <ul className="showcase-list">
              <li><Check size={16} /> Real-time order tracking by status</li>
              <li><Check size={16} /> Revenue analytics with period comparison</li>
              <li><Check size={16} /> Staff task queues and driver dispatch</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <MockDashboard />
          </div>
        </div>

        <div className="showcase-row reverse" ref={ref2}>
          <div className="showcase-visual">
            <MockOrderCard />
            <div className="showcase-float-badge">
              <div className="sfb-icon">✓</div>
              <div><strong>Digital agreement</strong><br/><small>No more measurement disputes</small></div>
            </div>
          </div>
          <div className="showcase-text">
            <h3>Orders that track themselves</h3>
            <p>Customers see exactly what they ordered, how much it costs, and when it will be ready — before they even ask.</p>
            <ul className="showcase-list">
              <li><Check size={16} /> Itemized digital receipts</li>
              <li><Check size={16} /> Agreed measurements, signed off</li>
              <li><Check size={16} /> Automatic status notifications</li>
            </ul>
          </div>
        </div>

        <div className="showcase-row" ref={ref3}>
          <div className="showcase-text">
            <h3>Create orders in seconds</h3>
            <p>No typing the same thing twice. Select the customer, pick the service, add items — Stitch calculates the total automatically.</p>
            <ul className="showcase-list">
              <li><Check size={16} /> Auto-calculated pricing by garment type</li>
              <li><Check size={16} /> One-tap customer selection</li>
              <li><Check size={16} /> Instant digital receipt generation</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <MockCreateOrder />
          </div>
        </div>

        <div className="showcase-row reverse" ref={ref4}>
          <div className="showcase-visual mobile-wrap">
            <MockMobile />
            <div className="showcase-float-badge mobile-badge">
              <div className="sfb-icon">₦</div>
              <div><strong>Instant payment</strong><br/><small>Paystack & OPay ready</small></div>
            </div>
          </div>
          <div className="showcase-text">
            <h3>Payments built for Nigeria</h3>
            <p>Accept Paystack, OPay, bank transfer, or card. Customers can subscribe to monthly plans and watch their balance update in real time.</p>
            <ul className="showcase-list">
              <li><Check size={16} /> Instant settlement to your account</li>
              <li><Check size={16} /> Prepaid subscription units</li>
              <li><Check size={16} /> Automatic invoicing & receipts</li>
            </ul>
          </div>
        </div>

        <div className="showcase-row analytics-row" ref={useScrollReveal()}>
          <div className="showcase-text">
            <h3>Know your numbers</h3>
            <p>Track revenue trends, spot your best customers, and see which services drive profit — no spreadsheet required.</p>
            <ul className="showcase-list">
              <li><Check size={16} /> Monthly revenue trends</li>
              <li><Check size={16} /> Customer lifetime value</li>
              <li><Check size={16} /> Service-level profit breakdown</li>
            </ul>
          </div>
          <div className="showcase-visual">
            <MockAnalytics />
          </div>
        </div>
      </div>
    </section>
  );
};

const Audiences = () => {
  const ref = useScrollReveal();
  return (
    <section className="audiences" ref={ref}>
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">Built for both sides of the counter</span>
          <h2>What changes for you</h2>
        </div>
        <div className="aud-grid">
          <div className="aud-card owner">
            <span className="aud-tag">For business owners</span>
            <h3>Run the whole shop from your phone</h3>
            <ul className="aud-list">
              {[
                'Digital order & garment tracking, from intake to delivery',
                'Pricing that auto-calculates by garment, service & zone',
                'Subscription plans customers prepay into monthly',
                'Staff & driver task queues, so nothing sits idle',
                'A customer history that turns first-timers into regulars',
              ].map(t => <li key={t}><Check size={17} />{t}</li>)}
            </ul>
          </div>
          <div className="aud-card">
            <span className="aud-tag">For customers</span>
            <h3>Order, track and pay — no phone calls</h3>
            <ul className="aud-list">
              {[
                'Schedule a pickup straight from your phone',
                'Track every order in real time — no guessing, no calling',
                'Subscribe to a monthly plan and see exactly how it\'s used',
                'Agree measurements digitally, before a single cut is made',
                'Pay securely by card, transfer, Paystack or OPay',
              ].map(t => <li key={t}><Check size={17} />{t}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const ref = useScrollReveal();
  return (
    <section className="model" id="model" ref={ref}>
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">Pricing</span>
          <h2>Free to run your shop. You only pay when you earn.</h2>
          <p>No monthly subscription fee to try Stitch. We make money the same way you do — when a transaction actually happens.</p>
        </div>
        <div className="model-grid">
          <div className="model-card hi">
            <span className="model-tag">Most businesses start here</span>
            <h4>Core platform</h4>
            <div className="model-price">₦0<small>Forever, no card required</small></div>
            <p className="desc">Everything you need to run daily operations, on the house.</p>
            <ul className="model-list">
              {['Orders & garment tracking', 'Digital measurements', 'Customer records & staff accounts', 'Notifications & digital receipts'].map(i => <li key={i}>✓ {i}</li>)}
            </ul>
          </div>
          <div className="model-card">
            <h4>Payments & subscriptions</h4>
            <div className="model-price">Small %<small>Only on money collected</small></div>
            <p className="desc">A small, transparent fee only when a customer pays through Stitch — never a flat charge for using the software.</p>
            <ul className="model-list">
              {['Paystack & OPay checkout', 'Prepaid customer subscriptions', 'Automatic invoicing & receipts'].map(i => <li key={i}>✓ {i}</li>)}
            </ul>
          </div>
          <div className="model-card">
            <h4>Growth services</h4>
            <div className="model-price">Pay as you go<small>Only when you use them</small></div>
            <p className="desc">Optional add-ons for businesses ready to scale — priced per use, never bundled into a subscription.</p>
            <ul className="model-list">
              {['Delivery & rider dispatch', 'Supplier marketplace', 'AI product photos & captions'].map(i => <li key={i}>✓ {i}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const Market = () => {
  const ref = useScrollReveal();
  return (
    <section className="market" id="market" ref={ref}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">For investors & partners</span>
          <h2>Nigeria's informal economy, at a glance</h2>
          <p>Laundry and fashion is our first wedge into a much larger, still-undigitized market.</p>
        </div>
        <div className="market-grid">
          {[
            { num: '₦3.2T', lbl: 'Estimated laundry & fashion services market size' },
            { num: '53–65%', lbl: "Share of Nigeria's GDP from the informal sector" },
            { num: '40M', lbl: 'Informal enterprises nationwide' },
            { num: '65%+', lbl: 'Smartphone penetration in urban Nigeria' },
          ].map(s => (
            <div key={s.lbl} className="stat">
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
        <p className="market-source">Sources: Euromonitor International (2025), SECO Economic Report (2025), Moniepoint/Forbes Africa (2024), World Bank. Figures are market estimates, not Stitch's own revenue or user numbers.</p>
      </div>
    </section>
  );
};

const Team = () => {
  const ref = useScrollReveal();
  return (
    <section className="team" id="team" ref={ref}>
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">The team</span>
          <h2>Built by Miva Innovators</h2>
          <p>Stitch began with a real business, not a classroom brief — and the team that built it lived the problem before writing a line of code.</p>
        </div>
        <div className="team-grid">
          {TEAM.map(m => (
            <div key={m.initials} className="team-card">
              <div className="team-avatar">{m.initials}</div>
              <h4>{m.name}</h4>
              <div className="role">{m.role}</div>
            </div>
          ))}
        </div>
        <p className="team-foot"><strong>Miva Innovators</strong> — AI & Computer Science students at Miva Open University, building Stitch for the OPay National Innovation Challenge 2026.</p>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useScrollReveal();
  return (
    <section className="faq" id="faq" ref={ref}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">Questions</span>
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq-grid">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`}>
              <div className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                {f.q} <span className="chev"><IconChev open={openIdx === i} /></span>
              </div>
              <div className="faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  const { canInstall, installed } = usePWAInstall();
  const showInstall = canInstall && !installed;

  return (
    <section className="final-cta" id="final">
      <div className="wrap">
        <div className="cta-panel">
          <div className="cta-inner">
            <div className="cta-text">
              <h2>Ready to leave the notebook behind?</h2>
              <p>Set up your shop on Stitch in minutes — free to start, and built for exactly how your counter already works.</p>
            </div>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-light">Get started free</Link>
              <a href="mailto:hi@stitch.ng" className="btn btn-ghost cta-ghost">Talk to the team</a>
              {showInstall && <InstallButton variant="light" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer>
    <div className="wrap">
      <div className="foot-grid">
        <div className="foot-brand">
          <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <StitchMark src="/images/logos/stitch-logo-white.webp" className="mark111" /> 
          </a>
          <p>Digitizing Nigeria's informal laundry & fashion economy — one order, one measurement, one payment at a time. A product of Miva Innovators.</p>
        </div>
        <div className="foot-col">
          <h5>Product</h5>
          <ul>
            <li><a href="#product" onClick={(e) => { e.preventDefault(); document.querySelector('#product')?.scrollIntoView({ behavior: 'smooth' }); }}>Why Stitch</a></li>
            <li><a href="#how" onClick={(e) => { e.preventDefault(); document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' }); }}>How it works</a></li>
            <li><a href="#model" onClick={(e) => { e.preventDefault(); document.querySelector('#model')?.scrollIntoView({ behavior: 'smooth' }); }}>Pricing</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h5>Company</h5>
          <ul>
            <li><a href="#market" onClick={(e) => { e.preventDefault(); document.querySelector('#market')?.scrollIntoView({ behavior: 'smooth' }); }}>For investors</a></li>
            <li><a href="#team" onClick={(e) => { e.preventDefault(); document.querySelector('#team')?.scrollIntoView({ behavior: 'smooth' }); }}>Our team</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h5>Get in touch</h5>
          <ul>
            <li><a href="mailto:hi@stitch.ng">hi@stitch.ng</a></li>
            <li><a href="tel:+2347026561327">+234 702 656 1327</a></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© 2026 Stitch · A product of Miva Innovators, Miva Open University.</span>
        <div className="socials">
          <a href="#" aria-label="Twitter"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.2 4.2 0 0 0-7.1 3.8A11.9 11.9 0 0 1 3.1 4.6a4.2 4.2 0 0 0 1.3 5.6c-.7 0-1.3-.2-1.9-.5v.1a4.2 4.2 0 0 0 3.3 4.1c-.6.2-1.2.2-1.9.1a4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.6a11.9 11.9 0 0 0 6.4 1.9c7.7 0 11.9-6.4 11.9-11.9v-.5c.8-.6 1.5-1.3 2-2.2Z" fill="#c7c3de"/></svg></a>
          <a href="#" aria-label="Instagram"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#c7c3de" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="#c7c3de" strokeWidth="1.6"/><circle cx="17.2" cy="6.8" r="1" fill="#c7c3de"/></svg></a>
          <a href="#" aria-label="WhatsApp"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" stroke="#c7c3de" strokeWidth="1.6"/><path d="M8.5 8.8c.2 3.6 2.9 6.3 6.5 6.5.9 0 1.6-.7 1.5-1.5l-1.9-.9-1 1a6 6 0 0 1-2.9-2.9l1-1-.9-1.9c0-.9-.6-1.5-1.5-1.5-.5 0-.9.5-.8 1.2Z" fill="#c7c3de"/></svg></a>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="stitch-landing">
      <Nav />
      <main>
        <Hero />
        <StitchRule />
        <Pains />
        <SolutionBand />
        <UIShowcase />
        <StitchRule />
        <Audiences />
        <Pricing />
        <Market />
        <Team />
        <StitchRule />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}