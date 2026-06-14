import Footer from "./footer";
import Features from "./features";
import Hero from "./hero";
import ProductTimeline from "./product-timeline";

export default function Landing() {
  return (
    <div className="ef-landing-page min-h-screen pt-14">
      <div className="ef-landing-glow pointer-events-none fixed inset-x-0 top-0 h-[360px] z-0" />
      <div className="relative z-10">
        <Hero />
        <Features />
        <ProductTimeline />
        <Footer />
      </div>
    </div>
  );
}
