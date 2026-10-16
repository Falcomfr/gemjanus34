import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CurrentPlanning } from "@/components/home/current-planning";
import { Hero } from "@/components/home/hero";
import { UpcomingNews } from "@/components/home/upcoming-news";
import { VisitPanel } from "@/components/home/visit-panel";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { selectLatestDocument } from "@/lib/content/select-latest-document";

export default async function HomePage() {
  const publicContentRepository = getPublicContentRepository();
  const [news, planningDocuments] = await Promise.all([
    publicContentRepository.getNews(),
    publicContentRepository.getDocuments("planning"),
  ]);
  const planning = selectLatestDocument(planningDocuments);

  return (
    <>
      <Hero planningHref={planning?.downloadUrl} />
      <CurrentPlanning document={planning} />
      <UpcomingNews items={news} now={new Date().toISOString()} />

      <section className="association-introduction" aria-labelledby="association-title">
        <div className="content-container association-introduction__inner">
          <p className="eyebrow eyebrow--dark">L&apos;association</p>
          <h2 id="association-title">Un lieu pour se retrouver et agir ensemble</h2>
          <p>
            Janus34 est une association loi 1901 et un Groupe d&apos;Entraide Mutuelle fondé en
            2006 à Montpellier. Chacun peut y créer du lien, partager des activités et prendre
            part à la vie collective à son rythme.
          </p>
          <Link className="text-link" href="/qui-sommes-nous">
            Découvrir Janus34
            <ArrowRight aria-hidden="true" size={20} />
          </Link>
        </div>
      </section>

      <VisitPanel />
    </>
  );
}
