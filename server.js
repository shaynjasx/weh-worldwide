require("dotenv").config();
const express  = require("express");
const session  = require("express-session");
const fetch    = (...args) => import("node-fetch").then(({default:f})=>f(...args));
const app      = express();

const MEMBERS = {
  "1301310562306756670": { name:"Weh Shy",     slug:"weh-shy"     },
  "639072556527255590":  { name:"Weh Fritz",   slug:"weh-fritz"   },
  "391950417510137857":  { name:"Weh Miso",    slug:"weh-miso"    },
  "653144449777664010":  { name:"Weh Sophie",  slug:"weh-sophie"  },
  "1108783140509585428": { name:"Weh Aimi",    slug:"weh-aimi"    },
  "748733653957214321":  { name:"Weh Sythe",   slug:"weh-Sythe"   },
  "417263506312658944":  { name:"Weh Gabi",    slug:"weh-gabi"    },
  "567343649738981399":  { name:"Weh Maki",    slug:"weh-maki"    },
  "424417984585400320":  { name:"Weh Sonic",   slug:"weh-sonic"   },
  "956730548427063308":  { name:"Weh Giyu",    slug:"weh-giyu"    },
  "1231601873098899487": { name:"Weh Hash",    slug:"weh-hash"    },
  "771635488918470656":  { name:"Weh Santino", slug:"weh-santino" },
  "1066538538730012673": { name:"Weh Renzo",   slug:"weh-renzo"   },
  "916019072704077885":  { name:"Weh Dos",     slug:"weh-dos"     },
  "1106401108437499994": { name:"Weh Lucas",   slug:"weh-lucas"   },
  "1427965900178325626": { name:"Weh Kenzu",   slug:"weh-kenzu"   },
  "878706460446564382":  { name:"Weh Kiyent",  slug:"weh-kiyent"  },
  "847464719140519978":  { name:"Weh Chloe",   slug:"weh-chloe"   },
  "1127669992234684547": { name:"Weh Proxy",   slug:"weh-proxy"   },
  "753783531280400585":  { name:"Weh Migz",    slug:"weh-migz"    },
  "792008961419116574":  { name:"Weh Doja",    slug:"weh-doja"    },
  "1286286566993690674": { name:"Weh Shiva",   slug:"weh-shiva"   },
  "748477828508418068":  { name:"Weh Moon",    slug:"weh-moon"    },
  "655089283199402006":  { name:"Weh Jxtn",    slug:"weh-jxtn"    },
  "1385514526413422703": { name:"Weh Limx",    slug:"weh-limx"    },
  "1133654877126525009": { name:"Weh Pistol",  slug:"weh-pistol"  },
  "842730579140280331":  { name:"Weh Sin",     slug:"weh-sin"     },
  "1389046048793563249": { name:"Weh Cholo",   slug:"weh-cholo"   },
  "927904415074107453":  { name:"Weh Matthew", slug:"weh-matthew" },
  "1460786136980000981": { name:"Weh Sosa",    slug:"weh-sosa"    },
};

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, REDIRECT_URI, SESSION_SECRET, SITE_URL, PORT = 3000 } = process.env;

app.use(session({
  secret: SESSION_SECRET || "weh-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7*24*60*60*1000, httpOnly: true, sameSite: "none", secure: true },
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", SITE_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/auth/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect(`${SITE_URL}/?login=denied`);

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${SITE_URL}/?login=denied`);

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();
    const member = MEMBERS[discordUser.id];
    if (!member) return res.redirect(`${SITE_URL}/?login=denied`);

    const avatarHash = discordUser.avatar;
    const ext = avatarHash && avatarHash.startsWith("a_") ? "gif" : "png";
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${avatarHash}.${ext}?size=128`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const user = { id: discordUser.id, name: member.name, slug: member.slug, avatarUrl };

    /* Pass user data in URL so Netlify can store it in localStorage */
    const userData = encodeURIComponent(JSON.stringify(user));
    res.redirect(`${SITE_URL}?login=success&user=${userData}`);

  } catch (err) {
    console.error(err);
    res.redirect(`${SITE_URL}/?login=denied`);
  }
});

app.get("/auth/logout", (req, res) => {
  res.redirect(`${SITE_URL}?login=logout`);
});

app.get("/api/me", (req, res) => {
  res.json({ ok: false });
});

app.listen(PORT, () => console.log(`WEH backend running on port ${PORT}`));
