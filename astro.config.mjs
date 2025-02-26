import { defineConfig } from "astro/config";
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import starlightViewModes from 'starlight-view-modes'

import rehypeExternalLinks from "rehype-external-links";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from 'rehype-slug';
import starlightSidebarTopics from "starlight-sidebar-topics";

import guidesSidebar from './src/config/sidebars/guides.ts'
import componentsSidebar from './src/config/sidebars/components.ts'
// TODO: clean the following imports
import mdx from "@astrojs/mdx";
import starlightLinksValidator from 'starlight-links-validator'


const site = 'https://frostybee.github.io/cool-starlight';
//@see: https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Cool Starlight',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      //TODO: add the head property.
      defaultLocale: "en",
      components: {
        Header: './src/components/Header.astro',
      },
      customCss: [
        "./src/styles/custom.css",
        "./src/styles/Linkable-headings.css",
        "./src/styles/sidebar-topics.css",
        "./src/styles/asides.css",
      ],
      lastUpdated: true,
      plugins: [
        starlightImageZoom(),
        // starlightViewModes(),
        starlightSidebarTopics(
          [
            {
              label: "Guides",
              link: "/guides/example",
              icon: "open-book",
              items: [
                ...guidesSidebar
                ],
            },
            {
              label: "Components",
              link: "components/",
              icon: "puzzle",
              items: [
                ...componentsSidebar
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
    }
    ),
  ],
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
});
