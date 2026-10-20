import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  CalendarCheck,
  Calendar,
  Dumbbell,
  TrendingUp,
  Award,
  FileText,
  LogOut,
  Dumbbell as GymIcon,
  Tag,
  AlertTriangle,
  Wrench,
  Key,
  Utensils,
  Star,
  History,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout, isAdmin, isTrainer, isMember } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardPath = isAdmin
    ? '/admin/dashboard'
    : isTrainer
    ? '/trainer/dashboard'
    : '/member/dashboard';

  // Grouped Navigation Structure according to Section 43
  const navSections = [
    {
      title: 'Dashboard',
      items: [
        {
          name: 'Dashboard',
          path: dashboardPath,
          icon: LayoutDashboard,
          roles: ['Admin', 'Trainer', 'Member']
        }
      ]
    },
    {
      title: 'People',
      items: [
        {
          name: 'Members',
          path: '/members',
          icon: Users,
          roles: ['Admin', 'Trainer']
        },
        {
          name: 'Trainers',
          path: '/trainers',
          icon: UserCheck,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Leads & Trials',
          path: '/leads',
          icon: UserPlus,
          roles: ['Admin', 'Trainer']
        }
      ]
    },
    {
      title: 'Membership',
      items: [
        {
          name: 'Plans',
          path: '/plans',
          icon: Award,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Memberships',
          path: '/memberships',
          icon: Award,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Dues & Defaulters',
          path: '/dues',
          icon: AlertTriangle,
          roles: ['Admin']
        },
        {
          name: 'Coupons & Offers',
          path: '/coupons',
          icon: Tag,
          roles: ['Admin']
        }
      ]
    },
    {
      title: 'Gym Operations',
      items: [
        {
          name: 'Attendance & QR',
          path: '/attendance',
          icon: CalendarCheck,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Payments & Billing',
          path: '/payments',
          icon: CreditCard,
          roles: ['Admin', 'Trainer']
        },
        {
          name: 'Group Classes',
          path: '/classes',
          icon: Calendar,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Equipment Care',
          path: '/equipment',
          icon: Wrench,
          roles: ['Admin']
        },
        {
          name: 'Lockers',
          path: '/lockers',
          icon: Key,
          roles: ['Admin', 'Member']
        }
      ]
    },
    {
      title: 'Fitness',
      items: [
        {
          name: 'Workouts',
          path: '/workouts',
          icon: Dumbbell,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Diet Plans',
          path: '/diet-plans',
          icon: Utensils,
          roles: ['Admin', 'Trainer', 'Member']
        },
        {
          name: 'Progress & PRs',
          path: '/progress',
          icon: TrendingUp,
          roles: ['Admin', 'Trainer', 'Member']
        }
      ]
    },
    {
      title: 'Engagement',
      items: [
        {
          name: 'Feedback & Reviews',
          path: '/feedback',
          icon: Star,
          roles: ['Admin', 'Trainer', 'Member']
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          name: 'Financial Reports',
          path: '/reports',
          icon: FileText,
          roles: ['Admin']
        },
        {
          name: 'Audit Logs',
          path: '/audit-logs',
          icon: History,
          roles: ['Admin']
        },
        {
          name: 'DBMS Diagnostics',
          path: '/diagnostics',
          icon: Database,
          roles: ['Admin']
        }
      ]
    }
  ];

  const userRole = user?.role || 'Member';

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#0d121c] border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/80 shrink-0">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <GymIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              Gym<span className="text-emerald-400">Flow</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/80 block">
              MongoDB Edition
            </span>
          </div>
        </div>

        {/* User Role Card */}
        <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  userRole === 'Admin'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : userRole === 'Trainer'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="px-3 py-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-400 font-medium text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
