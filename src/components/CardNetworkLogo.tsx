import type { BandeiraCartao } from '../types/models';
import { BANDEIRA_LABELS } from '../types/models';
import eloLogo from '../assets/elo.svg';

interface CardNetworkLogoProps {
  network: BandeiraCartao;
  className?: string;
}

export function CardNetworkLogo({ network, className = 'h-10 w-16' }: CardNetworkLogoProps) {
  const label = BANDEIRA_LABELS[network];

  if (network === 'elo') {
    return <img className={className} src={eloLogo} alt={label} />;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 64"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      {network === 'mastercard' ? (
        <text
          x="50"
          y="37"
          textAnchor="middle"
          fill="#171717"
          fontFamily="Arial, sans-serif"
          fontSize="16"
          fontWeight="700"
          textLength="82"
          lengthAdjust="spacingAndGlyphs"
        >
          Mastercard
        </text>
      ) : network === 'hipercard' ? (
        <text
          x="50"
          y="37"
          textAnchor="middle"
          fill="#171717"
          fontFamily="Arial, sans-serif"
          fontSize="16"
          fontWeight="700"
          textLength="82"
          lengthAdjust="spacingAndGlyphs"
        >
          Hipercard
        </text>
      ) : network === 'outros' ? (
        <text
          x="50"
          y="37"
          textAnchor="middle"
          fill="#525252"
          fontFamily="Arial, sans-serif"
          fontSize="17"
          fontWeight="600"
        >
          Cartão
        </text>
      ) : (
        <text
          x="50"
          y="37"
          textAnchor="middle"
          fill="#171717"
          fontFamily="Arial, sans-serif"
          fontSize="18"
          fontWeight="700"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
