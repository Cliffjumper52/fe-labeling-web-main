export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono overflow-hidden relative">
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }}
      />

      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 animate-[gridPan_20s_linear_infinite]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,50,50,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,50,50,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <style>{`
        @keyframes gridPan {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        @keyframes glitchX {
          0%, 100% { clip-path: inset(0 0 100% 0); transform: translateX(0); }
          10% { clip-path: inset(10% 0 85% 0); transform: translateX(-4px); }
          20% { clip-path: inset(40% 0 50% 0); transform: translateX(4px); }
          30% { clip-path: inset(70% 0 20% 0); transform: translateX(-2px); }
          50% { clip-path: inset(60% 0 30% 0); transform: translateX(-4px); }
          80% { clip-path: inset(30% 0 60% 0); transform: translateX(4px); }
        }
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Moving scanline */}
      <div
        className="fixed left-0 right-0 h-1 z-10 pointer-events-none animate-[scanline_4s_linear_infinite]"
        style={{
          background:
            "linear-gradient(transparent, rgba(255,50,50,0.15), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-20 text-center px-6 animate-[slideUp_0.6s_ease_forwards]">
        {/* 403 */}
        <div className="relative inline-block mb-4">
          {/* Ghost outline */}
          <div
            className="absolute inset-0 text-transparent font-black leading-none select-none"
            style={{
              fontSize: "clamp(8rem,20vw,16rem)",
              WebkitTextStroke: "2px rgba(255,50,50,0.2)",
            }}
          >
            403
          </div>
          {/* Glitch number */}
          <div
            className="relative font-black leading-none text-[#ff3232]"
            style={{
              fontSize: "clamp(8rem,20vw,16rem)",
              animation: "glitchX 3s steps(1) infinite, flicker 5s infinite",
              textShadow:
                "3px 0 #ff0000, -3px 0 #ff6666, 0 0 40px rgba(255,50,50,0.5)",
            }}
          >
            403
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full max-w-sm mx-auto mb-5 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, #ff3232, transparent)",
            boxShadow: "0 0 10px rgba(255,50,50,0.5)",
          }}
        />

        {/* FORBIDDEN */}
        <p className="text-[#ff3232] text-xs tracking-[0.4em] uppercase mb-4 opacity-80">
          Forbidden
        </p>

        {/* Description */}
        <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed tracking-wide mb-6">
          You don't have permission to access this resource. Contact your
          administrator if you believe this is an error.
          <span className="inline-block w-2 ml-0.5 text-[#ff3232] animate-[blink_1s_step-end_infinite]">
            █
          </span>
        </p>

        {/* Error tags */}
        <div className="flex gap-4 justify-center mb-8 text-[0.65rem] tracking-widest text-[#ff3232]/40">
          <span>ERR_FORBIDDEN</span>
          <span className="text-white/10">|</span>
          <span>HTTP 403</span>
          <span className="text-white/10">|</span>
          <span>ROLE_INSUFFICIENT</span>
        </div>

        {/* Button */}
        <button
          onClick={() => window.history.back()}
          className="bg-transparent border border-[#ff3232]/30 text-white/50 px-10 py-3 text-xs tracking-[0.25em] uppercase cursor-pointer transition-all duration-200 hover:bg-[#ff3232]/10 hover:border-[#ff3232] hover:text-[#ff3232] hover:shadow-[0_0_20px_rgba(255,50,50,0.3)]"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
