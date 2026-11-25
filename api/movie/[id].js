const SUPABASE_URL = "https://quczwzxnexlgehhrlmof.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_1r3ACgZZPKqAGNAX_hRS6g_HyYme2AM";

const SITE_URL = "https://cineflix-mocha.vercel.app";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeImage(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

module.exports = async (req, res) => {
  try {
    const id = req.query.id;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).send("Invalid movie ID");
    }

    const apiURL = new URL(
      `${SUPABASE_URL}/rest/v1/movies`
    );

    apiURL.searchParams.set(
      "select",
      "id,movie_name,description,poster_url,release_date,genre,language,industry,duration,starcast,trailer_url"
    );

    apiURL.searchParams.set("id", `eq.${id}`);
    apiURL.searchParams.set("status", "eq.published");
    apiURL.searchParams.set("limit", "1");

    const response = await fetch(apiURL, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error("Movie database request failed");
    }

    const data = await response.json();
    const movie = data[0];

    if (!movie) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="robots" content="noindex">
          <title>Movie Not Found | CINEFLIX</title>
        </head>
        <body>
          <h1>Movie Not Found</h1>
          <a href="${SITE_URL}/">Go to CINEFLIX</a>
        </body>
        </html>
      `);
    }

    const title = `${movie.movie_name} | CINEFLIX`;
    const description = (
      movie.description ||
      `Explore ${movie.movie_name} movie details on CINEFLIX.`
    ).slice(0, 300);

    const canonical = `${SITE_URL}/movie/${movie.id}`;
    const poster = safeImage(movie.poster_url || "");

    const movieSchema = {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.movie_name,
      "description": description,
      "image": poster || undefined,
      "datePublished": movie.release_date || undefined,
      "genre": movie.genre || undefined,
      "inLanguage": movie.language || undefined,
      "duration": movie.duration || undefined,
      "actor": movie.starcast
        ? movie.starcast.split(",").map(name => ({
            "@type": "Person",
            "name": name.trim()
          }))
        : undefined
    };

    const jsonLD = JSON.stringify(movieSchema)
      .replace(/</g, "\\u003c");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${escapeHTML(title)}</title>

  <meta name="description"
    content="${escapeHTML(description)}">

  <meta name="robots" content="index, follow">

  <link rel="canonical" href="${canonical}">

  <meta property="og:type" content="video.movie">
  <meta property="og:site_name" content="CINEFLIX">
  <meta property="og:title" content="${escapeHTML(title)}">
  <meta property="og:description"
    content="${escapeHTML(description)}">
  <meta property="og:url" content="${canonical}">
  ${poster ? `<meta property="og:image" content="${escapeHTML(poster)}">` : ""}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(title)}">
  <meta name="twitter:description"
    content="${escapeHTML(description)}">
  ${poster ? `<meta name="twitter:image" content="${escapeHTML(poster)}">` : ""}

  <script type="application/ld+json">${jsonLD}</script>

  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #070b14;
      color: #f4f8ff;
      font-family: Arial, sans-serif;
    }
    main {
      max-width: 850px;
      margin: 30px auto;
      line-height: 1.7;
    }
    img {
      width: 220px;
      max-width: 100%;
      border-radius: 12px;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 18px;
      background: #58c7ff;
      color: #061321;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
    }
    .muted { color: #9aabc2; }
  </style>
</head>

<body>
  <main>
    <h1>${escapeHTML(movie.movie_name)}</h1>

    ${poster
      ? `<img src="${escapeHTML(poster)}"
          alt="${escapeHTML(movie.movie_name)} poster">`
      : ""}

    <p class="muted">
      ${escapeHTML([
        movie.release_date,
        movie.genre,
        movie.language,
        movie.industry,
        movie.duration
      ].filter(Boolean).join(" • "))}
    </p>

    <h2>About ${escapeHTML(movie.movie_name)}</h2>

    <p>${escapeHTML(description)}</p>

    ${movie.starcast
      ? `<h2>Star Cast</h2>
         <p>${escapeHTML(movie.starcast)}</p>`
      : ""}

    <a href="${SITE_URL}/#movie/${movie.id}">
      Open Movie on CINEFLIX
    </a>

    <p class="muted">
      Movie information provided by CINEFLIX.
    </p>
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    return res.status(200).send(html);

  } catch (error) {
    console.error("Movie SEO API error:", error);

    return res.status(500).send(
      "Unable to load movie page. Please try again later."
    );
  }
};
    
