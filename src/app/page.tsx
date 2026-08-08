'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Receipt,
  FileText,
  FileBarChart,
  Banknote,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import Dashboard from '@/components/abbad/Dashboard';
import ClientsManager from '@/components/abbad/ClientsManager';
import VehiclesManager from '@/components/abbad/VehiclesManager';
import ShipmentsManager from '@/components/abbad/ShipmentsManager';
import ExpensesManager from '@/components/abbad/ExpensesManager';
import DeliveryNoteGenerator from '@/components/abbad/DeliveryNoteGenerator';
import InvoicesManager from '@/components/abbad/InvoicesManager';
import WeeklyReport from '@/components/abbad/WeeklyReport';

const navItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'clients', label: 'الزبائن', icon: Users },
  { id: 'vehicles', label: 'المركبات والسائقين', icon: Truck },
  { id: 'shipments', label: 'الشحنات والطلبيات', icon: Package },
  { id: 'expenses', label: 'المصاريف التشغيلية', icon: Banknote },
  { id: 'delivery-note', label: 'وصل التسليم', icon: FileText },
  { id: 'invoices', label: 'الفواتير الرسمية', icon: Receipt },
  { id: 'weekly-report', label: 'الحصيلة الأسبوعية', icon: FileBarChart },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsManager />;
      case 'vehicles':
        return <VehiclesManager />;
      case 'shipments':
        return <ShipmentsManager />;
      case 'expenses':
        return <ExpensesManager />;
      case 'delivery-note':
        return <DeliveryNoteGenerator />;
      case 'invoices':
        return <InvoicesManager />;
      case 'weekly-report':
        return <WeeklyReport />;
      default:
        return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 no-print',
          'w-72 flex flex-col',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-20'
        )}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div
              className={cn(
                'transition-all duration-300 overflow-hidden',
                sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 lg:w-0'
              )}
            >
              <h1 className="font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap">
                عباد للنقل
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">نظام التسيير</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-amber-600 dark:text-amber-400' : ''
                  )}
                />
                <span
                  className={cn(
                    'transition-all duration-300 whitespace-nowrap',
                    sidebarOpen
                      ? 'opacity-100'
                      : 'opacity-0 w-0 overflow-hidden lg:opacity-0 lg:w-0'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-5 h-5 transition-transform duration-300',
                !sidebarOpen ? 'rotate-180' : ''
              )}
            />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 min-h-screen',
          sidebarOpen ? 'lg:mr-72' : 'lg:mr-20'
        )}
      >
        {/* Top Bar (mobile) */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 no-print">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {navItems.find((n) => n.id === activeSection)?.label}
              </h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
