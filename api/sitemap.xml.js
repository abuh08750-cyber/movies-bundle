
const SUPABASE_URL =
  "https://quczwzxnexlgehhrlmof.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_1r3ACgZZPKqAGNAX_hRS6g_HyYme2AM";

const SITE_URL = "https://cineflix-mocha.vercel.app";
const PAGE_SIZE = 1000;

module.exports = async (req, res) => {
  try {
    const movieIds = [];
    let offset = 0;

    while (true) {
      const apiURL = new URL(
        `${SUPABASE_URL}/rest/v1/movies`
      );

      apiURL.searchParams.set("select", "id");
      apiURL.searchParams.set("status", "eq.published");
      apiURL.searchParams.set("order", "id.asc");
      apiURL.searchParams.set("limit", String(PAGE_SIZE));
      apiURL.searchParams.set("offset", String(offset));

      const response = await fetch(apiURL, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to fetch published movies");
      }

      const movies = await response.json();

      movieIds.push(...movies.map(movie => movie.id));

      if (movies.length < PAGE_SIZE) {
        break;
      }

      offset += PAGE_SIZE;
    }

    const urls = [
      `${SITE_URL}/`,
      ...movieIds.map(
        id => `${SITE_URL}/movie/${id}`
      )
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader(
      "Content-Type",
      "application/xml; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).send(xml);

  } catch (error) {
    console.error("Dynamic Sitemap Error:", error);

    return res.status(500).send(
      "Unable to generate sitemap"
    );
  }
};
