import Image from "next/image";
import logoWhite from "../../public/brand/logo-horiz-white.png";

export function BrandCardHeader() {
  return (
    <div className="dev-landing-card-header">
      <Image
        src={logoWhite}
        alt="Corduroy"
        className="app-brand-logo"
        style={{ height: "2.5rem", width: "auto" }}
        priority
      />
      <p className="h4 d-block text-white fw-semibold mt-2 mb-0">
        Behavioral Intelligence Platform
      </p>
    </div>
  );
}
