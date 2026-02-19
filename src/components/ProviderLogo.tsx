interface ProviderLogoProps {
  provider: string;
  size?: number;
  className?: string;
}

export function ProviderLogo({ provider, size = 20, className = '' }: ProviderLogoProps) {
  if (provider === 'openai') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 41 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.224-3.735 10.079 10.079 0 0 0-11.298 4.96 9.964 9.964 0 0 0-6.675 4.813 10.079 10.079 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.224 3.735 10.079 10.079 0 0 0 11.298-4.961 9.965 9.965 0 0 0 6.675-4.813 10.079 10.079 0 0 0-1.24-11.816zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103L16.4 34.494a7.505 7.505 0 0 1-10.008-3.488zm-1.32-17.48A7.472 7.472 0 0 1 9.08 9.99l-.001.252v9.202a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L8.2 23.94a7.505 7.505 0 0 1-3.128-10.414zm27.688 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l7.775 4.99a7.505 7.505 0 0 1-1.168 13.528v-9.452a1.293 1.293 0 0 0-.364-.496zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l7.859-4.384a7.504 7.504 0 0 1 11.325 6.502zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.505 7.505 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18.906z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (provider === 'anthropic') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 46 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M32.73 0h-6.945L38.45 32h6.945L32.73 0zM12.665 0L0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264zm-.702 19.337 4.334-11.246 4.334 11.246H11.963z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (provider === 'google') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 192 192"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="gemini-grad-a" x1="0.573" y1="0.057" x2="0.426" y2="0.943" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#1aa4f5" />
            <stop offset="1" stopColor="#1a6bf5" />
          </linearGradient>
        </defs>
        <path
          d="M96 180c-4.4-16.7-9.4-31.8-16.4-44.8C71.6 121.2 61 109 47 97.6 33 86.2 18.8 78.8 0 75.4c18.4-2 32.8-6.6 47.4-17 14.6-10.4 25-25.4 35.4-42.4C90.2 8.6 92.8 0 96 0c3.2 0 5.8 8.6 13.2 16C120 32 130.4 47 145 57.4c14.6 10.4 29 15 47.4 17-18.8 3.4-33 10.8-47 22.2-14 11.4-24.6 23.6-32.6 37.6-7 13-12 28.1-16.4 44.8H96z"
          fill="url(#gemini-grad-a)"
        />
      </svg>
    );
  }

  return <span className={className}>{provider.charAt(0).toUpperCase()}</span>;
}

export function ProviderBadge({ provider, size = 16 }: { provider: string; size?: number }) {
  const colors: Record<string, string> = {
    openai: 'text-emerald-400',
    anthropic: 'text-orange-400',
    google: 'text-blue-400',
  };
  return (
    <span className={colors[provider] || 'text-gray-400'}>
      <ProviderLogo provider={provider} size={size} />
    </span>
  );
}
