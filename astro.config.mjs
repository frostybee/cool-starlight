import { defineConfig } from "astro/config";
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import starlightViewModes from 'starlight-view-modes'

import rehypeExternalLinks from "rehype-external-links";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from 'rehype-slug';
import starlightSidebarTopics from "starlight-sidebar-topics";
// TODO: clean the following imports
import mdx from "@astrojs/mdx";
import starlightLinksValidator from 'starlight-links-validator'


const site = 'https://frostybee.github.io/better-starlight';
//@see: https://astro.build/config
export default defineConfig({
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      rehypeHeadingIds,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypeExternalLinks,
        {
          content: {
            type: "text",
            value: " ↗",
          },
          properties: {
            target: "_blank",
          },
          rel: ["noopener"],
        },
      ],
    ],
  },
  integrations: [
    starlight({
      components: {
        Header: './src/components/Header.astro',
      },
      customCss: [
        // Relative path to your custom CSS file
        // "./src/styles/custom_slint.css",
        "./src/styles/custom.css",
        "./src/styles/theme.css",
        // "./src/styles/markdown.css",
        "./src/styles/Linkable_headings.css",
      ],
      lastUpdated: true,
      plugins: [
        starlightImageZoom(),
        starlightViewModes(),
        starlightSidebarTopics(
          [
            {
              label: "Guides",
              link: "/guides/example",
              icon: "open-book",
              items: [
                // Each item here is one entry in the navigation menu.
                {
                  label: "Basic Elements",
                  autogenerate: {
                    directory: "guides/",
                  }
                }
              ],
            },
            {
              label: "Components",
              link: "components",
              icon: "puzzle",
              items: [
                {
                  label: "Components",
                  autogenerate: {
                    directory: "components/",
                  }
                }
              ],
            },
            {
              label: "Reference",
              link: "reference/example",
              icon: "starlight",
              items: [
                {
                  label: "Basic Elements",
                  autogenerate: {
                    directory: "reference/",
                  }
                }
              ],
            },
          ]
        )
      ],
      // plugins: [
      //   starlightLinksValidator({
      //     errorOnFallbackPages: false,
      //   }),
      // ],

      title: 'My Docs',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      //TODO: add the head property.
      // Set English as the default language for this site.
      defaultLocale: "en",

      // sidebar: [
      //   {
      //     label: 'Guides',
      //     items: [
      //       // Each item here is one entry in the navigation menu.
      //       { label: 'Example Guide', slug: 'guides/example' },
      //     ],
      //   },
      //   {
      //     label: 'Components',
      //     autogenerate: { directory: 'components' },
      //   },
      //   {
      //     label: 'Reference',
      //     autogenerate: { directory: 'reference' },
      //   },
      // ],
    }
    ),
  ],
});
