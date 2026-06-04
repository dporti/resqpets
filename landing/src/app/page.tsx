import { Navbar }            from '@/components/landing/Navbar';
import { Hero }              from '@/components/landing/Hero';
import { ProblemSection }    from '@/components/landing/ProblemSection';
import { FeaturesSection }   from '@/components/landing/FeaturesSection';
import { StatsSection }      from '@/components/landing/StatsSection';
import { PricingSection }    from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CtaSection }        from '@/components/landing/CtaSection';
import { Footer }            from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <StatsSection />
        <PricingSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
