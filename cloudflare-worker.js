export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/config") {
      if (request.method === "GET") {
        return handleGetConfig(env);
      }
      if (request.method === "POST" || request.method === "PUT") {
        return handleSaveConfig(request, env);
      }
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname.startsWith("/bing-wallpaper")) {
      return handleBingWallpaper();
    }
    return new Response("Not Found", { status: 404 });
  },
};

async function handleGetConfig(env) {
  try {
    const value = await env.HOMEDOCK_CONFIG.get("config", "json");
    if (value && typeof value === "object") {
      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    const fallback = {
      applications: [],
      background: {
        mode: "wallpaper",
        solidColor: "#202124",
        gradientFrom: "#141e30",
        gradientTo: "#243b55",
      },
    };
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response("Failed to load config", { status: 500 });
  }
}

async function handleSaveConfig(request, env) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return new Response("Invalid config", { status: 400 });
    }
    await env.HOMEDOCK_CONFIG.put("config", JSON.stringify(body));
    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response("Failed to save config", { status: 500 });
  }
}

async function handleBingWallpaper() {
  const apiUrl =
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN";
  try {
    const resp = await fetch(apiUrl, { cf: { cacheTtl: 0 } });
    if (!resp.ok) {
      return new Response("Failed to fetch Bing metadata", { status: 502 });
    }
    const data = await resp.json();
    const images = data && Array.isArray(data.images) ? data.images : [];
    if (!images.length) {
      return new Response("No images in Bing response", { status: 502 });
    }
    const choice = images[Math.floor(Math.random() * images.length)];
    const imageUrl = "https://www.bing.com" + choice.url;
    return Response.redirect(imageUrl, 302);
  } catch (err) {
    return new Response("Failed to fetch Bing wallpaper", { status: 500 });
  }
}
