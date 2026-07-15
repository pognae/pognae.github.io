export default {
  async fetch(request, env) {
    // CORS 설정을 위한 헤더
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const key = "site_visits";

    try {
      let currentCountStr = await env.COUNTER_KV.get(key);
      let count = parseInt(currentCountStr);

      if (isNaN(count)) {
        count = 0;
      }

      count += 1;
      await env.COUNTER_KV.put(key, count.toString());

      return new Response(JSON.stringify({ visits: count }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};
