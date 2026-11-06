import MenuApp from "@/components/menu/MenuApp";
import { getMenu } from "@/lib/menu/repo";
import { siteUrl } from "@/lib/supabase/env";

export const revalidate = 60;

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
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "11:00", closes: "21:30" }],
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
