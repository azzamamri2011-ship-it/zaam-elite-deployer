import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Upload error" });
    }

    const projectName = fields.name;
    const file = files.file;

    if (!projectName || !file) {
      return res.status(400).json({ error: "Missing data" });
    }

    try {
      const fileContent = fs.readFileSync(file.filepath);

      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          files: [
            {
              file: "index.html",
              data: fileContent.toString("base64"),
              encoding: "base64",
            },
          ],
          projectSettings: {
            framework: null,
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        return res.status(200).json({
          success: true,
          url: "https://" + data.url,
        });
      } else {
        return res.status(500).json(data);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}