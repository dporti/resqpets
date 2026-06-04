import { Navbar }              from '@/components/landing/Navbar';
import { Hero }                from '@/components/landing/Hero';
import { LogoBar }             from '@/components/landing/LogoBar';
import { ProblemSection }      from '@/components/landing/ProblemSection';
import { ProductTour }         from '@/components/landing/ProductTour';
import { AISection }           from '@/components/landing/AISection';
import { AdoptionFlow }        from '@/components/landing/AdoptionFlow';
import { PricingSection }      from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection }          from '@/components/landing/FAQSection';
import { CtaSection }          from '@/components/landing/CtaSection';
import { Footer }              from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoBar />
        <ProblemSection />
        <ProductTour />
        <AISection />
        <AdoptionFlow />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
