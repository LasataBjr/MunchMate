import HeroSection from "./components/HeroSection";
import FeaturedMachines from "./components/FeaturedMachines";
import HowItWorks from "./components/HowItWorks";
import CallToAction from "./components/CallToAction";

function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedMachines />
      <HowItWorks />
      <CallToAction />
    </>
  );
}

export default HomePage;