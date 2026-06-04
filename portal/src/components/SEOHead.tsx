import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const BASE_TITLE = 'ResQPet';
const DEFAULT_DESC = 'Encuentra tu compañero perfecto. Miles de animales en adopción te esperan en ResQPet.';
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80';

export function SEOHead({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Adopta, no compres`;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMG;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
