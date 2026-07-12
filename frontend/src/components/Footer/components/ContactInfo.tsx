import { CONTACT_INFO, SUPPORT_HOURS } from '../constants';

export function ContactInfo() {
  return (
    <div>
      <h3 className="font-bold text-white mb-5 text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full"></span>
        اطلاعات تماس
      </h3>
      <ul className="space-y-4">
        {CONTACT_INFO.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex items-center gap-3 text-sm text-gray-400 group">
              <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-white font-semibold">{item.value}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ساعات پشتیبانی */}
      <div className="mt-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-gray-400 font-semibold">ساعات پشتیبانی</p>
        </div>
        <p className="text-sm text-white font-bold mb-1">{SUPPORT_HOURS.days}</p>
        <p className="text-sm text-primary-400 font-semibold">{SUPPORT_HOURS.time}</p>
      </div>
    </div>
  );
}