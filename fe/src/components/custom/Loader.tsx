const PulseLoader = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple rings */}
      <div className="absolute w-32 h-32 rounded-full border border-amber-500/10 animate-ripple" />
      <div
        className="absolute w-32 h-32 rounded-full border border-amber-500/10 animate-ripple"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute w-32 h-32 rounded-full border border-amber-500/10 animate-ripple"
        style={{ animationDelay: "1s" }}
      />

      {/* Center dot */}
      <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
    </div>
  );
};

export default PulseLoader;
