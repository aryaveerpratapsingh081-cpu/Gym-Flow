import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Shield, Users, Award, Calendar, CheckCircle2, ArrowRight, Activity, TrendingUp, Sparkles } from 'lucide-react';
import API from '../services/api';

export default function LandingPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    API.get('/plans')
      .then((res) => {
        if (res.data.success) setPlans(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0d12] text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#0a0d12]/80 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Dumbbell className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Gym<span className="text-emerald-400">Flow</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold transition-all"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 py-20 lg:py-28 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Enterprise Full-Stack Gym Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Smart Gym Management <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Powered by MongoDB & Express
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            GymFlow simplifies gym operations with real-time MongoDB analytics, role-based dashboards, member tracking, trainer workouts, QR attendance, and automated financial payments.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <span>Explore Live Prototype</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#plans"
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-semibold text-base transition-all"
            >
              View Membership Plans
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800 bg-[#0d121c] py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">MongoDB Backend</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">3 Roles</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Admin, Trainer, Member</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">QR Check-In</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Unique Member Code</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">Aggregations</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Revenue & Analytics</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Comprehensive Gym Management</h2>
          <p className="text-slate-400 text-sm mt-2">Built with modern Mongoose schemas and React Vite frontend</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Admin Control Center</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full member CRUD, trainer assignments, financial audit, plans configuration, and aggregated revenue charts.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl w-fit mb-4">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Trainer Workout Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assign customized exercises, muscle groups, sets, reps, weight, and track member body recomposition progress over time.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl w-fit mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Member Portal & QR Code</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Members get a personalized membership card, days remaining countdown, QR check-in token, workout routines, and progress graphs.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="px-6 lg:px-16 py-20 bg-[#0d121c] border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">Membership Plans</h2>
            <p className="text-slate-400 text-sm mt-2">Flexible plans powered by MongoDB Plan collection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div key={p._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between border-slate-800 hover:border-emerald-500/50">
                <div>
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  <div className="my-4">
                    <span className="text-3xl font-black text-emerald-400">₹{p.price}</span>
                    <span className="text-xs text-slate-400"> / {p.durationMonths} Mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">{p.description}</p>

                  <ul className="space-y-2 mb-6 text-xs text-slate-300">
                    {p.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs text-center border border-slate-800 hover:border-emerald-500 transition-all"
                >
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>GymFlow – Smart Gym Management System • Final Project</p>
      </footer>
    </div>
  );
}
