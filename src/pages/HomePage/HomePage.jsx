import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Scroll-Reveal Hook ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Reveal Wrapper ─── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useReveal();
  const hiddenMap = {
    up: 'opacity-0 translate-y-10',
    left: 'opacity-0 -translate-x-10',
    right: 'opacity-0 translate-x-10',
    fade: 'opacity-0',
  };
  const hidden = hiddenMap[direction] || hiddenMap.up;
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : hidden
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CheckCircle({ color = 'text-blue-500' }) {
  return (
    <svg className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const HomePage = () => {
  const [faqOpen, setFaqOpen] = useState(null);
  const navigate = useNavigate();
  const toggleFaq = (i) => setFaqOpen(faqOpen === i ? null : i);

  const faqs = [
    { question: 'How does Lerno work for students?', answer: 'Lerno provides an intuitive interface where students can access courses, submit assignments, track their grades, and communicate with instructors in real-time.' },
    { question: 'Can I become an educator and sell my own courses?', answer: 'Yes! Faculty members can create auto-graded MCQ quizzes, upload lectures, track student progress, and receive detailed analytics on engagement and outcomes.' },
    { question: 'What payment methods are supported?', answer: 'We support credit/debit cards, net banking, UPI, and institutional payment methods for universities.' },
    { question: 'Do I get a certificate after finishing a course?', answer: 'Yes — upon completing a course, students receive a verified digital certificate that can be shared on LinkedIn and other professional platforms.' },
    { question: 'Can I watch courses offline?', answer: 'Students can download course content for offline access on mobile devices, ensuring uninterrupted learning even without an internet connection.' },
    { question: 'Is there a refund policy?', answer: 'We offer a 30-day money-back guarantee for all courses purchased through the platform, no questions asked.' },
  ];

  const courseCards = [
    { src: '/ou_campus.png', title: 'Hardware Acceleration for machine...', meta: 'Prof. P Chandra Sekhar · 26 lessons' },
    { src: '/student_learning.png', title: 'Geographic information system', meta: 'Prof. M Gopal Naik · 25 lessons' },
    { src: '/vice_chancellor.png', title: 'Subsidence due to underground mining', meta: 'Dr. K V Shanker · 28 lessons' },
    { src: '/principal.png', title: 'Surface hardening process', meta: 'Dr. T Nagaveni · 38 lessons' },
  ];

  return (
    <div className="bg-white text-gray-900">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Lerno</span>
          </div>

          <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full px-1.5 py-1 gap-0.5">
            <a href="#" className="px-4 py-1.5 rounded-full bg-white text-gray-900 text-sm font-medium shadow-sm border border-gray-200">Home</a>
            <a href="#" className="px-4 py-1.5 rounded-full text-gray-500 text-sm hover:text-gray-800 transition-colors">Courses</a>
            <a href="#" className="px-4 py-1.5 rounded-full text-gray-500 text-sm hover:text-gray-800 transition-colors">Dashboard</a>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty/login')} className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
            <button onClick={() => navigate('/faculty/signup')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pt-[60px] bg-white">
        <div className="max-w-screen-xl mx-auto px-8 py-20 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 max-w-[580px]">
            <Reveal direction="up">
              <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-1.5 mb-7 shadow-sm">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>

              </div>

              <h1 className="text-5xl lg:text-[64px] font-black text-gray-900 leading-[1.08] tracking-tight mb-5">
                The Digital Hub<br />
                <span className="text-blue-600">of Learning</span>
              </h1>

              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-[460px]">
                Your official gateway to the Osmania University ecosystem. Access
                premium digital resources, track your academic progress, and
                master your engineering curriculum—anytime, anywhere.
              </p>

              <div className="flex items-center gap-3 mb-14">
                <button onClick={() => navigate('/faculty/signup')} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-200">
                  Browse courses
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => navigate('/faculty/login')} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Learn More
                </button>
              </div>

              <div className="flex items-center">
                <div className="pr-10">
                  <p className="text-3xl font-black text-gray-900">120,000+</p>
                  <p className="text-sm text-gray-400 mt-1">Enrolled Learners</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="pl-10">
                  <p className="text-3xl font-black text-gray-900">24/7</p>
                  <p className="text-sm text-gray-400 mt-1">Digital Access</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal direction="right" delay={150} className="flex-1 w-full max-w-[700px]">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200">
                <img src="/ou_campus.png" alt="Osmania University Campus" className="w-full h-[430px] object-cover" />
              </div>
              <div className="absolute -bottom-6 left-8 bg-white rounded-2xl shadow-xl shadow-gray-200 px-5 py-3.5 flex items-center gap-3 border border-gray-100">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official Portal</p>
                  <p className="text-sm font-bold text-gray-900">Osmania University</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FEATURED PROGRAM ══════════ */}
      <section className="bg-gray-50 py-20 px-8 mt-10">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal direction="fade">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-600">Government of Telangana Initiative</span>
            </div>
          </Reveal>
          <Reveal direction="up" delay={80}>
            <h2 className="text-4xl font-black text-gray-900 mb-5 leading-tight">
              Prajapala Palana Pragati Pranalika:<br />
              <span className="text-blue-600">The 99-Day Action Plan</span>
            </h2>
          </Reveal>
          <Reveal direction="up" delay={160}>
            <p className="text-gray-500 text-base leading-relaxed">
              Guided by a visionary mandate for the Digitization of Student Services, Osmania University is proud to
              lead the implementation of this Learning Management System. We are committed to ensuring no student
              is left behind, providing 24/7 access to revisit, reinforce, and master coursework at their own pace.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════ LEARN ANYWHERE ══════════ */}
      <section className="bg-white py-24 px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <Reveal direction="up" className="lg:w-[400px] flex-shrink-0">
              <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-4">FOR STUDENTS</p>
              <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4">Learn anywhere. Grow forever.</h2>
              <p className="text-gray-500 text-base mb-8">Unlock the entire library or explore individual courses. You decide how to learn.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 mb-10">
                {[
                  'Unlimited access to 9,000+ premium courses',
                  'Learn from industry-leading instructors',
                  'Earn verified certificates of completion',
                  'Watch on any device, learn at your own pace',
                  'Hands-on assignments and real projects',
                  'Active community and mentorship',
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle color="text-blue-500" />
                    <span className="text-sm text-gray-600 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/faculty/signup')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-200">
                Know More
              </button>
            </Reveal>

            <div className="flex-1 grid grid-cols-2 gap-4">
              {courseCards.map((card, i) => (
                <Reveal key={i} direction="up" delay={i * 80}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="h-40 overflow-hidden bg-gray-100">
                      <img src={card.src} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">{card.title}</p>
                      <p className="text-xs text-gray-400">{card.meta}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ACADEMIC EXCELLENCE ══════════ */}
      <section className="bg-white py-24 px-8">
        <div className="max-w-screen-xl mx-auto">
          <Reveal direction="fade" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">WHY TEAMS CHOOSE LERNO</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900">
              A Commitment to <span className="text-blue-600">Academic Excellence</span>
            </h2>
          </Reveal>

          {/* Vice Chancellor */}
          <div className="flex flex-col lg:flex-row items-center gap-14 mb-24">
            <Reveal direction="left" delay={80} className="lg:w-[55%]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-100/50">
                <img src="/vice_chancellor.png" alt="Vice-Chancellor" className="w-full h-[420px] object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-700">+38% completion</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Message from the Vice-Chancellor</span>
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={160} className="lg:w-[45%]">
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">TRENDING NOW</p>
              <h3 className="text-3xl font-black text-gray-900 leading-tight mb-5">Message from the Vice-Chancellor</h3>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                At Osmania University, we believe that innovation is the cornerstone of
                progress. This Learning Management System represents our commitment
                to the Government of Telangana's vision for a digitally empowered student body.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-blue-500', 'bg-blue-700'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">Loved by <strong className="text-gray-800">2,400+ creators</strong> using this feature this month</p>
              </div>
            </Reveal>
          </div>

          {/* Principal */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-14">
            <Reveal direction="right" delay={80} className="lg:w-[55%]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/60">
                <img src="/principal.png" alt="Principal" className="w-full h-[420px] object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Message from the Principal</span>
                  <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </Reveal>
            <Reveal direction="left" delay={160} className="lg:w-[45%]">
              <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">MARKETING TOOLS</p>
              <h3 className="text-3xl font-black text-gray-900 leading-tight mb-5">Message from the Principal</h3>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Education today requires more than just textbooks. It requires an
                ecosystem that supports continuous growth. Our digital portal is designed
                specifically for the modern engineer, offering 24/7 access to resources
                that bridge the gap between theory and industry application.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-blue-500', 'bg-blue-700'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">Loved by <strong className="text-gray-800">2,400+ creators</strong> using this feature this month</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ BUILT FOR EDUCATORS & STUDENTS ══════════ */}
      <section className="bg-white py-24 px-8">
        <div className="max-w-screen-xl mx-auto">
          <Reveal direction="up" className="text-center mb-14">
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">ONE PLATFORM · TWO WORLDS</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Built for educators <span className="text-gray-400">&amp;</span> students
            </h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              A dedicated workspace for teachers to publish content, and a focused learning experience for students.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Educator Card */}
            <Reveal direction="left" delay={80}>
              <div className="relative rounded-3xl overflow-hidden min-h-[520px] flex flex-col justify-end group cursor-pointer">
                <div className="absolute inset-0">
                  <img src="/educator_upload.png" alt="Educator" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/95 via-blue-800/65 to-blue-500/20" />
                </div>
                <div className="absolute top-5 left-5 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">Educator Portal</span>
                </div>
                <div className="relative z-10 p-8">
                  <h3 className="text-3xl font-black text-white mb-3">Upload &amp; manage</h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-5">A full administrator dashboard to publish lectures, run quizzes, and grow your student base.</p>
                  <ul className="space-y-2.5 mb-7">
                    {['Drag-and-drop video & material uploads', 'Course builder with chapters, lessons & quizzes', 'Revenue, enrollments & engagement analytics'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle color="text-green-400" />
                        <span className="text-white text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/faculty/signup')} className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                    Become an educator
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Student Card */}
            <Reveal direction="right" delay={80}>
              <div className="relative rounded-3xl overflow-hidden min-h-[520px] flex flex-col justify-end group cursor-pointer">
                <div className="absolute inset-0">
                  <img src="/student_laptop.png" alt="Student" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-800/70 to-teal-700/20" />
                </div>
                <div className="absolute top-5 left-5 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                  </svg>
                  <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">Student Portal</span>
                </div>
                <div className="absolute top-5 right-5 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-gray-700">120k+ learning now</span>
                </div>
                <div className="relative z-10 p-8">
                  <h3 className="text-3xl font-black text-white mb-3">Learn at your own pace</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5">Pay for courses, watch lessons on any device, and track progress with a beautiful learning dashboard.</p>
                  <ul className="space-y-2.5 mb-7">
                    {['Access 9,000+ premium courses & materials', 'Resume lessons across web and mobile', 'Earn verified certificates of completion'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle color="text-green-400" />
                        <span className="text-white text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/faculty/signup')} className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                    Start learning
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="bg-gray-50 py-24 px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal direction="up" className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-gray-500 text-base">
              Everything you need to know about Lerno. Can't find the answer here? Reach out to our support team.
            </p>
          </Reveal>

          <Reveal direction="up" delay={100}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-semibold text-gray-800 pr-4">{faq.question}</span>
                    <ChevronDown open={faqOpen === i} />
                  </button>
                  {faqOpen === i && (
                    <div className="px-7 pb-6 bg-white">
                      <p className="text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      

    </div>
  );
};

export default HomePage;