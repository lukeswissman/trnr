import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className, size = 48 }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                className="pixelated drop-shadow-[0_0_8px_rgba(197,2,2,0.4)]"
                style={{ imageRendering: 'pixelated' }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="synthSunRefined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C50202" />
                        <stop offset="100%" stopColor="#3A056F" />
                    </linearGradient>
                </defs>

                {/* The Sun */}
                <circle cx="50" cy="45" r="35" fill="url(#synthSunRefined)" />

                {/* Sun Stripes */}
                <g fill="rgba(10, 10, 15, 0.8)">
                    <rect x="10" y="55" width="80" height="2" />
                    <rect x="10" y="60" width="80" height="3" />
                    <rect x="10" y="66" width="80" height="5" />
                    <rect x="10" y="74" width="80" height="8" />
                </g>

                {/* Perspective Grid Line */}
                <line x1="0" y1="80" x2="100" y2="80" stroke="#C50202" strokeWidth="0.5" opacity="0.6" />

                {/* Pixel Cyclist */}
                <g fill="#fff">
                    <rect x="42" y="48" width="4" height="4" />
                    <rect x="46" y="44" width="4" height="4" />
                    <rect x="50" y="40" width="6" height="4" />
                    <rect x="54" y="34" width="4" height="4" />
                    <rect x="56" y="40" width="4" height="4" />
                    <rect x="60" y="44" width="2" height="4" />
                    <rect x="42" y="52" width="12" height="2" />
                    <rect x="54" y="50" width="2" height="4" />
                    <rect x="42" y="54" width="2" height="6" />
                    <rect x="34" y="60" width="14" height="2" />
                    <rect x="34" y="72" width="14" height="2" />
                    <rect x="32" y="62" width="2" height="10" />
                    <rect x="48" y="62" width="2" height="10" />
                    <rect x="56" y="60" width="14" height="2" />
                    <rect x="56" y="72" width="14" height="2" />
                    <rect x="54" y="62" width="2" height="10" />
                    <rect x="70" y="62" width="2" height="10" />
                </g>
            </svg>
            <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-synth-red to-synth-purple">
                trnr
            </span>
        </div>
    );
};

export default Logo;
