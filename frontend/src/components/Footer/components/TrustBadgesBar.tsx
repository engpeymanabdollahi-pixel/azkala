import { TRUST_BADGES } from '../constants';

export function TrustBadgesBar() {
  return (
    <div className="border-b border-gray-800 bg-gradient-to-r from-primary-900/20 via-gray-900 to-accent-900/20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_BADGES.map((item, i) => (
            <div 
              key={i} 
              className="group flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-gray-800 hover:border-primary-500/50 hover:bg-white/10 transition-all duration-300"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-0.5">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}