import MenuApp from "@/components/menu/MenuApp";
import { getMenu } from "@/lib/menu/repo";
import { siteUrl } from "@/lib/supabase/env";

export const revalidate = 60;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (m: number) => (m >= 1440 ? "23:59" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);

export default async function Home() {
  const menu = await getMenu();
  const s = menu.settings;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: "Koi Tea Boba Shop",
    url: siteUrl(),
    image: `${siteUrl()}/icons/og-mark.png`,
    servesCuisine: "Bubble tea",
    priceRange: "$",
    address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: "Puerto Peñasco", addressRegion: "Sonora", postalCode: "83550", addressCountry: "MX" },
    openingHoursSpecification: s.schedule.flatMap((d, i) => (d ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[i], opens: hhmm(d[0]), closes: hhmm(d[1]) }] : [])),
    sameAs: [`https://www.instagram.com/${s.instagram}/`],
    hasMenu: { "@type": "Menu", hasMenuSection: menu.categories.map((c) => ({ "@type": "MenuSection", name: c.name.es, hasMenuItem: menu.drinks.filter((d) => d.cat === c.id && d.available).map((d) => ({ "@type": "MenuItem", name: d.name.es, description: d.desc.es, offers: { "@type": "Offer", price: d.price, priceCurrency: "MXN" } })) })) },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MenuApp menu={menu} />
    </>
  );
}
