import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ 
        background: '#050506',
        animation: 'picaro-fade-in 0.3s ease-out',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse + subtle rotate */}
        <div
          style={{
            animation: 
              'picaro-pulse-rotate 2s ease-in-out infinite',
          }}
        >
          <div className="flex items-center gap-1">
            <span
              className="font-mono text-[28px] font-bold tracking-tight text-white"
            >
              Picora
            </span>
            <span
              className="font-mono text-[28px] font-bold tracking-tight text-emerald-500"
            >
              .art
            </span>
          </div>
        </div>

        {/* Subtle dot indicator */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-white/20"
              style={{
                animation: 
                  `picaro-dot-pulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes picaro-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes picaro-pulse-rotate {
          0% {
            opacity: 0.6;
            transform: rotate(-1deg) scale(0.98);
          }
          50% {
            opacity: 1;
            transform: rotate(1deg) scale(1.02);
          }
          100% {
            opacity: 0.6;
            transform: rotate(-1deg) scale(0.98);
          }
        }

        @keyframes picaro-dot-pulse {
          0%, 80%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};
