import type { BandeiraCartao } from '../types/models';
import { BANDEIRA_LABELS } from '../types/models';
import eloLogo from '../assets/elo.svg';
import hipercardLogo from '../assets/card-networks/hipercard.svg';
import mastercardLogo from '../assets/card-networks/mastercard.svg';
import visaLogo from '../assets/card-networks/visa.svg';

interface CardNetworkLogoProps {
  network: BandeiraCartao;
  className?: string;
}

export function CardNetworkLogo({ network, className = 'h-10 w-16' }: CardNetworkLogoProps) {
  const label = BANDEIRA_LABELS[network];

  if (network === 'elo') {
    return <img className={`${className} object-contain`} src={eloLogo} alt={label} />;
  }

  const logo = network === 'mastercard'
    ? mastercardLogo
    : network === 'visa'
      ? visaLogo
      : network === 'hipercard'
        ? hipercardLogo
        : null;

  if (logo) {
    return <img className={`${className} object-contain`} src={logo} alt={label} />;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 64"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      {network === 'outros' ? (
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
