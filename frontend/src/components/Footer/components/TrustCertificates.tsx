import { TRUST_CERTIFICATES } from '../constants';

export function TrustCertificates() {
  return (
    <div className="border-t border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {TRUST_CERTIFICATES.map((cert, idx) => {
            const Icon = cert.icon;
            return (
              <div key={idx} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-gray-800">
                <div className={`w-12 h-12 bg-gradient-to-br ${cert.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{cert.label}</p>
                  <p className="text-sm text-white font-bold">{cert.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}