import React from "react";

export interface NieaLogoProps {
  size?: "navbar" | "sm" | "md" | "lg" | "hero";
  className?: string;
  showBadge?: boolean;
  onPetCat?: () => void;
  variant?: "dark" | "light";
  interactive?: boolean;
  showSubtext?: boolean;
}

export const NieaLogo: React.FC<NieaLogoProps> = ({
  size = "hero",
  className = "",
  showBadge = false,
  onPetCat,
  variant = "dark",
  interactive = true,
  showSubtext = false,
}) => {
  // Responsive container width so the logo isn't squeezed on mobile, while keeping height constrained
  const sizeClasses = {
    navbar: "w-[115px] xs:w-[140px] sm:w-[220px] h-[44px] sm:h-[84px] shrink-0",
    sm: "w-[180px] sm:w-[260px] h-[72px] sm:h-[100px]",
    md: "w-[260px] sm:w-[340px] h-[110px] sm:h-[140px]",
    lg: "w-[320px] sm:w-[420px] h-[140px] sm:h-[180px]",
    hero: "w-[280px] xs:w-[340px] sm:w-[480px] md:w-[580px] h-[130px] sm:h-[220px] md:h-[280px]",
  };

  const subtextColor = variant === "light" ? "#374C44" : "#F7C869";

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center overflow-hidden ${sizeClasses[size]} ${className}`}
      onClick={interactive && onPetCat ? onPetCat : undefined}
      style={{ cursor: interactive && onPetCat ? "pointer" : "default" }}
    >
      {/* 
        By setting width to exactly 100% (w-full), we guarantee the left and right sides of the image NEVER get cut off.
        The height will scale automatically, and the top/bottom padding will overflow and be hidden by the container. 
      */}
      <img
        src="/Niea's_PNG.png?v=4"
        alt="Niea's Sandwich Bar Logo"
        className="absolute pointer-events-none drop-shadow-md max-w-none"
        style={{ 
          width: "92%",
          height: "auto",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
        draggable={false}
      />
      {showSubtext && (
        <div 
          className="font-extrabold uppercase select-none tracking-[0.3em] absolute bottom-0 w-full text-center"
          style={{ color: subtextColor, fontSize: size === "hero" ? "18px" : "12px", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
        >
          SANDWICH BAR
        </div>
      )}
    </div>
  );
};
