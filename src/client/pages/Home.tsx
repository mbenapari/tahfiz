import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fffd] text-slate-900">
      <header className="border-b border-[#e9f3ef] bg-[#f8fffd]/95">
        <div className="mx-auto flex h-20 w-full max-w-[1220px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-[17px] font-bold tracking-[-0.01em] text-[#0e5147]">The Sacred Precision</div>
          <nav className="hidden items-center gap-8 text-[14px] font-semibold text-[#2d5f56] md:flex">
            <a href="#features" className="transition-colors hover:text-[#0f766e]">Features</a>
            <a href="#pricing" className="transition-colors hover:text-[#0f766e]">Pricing</a>
            <a href="#about" className="transition-colors hover:text-[#0f766e]">About</a>
          </nav>
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

      <main className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-12 px-4 pb-20 pt-14 sm:px-6 md:gap-16 md:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-[#c6f8df] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f7a65]">
            Modernizing Tradition
          </span>
          <h1 className="mt-5 max-w-[620px] text-balance text-[50px] font-extrabold leading-[0.98] tracking-[-0.02em] text-[#042f2b] sm:text-[58px]">
            Empowering Quran Schools with Digital Precision
          </h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-[1.45] text-[#4a6a66]">
            The all-in-one platform for managing students, tracking memorization progress, and institutional performance.
            Elevate your Hifz program to new standards.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center rounded-md bg-[#073c36] px-6 py-3 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#052f2b]"
            >
              Get Started Today
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-[#e6ecea] bg-white px-6 py-3 text-[16px] font-semibold text-[#1b3f3b] transition-colors hover:bg-[#f6fbf9]"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#dce5e1] text-[11px]">▶</span>
              Watch Demo
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[560px] rounded-xl border border-[#e7ecea] bg-white p-4 shadow-[0_8px_30px_rgba(7,60,54,0.08)] sm:p-5">
            <div className="relative overflow-hidden rounded-lg bg-[radial-gradient(circle_at_18%_10%,#1f2937_0%,#0b0f16_66%)] px-5 py-7 sm:px-8">
              <button
                type="button"
                aria-label="Previous preview"
                className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-xs text-white/90 backdrop-blur sm:inline-flex"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next preview"
                className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-xs text-white/90 backdrop-blur sm:inline-flex"
              >
                ›
              </button>
              <div className="mx-auto h-[360px] w-[180px] rounded-[30px] border border-white/10 bg-black p-[10px] shadow-[0_18px_36px_rgba(0,0,0,0.55)] sm:h-[390px] sm:w-[200px]">
                <div className="h-full w-full rounded-[22px] border border-white/5 bg-[#0d0f13] px-3 py-4 text-[9.5px] leading-5 text-slate-300">
                  <div className="mb-2 text-[10px] font-semibold text-slate-100">Dashboard</div>
                  <div className="space-y-2">
                    <div className="rounded bg-white/[0.03] px-2 py-1">Daily Summary</div>
                    <div className="rounded bg-white/[0.03] px-2 py-1">Hifz Progress</div>
                    <div className="rounded bg-white/[0.03] px-2 py-1">Attendance Trends</div>
                    <div className="rounded bg-white/[0.03] px-2 py-1">Memorization Queue</div>
                    <div className="rounded bg-white/[0.03] px-2 py-1">Revision Planner</div>
                    <div className="rounded bg-white/[0.03] px-2 py-1">Teacher Notes</div>
                  </div>
                  <div className="mt-6 text-center text-[8px] uppercase tracking-[0.2em] text-slate-500">Sacred Precision</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="border-t border-[#e9f3ef] bg-white/80">
        <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-[19px] font-bold text-[#0f7a65]">Trusted by over 100+ Schools Worldwide</p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[28px] font-extrabold tracking-[-0.01em] text-[#889693]">
            <span>AL-AZHAR</span>
            <span>MADINA INST.</span>
            <span>BAYYINAH</span>
            <span>ZAYTUNA</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fffd] py-20">
        <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-[46px] font-extrabold tracking-[-0.02em] text-[#042f2b]">Built for Excellence</h2>
            <div className="mx-auto mt-4 h-[6px] w-[78px] rounded-full bg-[#149d84]" />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <article className="rounded-md border border-[#eef4f1] bg-white p-7 shadow-[0_2px_10px_rgba(6,43,37,0.04)]">
              <div className="mb-5 text-[28px] text-[#0f8f77]">✣</div>
              <h3 className="text-[31px] font-extrabold leading-[1.05] tracking-[-0.01em] text-[#10443d]">Multi-Tenant Architecture</h3>
              <p className="mt-4 text-[16px] leading-[1.5] text-[#5f7771]">
                Secure, isolated data ecosystem for every institution. Manage multiple branches or independent schools with scoped privacy and strict
                administrative controls.
              </p>
            </article>

            <article className="flex items-center justify-center rounded-md border border-[#eef4f1] bg-white p-6 shadow-[0_2px_10px_rgba(6,43,37,0.04)]">
              <div className="w-full max-w-[330px] rounded-md border border-[#dde8e4] bg-[radial-gradient(circle_at_50%_20%,#d1ebf4_0%,#8db8cb_45%,#4a6175_100%)] px-6 py-8">
                <div className="mx-auto flex h-[145px] w-[245px] items-center justify-center rounded-md border border-white/30 bg-[#0f2434]/45 shadow-inner">
                  <div className="relative h-[84px] w-[150px] rounded-full border border-[#b8e6ff]/80 bg-[#a8d8ec]/20">
                    <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#8cd0f6]/25" />
                    <div className="absolute left-1/2 top-1/2 h-8 w-6 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/90 bg-white/50" />
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-md border border-[#0d5348] bg-[#0a3b35] p-7 text-white shadow-[0_6px_20px_rgba(5,40,35,0.25)]">
              <div className="mb-5 text-[28px] text-[#a9eadb]">↗</div>
              <h3 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.01em] text-[#ebfff9]">Performance Analytics</h3>
              <p className="mt-4 text-[16px] leading-[1.5] text-[#b9ddd5]">
                Institutional-level reports and deep insights to track efficiency and classroom progress with confidence.
              </p>
              <div className="mt-10">
                <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9fcfc5]">
                  <span>Avg. Retention</span>
                  <span>94%</span>
                </div>
                <div className="mt-2 h-[7px] w-full rounded-full bg-[#0d4a41]">
                  <div className="h-full w-[94%] rounded-full bg-[#9ef1da]" />
                </div>
              </div>
            </article>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
            <article className="rounded-md border border-[#eef4f1] bg-white p-7 shadow-[0_2px_10px_rgba(6,43,37,0.04)] lg:col-span-2">
              <div className="mb-5 text-[28px] text-[#0f8f77]">↗</div>
              <h3 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.01em] text-[#10443d]">Detailed Student Progress</h3>
              <p className="mt-4 text-[16px] leading-[1.5] text-[#5f7771]">
                Visual charts for memorization and revision trends to help teachers and students identify strengths and gaps quickly.
              </p>
              <div className="mt-6 w-full max-w-[320px] rounded-md border border-[#edf3f0] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#8ce4cf] text-[10px] font-bold text-[#0f8f77]">
                    75%
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#1f4f47]">Surah Al-Baqarah</div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-[#73908a]">Next update in 1 day</div>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-md border border-[#eef4f1] bg-white p-7 shadow-[0_2px_10px_rgba(6,43,37,0.04)] lg:col-span-3">
              <div className="mb-5 text-[28px] text-[#0f8f77]">≣</div>
              <h3 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.01em] text-[#10443d]">Daily Session Recording</h3>
              <p className="mt-4 max-w-[690px] text-[16px] leading-[1.5] text-[#5f7771]">
                Efficient tools for instructors to log daily readings, session feedback, page counts, and teacher observations for spiritual guidance.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#e8f0ed] bg-[#f8fcfa] px-3 py-1 text-[11px] font-semibold text-[#67857f]">Existing input v1</span>
                <span className="rounded-full border border-[#e8f0ed] bg-[#f8fcfa] px-3 py-1 text-[11px] font-semibold text-[#67857f]">Reviewer v2</span>
                <span className="rounded-full border border-[#e8f0ed] bg-[#f8fcfa] px-3 py-1 text-[11px] font-semibold text-[#67857f]">Teacher v3</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-[46px] font-extrabold tracking-[-0.02em] text-[#062f2b]">A Seamless Journey</h2>
            <p className="mx-auto mt-3 max-w-[760px] text-[16px] text-[#6b827d]">
              Get your institution running in minutes with our structured onboarding.
            </p>
            <div className="mx-auto mt-4 h-[6px] w-[78px] rounded-full bg-[#149d84]" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            <article className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#e5efeb] bg-white text-[12px] font-bold text-[#2d6660]">01</div>
              <h3 className="mt-5 text-[24px] font-extrabold tracking-[-0.01em] text-[#0d3f39]">Register School</h3>
              <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-[1.45] text-[#667d78]">
                Create your account and provide basic institutional details.
              </p>
            </article>
            <article className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#d5eee8] bg-[#f2fffb] text-[12px] font-bold text-[#0f7a65]">02</div>
              <h3 className="mt-5 text-[24px] font-extrabold tracking-[-0.01em] text-[#0d3f39]">Enroll Students</h3>
              <p className="mx-auto mt-3 max-w-[290px] text-[15px] leading-[1.45] text-[#667d78]">
                Onboard students and assign them to teachers and memorization groups.
              </p>
            </article>
            <article className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#0d574b] bg-[#073c36] text-[12px] font-bold text-white">03</div>
              <h3 className="mt-5 text-[24px] font-extrabold tracking-[-0.01em] text-[#0d3f39]">Track Progress</h3>
              <p className="mx-auto mt-3 max-w-[290px] text-[15px] leading-[1.45] text-[#667d78]">
                Start recording daily memorization sessions and revision metrics.
              </p>
            </article>
          </div>

          <div className="mx-auto mt-14 max-w-[980px] rounded-2xl bg-[#073c36] px-6 py-10 text-center shadow-[0_12px_30px_rgba(7,60,54,0.26)] sm:px-12">
            <h3 className="text-[44px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
              Start your journey towards a more organized school today
            </h3>
            <p className="mx-auto mt-4 max-w-[700px] text-[16px] text-[#b7d9d2]">
              Join hundreds of institutions already leveraging digital precision to preserve their sacred tradition.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center rounded-md bg-white px-6 py-3 text-[15px] font-semibold text-[#063730] transition-colors hover:bg-[#ecf6f3]"
              >
                Get Started Now
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-md border border-[#2a5a53] bg-[#0b4a42] px-6 py-3 text-[15px] font-semibold text-[#d7eee9] transition-colors hover:bg-[#0e564d]"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e7f0ed] bg-[#f7fffc]">
        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="text-[18px] font-bold tracking-[-0.01em] text-[#0d4c44]">The Sacred Precision</div>
            <p className="mt-3 max-w-[420px] text-[13px] leading-[1.55] text-[#6d8781]">
              The AI-powered digital platform for Quran schools and memorization institutions. Built for teachers, students, and administrators.
            </p>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#4e746d]">Platform</div>
            <div className="mt-3 space-y-2 text-[13px] text-[#5f7e78]">
              <a href="#features" className="block hover:text-[#0f766e]">Features</a>
              <a href="#pricing" className="block hover:text-[#0f766e]">Pricing</a>
              <a href="#about" className="block hover:text-[#0f766e]">About</a>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#4e746d]">Legal</div>
            <div className="mt-3 space-y-2 text-[13px] text-[#5f7e78]">
              <a href="#" className="block hover:text-[#0f766e]">Privacy Policy</a>
              <a href="#" className="block hover:text-[#0f766e]">Terms of Service</a>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#4e746d]">Support</div>
            <div className="mt-3 space-y-2 text-[13px] text-[#5f7e78]">
              <a href="#" className="block hover:text-[#0f766e]">Help Center</a>
              <a href="#" className="block hover:text-[#0f766e]">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e7f0ed]">
          <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-2 px-4 py-4 text-[12px] text-[#7a938e] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <span>© {new Date().getFullYear()} The Sacred Precision. All rights reserved.</span>
            <span>Built with care for Quran schools</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
