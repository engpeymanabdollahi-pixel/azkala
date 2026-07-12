import { OrdersSection } from './dashboard/OrdersSection';

export function OrdersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-3 md:px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900">سفارشات من</h1>
            <p className="text-gray-600 text-xs mt-0.5">مدیریت و پیگیری سفارشات شما</p>
          </div>
        </div>

        {/* Section */}
        <OrdersSection />
      </div>
    </div>
  );
}