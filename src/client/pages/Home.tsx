import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'owner') {
        navigate('/owner', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fffd]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#073c36] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fffd] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-[#e9f3ef] bg-[#f8fffd]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1220px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-[17px] font-bold tracking-[-0.01em] text-[#0e5147]">Tahfiz</div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-md px-3 py-2 text-[14px] font-semibold text-[#24574f] transition-colors hover:text-[#0f766e]">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-[#073c36] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#052f2b]"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-12 px-4 pb-20 pt-10 sm:px-6 md:gap-16 md:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-[#c6f8df] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f7a65]">
            Modernizing Tradition
          </span>
          <h1 className="mt-5 max-w-[620px] text-balance text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#042f2b] sm:text-[58px] sm:leading-[0.98]">
            Empowering Quran Schools with Digital Precision
          </h1>
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[#4a6a66] sm:text-[18px] sm:leading-[1.45]">
            The all-in-one platform for managing students, tracking memorization progress, and institutional performance.
            Elevate your Hifz program to new standards.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md bg-[#073c36] px-6 py-3 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#052f2b]"
            >
              Get Started Today
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#e7ecea] bg-white p-2 shadow-[0_20px_50px_rgba(7,60,54,0.12)]">
            <img 
              src="/landing/1.png" 
              alt="Tahfiz Dashboard Overview" 
              className="h-auto w-full rounded-xl object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
        </div>
      </main>

      <section className="bg-[#f8fffd] py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#042f2b] sm:text-[46px]">Built for Excellence</h2>
            <div className="mx-auto mt-4 h-[6px] w-[78px] rounded-full bg-[#149d84]" />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
            <article className="group flex flex-col rounded-2xl border border-[#eef4f1] bg-white p-3 shadow-[0_4px_20px_rgba(6,43,37,0.04)] transition-all hover:shadow-[0_12px_40px_rgba(6,43,37,0.08)]">
              <div className="overflow-hidden rounded-xl bg-[#f0f7f5]">
                <img src="/landing/2.png" alt="Multi-Tenant Architecture" className="h-56 w-full object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#c6f8df] text-[20px] text-[#0f8f77]">✣</div>
                <h3 className="text-[24px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#10443d] sm:text-[28px]">Multi-Tenant Architecture</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#5f7771]">
                  Secure, isolated data ecosystem for every institution. Manage multiple branches with scoped privacy and administrative controls.
                </p>
              </div>
            </article>

            <article className="group flex flex-col rounded-2xl border border-[#eef4f1] bg-white p-3 shadow-[0_4px_20px_rgba(6,43,37,0.04)] transition-all hover:shadow-[0_12px_40px_rgba(6,43,37,0.08)]">
              <div className="overflow-hidden rounded-xl bg-[#f0f7f5]">
                <img src="/landing/3.png" alt="Performance Analytics" className="h-56 w-full object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#c6f8df] text-[20px] text-[#0f8f77]">↗</div>
                <h3 className="text-[24px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#10443d] sm:text-[28px]">Performance Analytics</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#5f7771]">
                  Institutional-level reports and deep insights to track efficiency and classroom progress with confidence.
                </p>
              </div>
            </article>

            <article className="group flex flex-col rounded-2xl border border-[#0d5348] bg-[#0a3b35] p-3 text-white shadow-[0_10px_30px_rgba(5,40,35,0.25)] transition-all hover:-translate-y-2">
              <div className="overflow-hidden rounded-xl bg-black/20">
                <img src="/landing/4.png" alt="Student Progress" className="h-56 w-full object-contain opacity-95 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d5348] text-[20px] text-[#a9eadb]">≣</div>
                <h3 className="text-[24px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#ebfff9] sm:text-[28px]">Detailed Progress</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#b9ddd5]">
                  Visual charts for memorization and revision trends to help teachers and students identify strengths and gaps quickly.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#062f2b] sm:text-[46px]">A Seamless Journey</h2>
            <p className="mx-auto mt-3 max-w-[760px] text-[16px] text-[#6b827d]">
              Get your institution running in minutes with our structured onboarding.
            </p>
            <div className="mx-auto mt-4 h-[6px] w-[78px] rounded-full bg-[#149d84]" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { id: '01', title: 'Register School', desc: 'Create your account and provide basic institutional details.' },
              { id: '02', title: 'Enroll Students', desc: 'Onboard students and assign them to teachers and groups.' },
              { id: '03', title: 'Track Progress', desc: 'Start recording daily sessions and revision metrics.' }
            ].map((step, idx) => (
              <article key={idx} className="text-center">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-md border text-[12px] font-bold ${
                  idx === 0 ? 'border-[#e5efeb] bg-white text-[#2d6660]' : 
                  idx === 1 ? 'border-[#d5eee8] bg-[#f2fffb] text-[#0f7a65]' : 
                  'border-[#0d574b] bg-[#073c36] text-white'
                }`}>
                  {step.id}
                </div>
                <h3 className="mt-5 text-[20px] font-extrabold tracking-[-0.01em] text-[#0d3f39] sm:text-[24px]">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-[1.45] text-[#667d78]">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>

          <div className="relative mx-auto mt-20 max-w-[1000px] overflow-hidden rounded-2xl bg-[#073c36] shadow-[0_12px_30px_rgba(7,60,54,0.26)]">
            <div className="absolute inset-0 opacity-10">
              <img src="/landing/5.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="relative px-6 py-12 text-center sm:px-12 sm:py-20">
              <h3 className="text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-[44px]">
                Start your journey towards a more organized school today
              </h3>
              <p className="mx-auto mt-6 max-w-[700px] text-[16px] text-[#b7d9d2] sm:text-[18px]">
                Join hundreds of institutions already leveraging digital precision to preserve their sacred tradition.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="w-full rounded-md bg-white px-8 py-4 text-[16px] font-bold text-[#063730] transition-colors hover:bg-[#ecf6f3] sm:w-auto"
                >
                  Get Started Now
                </Link>
                <div className="flex w-full items-center justify-center gap-3 sm:w-auto">
                  <a
                    href="mailto:hamdu@sinapari.com"
                    className="flex-1 rounded-md border border-[#2a5a53] bg-[#0b4a42] px-6 py-4 text-[15px] font-semibold text-[#d7eee9] transition-colors hover:bg-[#0e564d] sm:flex-none"
                  >
                    Email
                  </a>
                  <a
                    href="https://wa.me/233540182786"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md border border-[#2a5a53] bg-[#0b4a42] px-6 py-4 text-[15px] font-semibold text-[#d7eee9] transition-colors hover:bg-[#0e564d] sm:flex-none"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e7f0ed] bg-[#f7fffc]">
        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
          <div>
            <div className="text-[18px] font-bold tracking-[-0.01em] text-[#0d4c44]">Tahfiz</div>
            <p className="mt-4 max-w-[420px] text-[14px] leading-[1.6] text-[#6d8781]">
              A digital platform for Quran schools and memorization institutions, designed for teachers, students, and administrators.
            </p>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#4e746d]">Legal</div>
            <div className="mt-4 space-y-3 text-[14px] text-[#5f7e78]">
              <Link to="/privacy" className="block hover:text-[#0f766e]">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-[#0f766e]">Terms of Service</Link>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#4e746d]">Support</div>
            <div className="mt-4 space-y-3 text-[14px] text-[#5f7e78]">
              <a href="#" className="block hover:text-[#0f766e]">Help Center</a>
              <a href="mailto:hamdu@sinapari.com" className="block hover:text-[#0f766e]">Email Support</a>
              <a href="https://wa.me/233540182786" target="_blank" rel="noopener noreferrer" className="block hover:text-[#0f766e]">WhatsApp</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e7f0ed]">
          <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-4 py-6 text-[12px] text-[#7a938e] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <span>© {new Date().getFullYear()} Tahfiz. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <span>Built with care for Quran schools</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
