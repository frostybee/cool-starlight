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


const site = 'https://frostybee.github.io/cool-starlight';
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
      title: 'Cool Starlight',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      //TODO: add the head property.
      defaultLocale: "en",
      components: {
        Header: './src/components/Header.astro',
        // TwoColumnContent: './src/components/TwoColumn.astro',
        // PageFrame: './src/components/PageFrame.astro',
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
              link: "components/",
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
