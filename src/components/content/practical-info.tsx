import { Bus, Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import { contact } from "@/content/contact";

export function PracticalInfo(): JSX.Element {
  return (
    <section className="practical-info" aria-labelledby="practical-info-title">
      <h2 id="practical-info-title">Informations pratiques</h2>
      <address>
        <a href={contact.phoneHref}>
          <Phone aria-hidden="true" size={22} />
          {contact.phone}
        </a>
        <span>
          <MapPin aria-hidden="true" size={22} />
          {contact.street}, {contact.city}
        </span>
        <span>
          <Bus aria-hidden="true" size={22} />
          {contact.transport}
        </span>
        <span>
          <Clock aria-hidden="true" size={22} />
          {contact.openingHours}
        </span>
      </address>
      <Link className="text-link" href="/contact">
        Toutes les façons de nous joindre
      </Link>
    </section>
  );
}
