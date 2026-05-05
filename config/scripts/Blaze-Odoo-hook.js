const express = require("express");
const bodyParser = require("body-parser");
const xmlrpc = require("xmlrpc");
const slugify = require("slugify");

const app = express();
app.use(bodyParser.json());

const url = "www.ansoftwareservices.com";
const db = "an-software-services";
const username = "adrian@ansoftwareservices.com";
const apiKey = "e55d07c816d5ce4133033a805f540cc2113bf05f";
const blogId = 3; // Tech Trends blog ID

const common = xmlrpc.createClient({ url: `${url}/xmlrpc/2/common` });
const models = xmlrpc.createClient({ url: `${url}/xmlrpc/2/object` });

app.post("/blaze-webhook", (req, res) => {
  //   "title": "Post Title",
  //   "content": "<p>Full HTML content...</p>",
  //   "content_markdown": "# Markdown version",
  //   "excerpt": "Short summary",
  //   "meta_description": "SEO description",
  //   "keywords": ["AI", "Automation"],
  //   "slug": "post-url-slug",
  //   "author": "Adrian Nadeau",
  //   "created_at": "2026-03-01T10:00:00Z",
  //   "updated_at": "2026-03-01T10:05:00Z"
  //   "featured_image_url": "https://...",
  //   "image_alt": "AI trends graphic"
  const {
    title,
    content,
    excerpt,
    keywords,
    slug,
    author,
    created_at,
    featured_image_url,
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Missing title or content" });
  }

  common.methodCall("authenticate", [db, username, apiKey, {}], (err, uid) => {
    if (err) return res.status(500).json(err);

    const slug = slugify(title, { lower: true, strict: true });

    const postData = {
      name: title,
      blog_id: blogId,
      website_published: true,
      content: content,
      seo_name: slug,
      meta_description: title,
    };

    models.methodCall(
      "execute_kw",
      [db, uid, apiKey, "blog.post", "create", [postData]],
      (err, postId) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, postId });
      },
    );
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
